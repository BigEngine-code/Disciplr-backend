// Disciplr public API (Vercel serverless entry). Express app, JSON over HTTP.
import express from 'express'
import cors from 'cors'
import { randomBytes } from 'node:crypto'
import { getStore, StoreConflictError } from '../apilib/store.mjs'
import { OPENAPI } from '../apilib/openapi.mjs'

const app = express()
app.disable('x-powered-by')
app.use(cors())
app.use(express.json({ limit: '100kb' }))

const STELLAR = /^G[A-Z2-7]{55}$/
const hex = (n) => randomBytes(n).toString('hex')
const bad = (res, msg, code = 400) => res.status(code).json({ error: msg })
const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: 'Internal error' }) })

const router = express.Router()

router.get('/health', wrap(async (_req, res) => {
  const s = await getStore()
  res.json({ status: 'ok', service: 'disciplr-api', store: s.kind, time: new Date().toISOString() })
}))
router.get('/openapi.json', (_req, res) => res.json(OPENAPI))

router.get('/vaults', wrap(async (req, res) => {
  const s = await getStore()
  const vaults = await s.listVaults({ creator: req.query.creator, status: req.query.status })
  res.json({ data: vaults, count: vaults.length })
}))

router.get('/vaults/:id', wrap(async (req, res) => {
  const s = await getStore()
  const v = await s.getVault(req.params.id)
  if (!v) return bad(res, 'Vault not found', 404)
  res.json({ data: { ...v, activity: await s.listActivity({ vaultId: v.id }) } })
}))

router.post('/vaults', wrap(async (req, res) => {
  const b = req.body || {}
  const errs = []
  if (!STELLAR.test(b.creator || '')) errs.push('creator must be a Stellar public key (G..., 56 chars)')
  if (!STELLAR.test(b.verifier || '')) errs.push('verifier must be a Stellar public key')
  const amount = Number(b.amount)
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) errs.push('amount must be a positive number')
  const end = new Date(b.endDate); const start = b.startDate ? new Date(b.startDate) : new Date()
  if (isNaN(end) || isNaN(start) || end <= start) errs.push('endDate must be a valid date after startDate')
  const ms = Array.isArray(b.milestones) ? b.milestones : []
  if (ms.length < 1 || ms.length > 20) errs.push('between 1 and 20 milestones are required')
  const milestones = ms.map((m, i) => ({
    id: '', title: String(m?.title || '').trim().slice(0, 200), amount: String(Number(m?.amount)),
    dueDate: new Date(m?.dueDate || b.endDate).toISOString(), status: 'pending', _i: i,
  }))
  milestones.forEach((m, i) => {
    if (!m.title) errs.push(`milestone ${i + 1}: title is required`)
    if (!(Number(m.amount) >= 0)) errs.push(`milestone ${i + 1}: amount must be >= 0`)
    if (isNaN(new Date(m.dueDate))) errs.push(`milestone ${i + 1}: invalid dueDate`)
  })
  if (errs.length) return res.status(400).json({ error: 'Validation failed', details: errs })
  const id = 'vault-' + hex(6)
  milestones.forEach((m, i) => { m.id = `${id}-m${i + 1}`; delete m._i })
  const now = new Date().toISOString()
  const s = await getStore()
  const vault = {
    id, name: String(b.name || '').trim().slice(0, 200) || `Vault ${amount}`, creator: b.creator, amount: String(amount), status: 'active', startDate: start.toISOString(), endDate: end.toISOString(),
    verifier: b.verifier, successDestination: STELLAR.test(b.successDestination || '') ? b.successDestination : b.creator,
    failureDestination: STELLAR.test(b.failureDestination || '') ? b.failureDestination : b.verifier,
    createdAt: now, updatedAt: now, milestones,
  }
  await s.createVault(vault)
  await s.addActivity({ id: crypto.randomUUID(), type: 'create', vaultId: id, amount: vault.amount, status: 'confirmed', hash: hex(32), memo: 'Vault created', createdAt: now })
  res.status(201).json({ data: vault })
}))

// Verifier validates a milestone. When every milestone is validated the vault completes and funds release.
router.post('/vaults/:id/milestones/:mid/validate', wrap(async (req, res) => {
  const s = await getStore()
  const vault = await s.getVault(req.params.id)
  if (!vault) return bad(res, 'Vault not found', 404)
  if (req.body?.verifier !== vault.verifier) return bad(res, 'Only the vault verifier may validate milestones', 403)
  const target = vault.milestones.find((x) => x.id === req.params.mid)
  if (!target) return bad(res, 'Milestone not found', 404)
  if (vault.status !== 'active') return bad(res, `Vault is ${vault.status}`, 409)
  if (target.status === 'completed') return bad(res, 'Milestone already validated', 409)
  if (target.status === 'failed' || target.status === 'cancelled') return bad(res, `Milestone is ${target.status}`, 409)

  try {
    const result = await s.transition(vault.id, async (current) => {
      const liveVault = current
      if (!liveVault) return { conflict: true, error: 'Vault not found', vaultStatus: 'active', milestoneUpdates: [], activities: [] }
      if (liveVault.status !== 'active') return { conflict: true, error: `Vault is ${liveVault.status}`, vaultStatus: liveVault.status, milestoneUpdates: [], activities: [] }
      const milestone = liveVault.milestones.find((m) => m.id === req.params.mid)
      if (!milestone) return { conflict: true, error: 'Milestone not found', vaultStatus: liveVault.status, milestoneUpdates: [], activities: [] }
      if (milestone.status === 'completed') return { conflict: true, error: 'Milestone already validated', vaultStatus: liveVault.status, milestoneUpdates: [], activities: [] }
      if (milestone.status === 'failed' || milestone.status === 'cancelled') return { conflict: true, error: `Milestone is ${milestone.status}`, vaultStatus: liveVault.status, milestoneUpdates: [], activities: [] }

      const updatedMilestone = { ...milestone, status: 'completed' }
      const milestoneUpdates = [{ id: updatedMilestone.id, status: 'completed' }]
      const activities = [{
        id: crypto.randomUUID(),
        type: 'validate',
        vaultId: liveVault.id,
        amount: updatedMilestone.amount,
        status: 'confirmed',
        hash: hex(32),
        memo: `Milestone validated: ${updatedMilestone.title}`,
        createdAt: new Date().toISOString(),
      }]

      let vaultStatus = liveVault.status
      if (liveVault.milestones.every((m) => m.id === updatedMilestone.id || m.status === 'completed')) {
        vaultStatus = 'completed'
        activities.push({
          id: crypto.randomUUID(),
          type: 'release',
          vaultId: liveVault.id,
          amount: liveVault.amount,
          status: 'confirmed',
          hash: hex(32),
          memo: 'Funds released to success destination',
          createdAt: new Date(Date.now() + 1).toISOString(),
        })
      }
      return { vaultStatus, milestoneUpdates, activities }
    })

    if (!result) return bad(res, 'Vault not found', 404)
    res.json({ data: result.vault })
  } catch (error) {
    if (error instanceof StoreConflictError) return bad(res, error.message, 409)
    throw error
  }
}))

// Verifier (or creator) declares failure: funds redirect to the failure destination.
router.post('/vaults/:id/fail', wrap(async (req, res) => {
  const s = await getStore()
  const vault = await s.getVault(req.params.id)
  if (!vault) return bad(res, 'Vault not found', 404)
  if (req.body?.verifier !== vault.verifier) return bad(res, 'Only the vault verifier may fail a vault', 403)
  if (vault.status !== 'active') return bad(res, `Vault is ${vault.status}`, 409)

  try {
    const result = await s.transition(vault.id, async (current) => {
      const liveVault = current
      if (!liveVault) return { conflict: true, error: 'Vault not found', vaultStatus: 'active', milestoneUpdates: [], activities: [] }
      if (liveVault.status !== 'active') return { conflict: true, error: `Vault is ${liveVault.status}`, vaultStatus: liveVault.status, milestoneUpdates: [], activities: [] }
      const milestoneUpdates = liveVault.milestones.map((m) => ({
        id: m.id,
        status: m.status === 'completed' ? 'completed' : 'failed',
      }))
      return {
        vaultStatus: 'failed',
        milestoneUpdates,
        activities: [{
          id: crypto.randomUUID(),
          type: 'redirect',
          vaultId: liveVault.id,
          amount: liveVault.amount,
          status: 'confirmed',
          hash: hex(32),
          memo: 'Funds redirected to failure destination',
          createdAt: new Date().toISOString(),
        }],
      }
    })

    if (!result) return bad(res, 'Vault not found', 404)
    res.json({ data: result.vault })
  } catch (error) {
    if (error instanceof StoreConflictError) return bad(res, error.message, 409)
    throw error
  }
}))

router.get('/transactions', wrap(async (req, res) => {
  const s = await getStore()
  const data = await s.listActivity({ vaultId: req.query.vaultId })
  res.json({ data, count: data.length })
}))

router.get('/stats', wrap(async (req, res) => {
  const s = await getStore()
  const vaults = await s.listVaults({ creator: req.query.creator })
  const sum = (f) => vaults.filter(f).reduce((a, v) => a + Number(v.amount), 0)
  const done = vaults.filter((v) => v.status !== 'active')
  res.json({
    data: {
      totalVaults: vaults.length,
      active: vaults.filter((v) => v.status === 'active').length,
      completed: vaults.filter((v) => v.status === 'completed').length,
      failed: vaults.filter((v) => v.status === 'failed').length,
      totalLocked: sum((v) => v.status === 'active'),
      totalReleased: sum((v) => v.status === 'completed'),
      totalRedirected: sum((v) => v.status === 'failed'),
      successRate: done.length ? Math.round((vaults.filter((v) => v.status === 'completed').length / done.length) * 100) : null,
    },
  })
}))

app.use(['/api/v1', '/api'], router)
app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

export default app

if (process.argv[1] && process.argv[1].endsWith('api/index.mjs')) {
  const port = process.env.PORT || 3001
  app.listen(port, () => console.log(`Disciplr API on :${port}`))
}
