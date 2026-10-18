import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'
import app from '../../index.mjs'

test('GET /health returns 200 and store info', async () => {
  const res = await request(app).get('/api/health')
  assert.equal(res.status, 200)
  assert.equal(res.body.status, 'ok')
  assert.equal(res.body.service, 'disciplr-api')
  assert.ok(res.body.store === 'postgres' || res.body.store === 'memory')
  assert.ok(res.body.time)

  if (process.env.DATABASE_URL) {
    assert.equal(res.body.store, 'postgres')
  } else {
    assert.equal(res.body.store, 'memory')
  }
})

test('GET /openapi.json returns valid OpenAPI document', async () => {
  const res = await request(app).get('/api/openapi.json')
  assert.equal(res.status, 200)
  assert.equal(res.body.openapi, '3.0.3')
  assert.ok(res.body.paths)
  assert.ok(res.body.paths['/health'])
  assert.ok(res.body.paths['/vaults'])
})
