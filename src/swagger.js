const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task API',
      version: '1.0.0',
      description: 'Simple in-memory Task API built with Express.',
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            title: { type: 'string', example: 'Learn Express.js' },
            done: { type: 'boolean', example: false },
          },
        },
        NewTask: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Buy milk' },
          },
        },
        UpdateTask: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Buy groceries' },
            done: { type: 'boolean', example: true },
          },
        },
      },
    },
  },
  // Files to scan for `@swagger` JSDoc comments.
  apis: ['./src/app.js'],
};

module.exports = swaggerJsdoc(options);
