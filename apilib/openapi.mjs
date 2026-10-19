const err = {
  description: 'Error',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: { error: 'Validation failed', details: ['amount must be a positive number'] },
    },
  },
}

export const OPENAPI = {
  openapi: '3.0.3',
  info: {
    title: 'Disciplr API',
    version: '0.1.0',
    description: 'Commitment vaults on Stellar: lock funds against milestones; a verifier validates progress; funds release on success or redirect on failure.',
  },
  servers: [{ url: '/api' }],
  paths: {
    '/health': {
      get: {
        operationId: 'getHealth',
        summary: 'Health check and active data store',
        responses: {
          200: {
            description: 'Health status and active storage engine',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Health' },
                example: {
                  status: 'ok',
                  service: 'disciplr-api',
                  store: 'postgres',
                  time: '2026-04-20T12:00:00.000Z',
                },
              },
            },
          },
        },
      },
    },
    '/openapi.json': {
      get: {
        operationId: 'getOpenApiSpec',
        summary: 'OpenAPI 3.0 specification document',
        responses: {
          200: {
            description: 'OpenAPI specification JSON',
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        },
      },
    },
    '/vaults': {
      get: {
        operationId: 'listVaults',
        summary: 'List vaults',
        parameters: [
          { name: 'creator', in: 'query', schema: { $ref: '#/components/schemas/StellarAddress' }, description: 'Filter by creator Stellar address' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['active', 'completed', 'failed'] }, description: 'Filter by vault status' },
        ],
        responses: {
          200: {
            description: 'List of commitment vaults',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VaultList' },
                example: {
                  data: [
                    {
                      id: 'vault-demo-001',
                      name: 'Launch the MVP',
                      creator: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                      amount: '2500',
                      status: 'active',
                      startDate: '2026-03-31T12:00:00.000Z',
                      endDate: '2026-05-30T12:00:00.000Z',
                      verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
                      successDestination: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                      failureDestination: 'GCAJ2QOEXTR7AB5PJXSAO2HEISE2VEIUIX7CP3F3MOYVX7GMADB7KX22',
                      createdAt: '2026-03-31T12:00:00.000Z',
                      updatedAt: '2026-03-31T12:00:00.000Z',
                      milestones: [
                        {
                          id: 'vault-demo-001-m1',
                          title: 'Ship MVP',
                          amount: '1000',
                          dueDate: '2026-04-30T12:00:00.000Z',
                          status: 'completed',
                        },
                      ],
                    },
                  ],
                  count: 1,
                },
              },
            },
          },
        },
      },
      post: {
        operationId: 'createVault',
        summary: 'Create a vault',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateVaultRequest' },
              example: {
                name: 'Launch the MVP',
                creator: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
                amount: 2500,
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-05-01T00:00:00.000Z',
                successDestination: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                failureDestination: 'GCAJ2QOEXTR7AB5PJXSAO2HEISE2VEIUIX7CP3F3MOYVX7GMADB7KX22',
                milestones: [
                  {
                    title: 'Ship MVP',
                    amount: 1000,
                    dueDate: '2026-04-15T00:00:00.000Z',
                  },
                  {
                    title: 'Public Launch',
                    amount: 1500,
                    dueDate: '2026-05-01T00:00:00.000Z',
                  },
                ],
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Vault created successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VaultEnvelope' },
                example: {
                  data: {
                    id: 'vault-a1b2c3d4e5f6',
                    name: 'Launch the MVP',
                    creator: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    amount: '2500',
                    status: 'active',
                    startDate: '2026-04-01T00:00:00.000Z',
                    endDate: '2026-05-01T00:00:00.000Z',
                    verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
                    successDestination: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    failureDestination: 'GCAJ2QOEXTR7AB5PJXSAO2HEISE2VEIUIX7CP3F3MOYVX7GMADB7KX22',
                    createdAt: '2026-04-01T00:00:00.000Z',
                    updatedAt: '2026-04-01T00:00:00.000Z',
                    milestones: [
                      {
                        id: 'vault-a1b2c3d4e5f6-m1',
                        title: 'Ship MVP',
                        amount: '1000',
                        dueDate: '2026-04-15T00:00:00.000Z',
                        status: 'pending',
                      },
                    ],
                  },
                },
              },
            },
          },
          400: err,
        },
      },
    },
    '/vaults/{id}': {
      get: {
        operationId: 'getVaultById',
        summary: 'Get a vault with its activity',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Unique vault ID' },
        ],
        responses: {
          200: {
            description: 'Vault detail including activity history',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VaultWithActivityEnvelope' },
                example: {
                  data: {
                    id: 'vault-demo-001',
                    name: 'Launch the MVP',
                    creator: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    amount: '2500',
                    status: 'active',
                    startDate: '2026-03-31T12:00:00.000Z',
                    endDate: '2026-05-30T12:00:00.000Z',
                    verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
                    successDestination: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    failureDestination: 'GCAJ2QOEXTR7AB5PJXSAO2HEISE2VEIUIX7CP3F3MOYVX7GMADB7KX22',
                    createdAt: '2026-03-31T12:00:00.000Z',
                    updatedAt: '2026-03-31T12:00:00.000Z',
                    milestones: [
                      {
                        id: 'vault-demo-001-m1',
                        title: 'Ship MVP',
                        amount: '1000',
                        dueDate: '2026-04-30T12:00:00.000Z',
                        status: 'completed',
                      },
                    ],
                    activity: [
                      {
                        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                        type: 'create',
                        vaultId: 'vault-demo-001',
                        amount: '2500',
                        status: 'confirmed',
                        hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                        memo: 'Vault created',
                        createdAt: '2026-03-31T12:00:00.000Z',
                      },
                    ],
                  },
                },
              },
            },
          },
          404: err,
        },
      },
    },
    '/vaults/{id}/milestones/{mid}/validate': {
      post: {
        operationId: 'validateMilestone',
        summary: 'Verifier validates a milestone (body: {verifier})',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Unique vault ID' },
          { name: 'mid', in: 'path', required: true, schema: { type: 'string' }, description: 'Milestone ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifierActionRequest' },
              example: {
                verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated vault state after milestone validation',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VaultEnvelope' },
                example: {
                  data: {
                    id: 'vault-demo-001',
                    name: 'Launch the MVP',
                    creator: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    amount: '2500',
                    status: 'active',
                    startDate: '2026-03-31T12:00:00.000Z',
                    endDate: '2026-05-30T12:00:00.000Z',
                    verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
                    successDestination: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    failureDestination: 'GCAJ2QOEXTR7AB5PJXSAO2HEISE2VEIUIX7CP3F3MOYVX7GMADB7KX22',
                    createdAt: '2026-03-31T12:00:00.000Z',
                    updatedAt: '2026-04-01T12:00:00.000Z',
                    milestones: [
                      {
                        id: 'vault-demo-001-m1',
                        title: 'Ship MVP',
                        amount: '1000',
                        dueDate: '2026-04-30T12:00:00.000Z',
                        status: 'completed',
                      },
                    ],
                  },
                },
              },
            },
          },
          400: err,
          403: err,
          404: err,
          409: err,
        },
      },
    },
    '/vaults/{id}/fail': {
      post: {
        operationId: 'failVault',
        summary: 'Verifier fails a vault; funds redirect (body: {verifier})',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Unique vault ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifierActionRequest' },
              example: {
                verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Updated vault state after failure declaration',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/VaultEnvelope' },
                example: {
                  data: {
                    id: 'vault-demo-001',
                    name: 'Launch the MVP',
                    creator: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    amount: '2500',
                    status: 'failed',
                    startDate: '2026-03-31T12:00:00.000Z',
                    endDate: '2026-05-30T12:00:00.000Z',
                    verifier: 'GDLYZ73G3GEF36HBLEBFXOXAP5IXJDRQCRG47JCKR4XAXNOFCU44NZT2',
                    successDestination: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
                    failureDestination: 'GCAJ2QOEXTR7AB5PJXSAO2HEISE2VEIUIX7CP3F3MOYVX7GMADB7KX22',
                    createdAt: '2026-03-31T12:00:00.000Z',
                    updatedAt: '2026-04-01T12:00:00.000Z',
                    milestones: [
                      {
                        id: 'vault-demo-001-m1',
                        title: 'Ship MVP',
                        amount: '1000',
                        dueDate: '2026-04-30T12:00:00.000Z',
                        status: 'failed',
                      },
                    ],
                  },
                },
              },
            },
          },
          400: err,
          403: err,
          404: err,
          409: err,
        },
      },
    },
    '/transactions': {
      get: {
        operationId: 'listTransactions',
        summary: 'Activity feed (create / validate / release / redirect)',
        parameters: [
          { name: 'vaultId', in: 'query', schema: { type: 'string' }, description: 'Filter activity by vault ID' },
        ],
        responses: {
          200: {
            description: 'Activity history list',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ActivityList' },
                example: {
                  data: [
                    {
                      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
                      type: 'create',
                      vaultId: 'vault-demo-001',
                      amount: '2500',
                      status: 'confirmed',
                      hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                      memo: 'Vault created',
                      createdAt: '2026-03-31T12:00:00.000Z',
                    },
                  ],
                  count: 1,
                },
              },
            },
          },
        },
      },
    },
    '/stats': {
      get: {
        operationId: 'getStats',
        summary: 'Aggregate statistics',
        parameters: [
          { name: 'creator', in: 'query', schema: { $ref: '#/components/schemas/StellarAddress' }, description: 'Filter stats by creator Stellar address' },
        ],
        responses: {
          200: {
            description: 'Aggregate platform statistics',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StatsEnvelope' },
                example: {
                  data: {
                    totalVaults: 3,
                    active: 1,
                    completed: 1,
                    failed: 1,
                    totalLocked: 2500,
                    totalReleased: 800,
                    totalRedirected: 1200,
                    successRate: 50,
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      StellarAddress: {
        type: 'string',
        pattern: '^G[A-Z2-7]{55}$',
        description: 'Stellar public key (56 characters starting with G)',
        example: 'GBVAQKGA5P4TIZSZJBS5AW3XNJOTYG6I3Y5CLIGCBBUZDHMVF7YE7XCQ',
      },
      Amount: {
        type: 'string',
        description: 'Monetary amount represented as a numeric string',
        example: '1000',
      },
      Error: {
        type: 'object',
        required: ['error'],
        additionalProperties: true,
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Vault not found',
          },
          details: {
            type: 'array',
            items: { type: 'string' },
            description: 'Detailed validation error messages',
            example: ['amount must be a positive number'],
          },
        },
      },
      Health: {
        type: 'object',
        required: ['status', 'service', 'store', 'time'],
        additionalProperties: false,
        properties: {
          status: { type: 'string', example: 'ok' },
          service: { type: 'string', example: 'disciplr-api' },
          store: { type: 'string', enum: ['postgres', 'memory'], example: 'postgres' },
          time: { type: 'string', format: 'date-time', example: '2026-04-20T12:00:00.000Z' },
        },
      },
      Milestone: {
        type: 'object',
        required: ['id', 'title', 'amount', 'dueDate', 'status'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', example: 'vault-demo-001-m1' },
          title: { type: 'string', example: 'Ship MVP' },
          amount: { $ref: '#/components/schemas/Amount' },
          dueDate: { type: 'string', format: 'date-time', example: '2026-04-30T12:00:00.000Z' },
          status: { type: 'string', enum: ['pending', 'completed', 'failed'], example: 'pending' },
        },
      },
      Vault: {
        type: 'object',
        required: [
          'id',
          'name',
          'creator',
          'amount',
          'status',
          'startDate',
          'endDate',
          'verifier',
          'successDestination',
          'failureDestination',
          'createdAt',
          'updatedAt',
          'milestones',
        ],
        additionalProperties: false,
        properties: {
          id: { type: 'string', example: 'vault-demo-001' },
          name: { type: 'string', example: 'Launch the MVP' },
          creator: { $ref: '#/components/schemas/StellarAddress' },
          amount: { $ref: '#/components/schemas/Amount' },
          status: { type: 'string', enum: ['active', 'completed', 'failed'], example: 'active' },
          startDate: { type: 'string', format: 'date-time', example: '2026-03-31T12:00:00.000Z' },
          endDate: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00.000Z' },
          verifier: { $ref: '#/components/schemas/StellarAddress' },
          successDestination: { $ref: '#/components/schemas/StellarAddress' },
          failureDestination: { $ref: '#/components/schemas/StellarAddress' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-03-31T12:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-03-31T12:00:00.000Z' },
          milestones: {
            type: 'array',
            items: { $ref: '#/components/schemas/Milestone' },
          },
        },
      },
      Activity: {
        type: 'object',
        required: ['id', 'type', 'vaultId', 'amount', 'status', 'hash', 'memo', 'createdAt'],
        additionalProperties: false,
        properties: {
          id: { type: 'string', example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
          type: { type: 'string', enum: ['create', 'validate', 'release', 'redirect'], example: 'create' },
          vaultId: { type: 'string', example: 'vault-demo-001' },
          amount: { $ref: '#/components/schemas/Amount' },
          status: { type: 'string', example: 'confirmed' },
          hash: { type: 'string', example: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08' },
          memo: { type: ['string', 'null'], example: 'Vault created' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-03-31T12:00:00.000Z' },
        },
      },
      VaultWithActivity: {
        type: 'object',
        required: [
          'id',
          'name',
          'creator',
          'amount',
          'status',
          'startDate',
          'endDate',
          'verifier',
          'successDestination',
          'failureDestination',
          'createdAt',
          'updatedAt',
          'milestones',
          'activity',
        ],
        additionalProperties: false,
        properties: {
          id: { type: 'string', example: 'vault-demo-001' },
          name: { type: 'string', example: 'Launch the MVP' },
          creator: { $ref: '#/components/schemas/StellarAddress' },
          amount: { $ref: '#/components/schemas/Amount' },
          status: { type: 'string', enum: ['active', 'completed', 'failed'], example: 'active' },
          startDate: { type: 'string', format: 'date-time', example: '2026-03-31T12:00:00.000Z' },
          endDate: { type: 'string', format: 'date-time', example: '2026-05-30T12:00:00.000Z' },
          verifier: { $ref: '#/components/schemas/StellarAddress' },
          successDestination: { $ref: '#/components/schemas/StellarAddress' },
          failureDestination: { $ref: '#/components/schemas/StellarAddress' },
          createdAt: { type: 'string', format: 'date-time', example: '2026-03-31T12:00:00.000Z' },
          updatedAt: { type: 'string', format: 'date-time', example: '2026-03-31T12:00:00.000Z' },
          milestones: {
            type: 'array',
            items: { $ref: '#/components/schemas/Milestone' },
          },
          activity: {
            type: 'array',
            items: { $ref: '#/components/schemas/Activity' },
          },
        },
      },
      Stats: {
        type: 'object',
        required: [
          'totalVaults',
          'active',
          'completed',
          'failed',
          'totalLocked',
          'totalReleased',
          'totalRedirected',
          'successRate',
        ],
        additionalProperties: false,
        properties: {
          totalVaults: { type: 'integer', example: 3 },
          active: { type: 'integer', example: 1 },
          completed: { type: 'integer', example: 1 },
          failed: { type: 'integer', example: 1 },
          totalLocked: { type: 'number', example: 2500 },
          totalReleased: { type: 'number', example: 800 },
          totalRedirected: { type: 'number', example: 1200 },
          successRate: { type: ['number', 'null'], example: 50 },
        },
      },
      VaultEnvelope: {
        type: 'object',
        required: ['data'],
        additionalProperties: false,
        properties: {
          data: { $ref: '#/components/schemas/Vault' },
        },
      },
      VaultWithActivityEnvelope: {
        type: 'object',
        required: ['data'],
        additionalProperties: false,
        properties: {
          data: { $ref: '#/components/schemas/VaultWithActivity' },
        },
      },
      VaultList: {
        type: 'object',
        required: ['data', 'count'],
        additionalProperties: false,
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Vault' },
          },
          count: { type: 'integer', example: 1 },
        },
      },
      ActivityList: {
        type: 'object',
        required: ['data', 'count'],
        additionalProperties: false,
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/Activity' },
          },
          count: { type: 'integer', example: 1 },
        },
      },
      StatsEnvelope: {
        type: 'object',
        required: ['data'],
        additionalProperties: false,
        properties: {
          data: { $ref: '#/components/schemas/Stats' },
        },
      },
      CreateMilestoneRequest: {
        type: 'object',
        required: ['title', 'amount'],
        additionalProperties: false,
        properties: {
          title: { type: 'string', example: 'Ship MVP' },
          amount: { type: 'number', example: 1000 },
          dueDate: { type: 'string', format: 'date-time', example: '2026-04-15T00:00:00.000Z' },
        },
      },
      CreateVaultRequest: {
        type: 'object',
        required: ['creator', 'verifier', 'amount', 'endDate', 'milestones'],
        additionalProperties: false,
        properties: {
          name: { type: 'string', example: 'Launch the MVP' },
          creator: { $ref: '#/components/schemas/StellarAddress' },
          verifier: { $ref: '#/components/schemas/StellarAddress' },
          amount: { type: 'number', example: 2500 },
          startDate: { type: 'string', format: 'date-time', example: '2026-04-01T00:00:00.000Z' },
          endDate: { type: 'string', format: 'date-time', example: '2026-05-01T00:00:00.000Z' },
          successDestination: { $ref: '#/components/schemas/StellarAddress' },
          failureDestination: { $ref: '#/components/schemas/StellarAddress' },
          milestones: {
            type: 'array',
            minItems: 1,
            maxItems: 20,
            items: { $ref: '#/components/schemas/CreateMilestoneRequest' },
          },
        },
      },
      VerifierActionRequest: {
        type: 'object',
        required: ['verifier'],
        additionalProperties: false,
        properties: {
          verifier: { $ref: '#/components/schemas/StellarAddress' },
        },
      },
    },
  },
}
