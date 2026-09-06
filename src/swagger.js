const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'Task API',
      version: '1.0.0',
      description: 'REST API for managing tasks with Supabase authentication.',
    },

    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],

    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and session management',
      },
      {
        name: 'Tasks',
        description: 'Task management operations',
      },
      {
        name: 'Profile',
        description: 'Protected user profile endpoints',
      },
      {
        name: 'Public',
        description: 'Public endpoints',
      },
      {
        name: 'System',
        description: 'API information and health checks',
      },
    ],

    components: {
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Learn Express.js',
            },
            done: {
              type: 'boolean',
              example: false,
            },
          },
        },

        NewTask: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              example: 'Learn PostgreSQL',
            },
          },
        },

        UpdateTask: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              example: 'Learn PostgreSQL deeply',
            },
            done: {
              type: 'boolean',
              example: true,
            },
          },
        },

        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2026-09-06T10:00:00Z',
            },
          },
        },

        AuthTokens: {
          type: 'object',
          properties: {
            access_token: {
              type: 'string',
              example: 'eyJhbGciOiJIUzI1NiIs...',
            },
            refresh_token: {
              type: 'string',
              example: 'refresh-token-value',
            },
          },
        },

        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              example: 'Invalid login credentials',
            },
          },
        },
      },

      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter the Supabase access token.',
        },
      },
    },
  },

  apis: ['./app.js'],
};

module.exports = swaggerJSDoc(options);
