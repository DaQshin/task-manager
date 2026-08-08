'use strict';

/**
 * Task API
 *
 * A simple in-memory REST API built with Express.
 *
 */

const express = require('express');
const morgan = require('morgan');
const swaggerui = require('swagger-ui-express');
const openapi = require('../docs/openapi.json');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/docs', swaggerui.serve, swaggerui.setup(openapi));

/**
 * In-memory task store. Reset on every server restart.
 * @type {Array<{ id: number, title: string, done: boolean }>}
 */
var tasks = [
  {
    id: 1,
    title: 'Learn Express.js',
    done: false,
  },
  {
    id: 2,
    title: 'Build Todo API',
    done: true,
  },
  {
    id: 3,
    title: 'Write Swagger Documentation',
    done: false,
  },
];

app.get('/', (req, res) => {
  res
    .status(200)
    .json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

/**
 * @route GET /tasks
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {void} 200 with `{ tasks }`
 */
app.get('/tasks', (req, res) => {
  let result = tasks;

  if (req.query.done !== undefined) {
    const done = req.query.done === 'true';
    result = result.filter((r) => r.done === done);
  }

  if (req.query.search !== undefined) {
    const term = req.query.search.toLowerCase();
    result = result.filter((r) => r.title.toLowerCase().includes(term));
  }

  res.status(200).json({
    result,
  });
});

/**
 * @route GET /tasks/:id
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {void} 200 with `{ task }`, or 404 if not found
 */
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= tasks.length)
    res.status(404).json({ error: `Task ${id} not found` });
  const task = tasks.find((t) => t.id === id);
  res.status(200).json({
    task,
  });
});

/**
 * @route POST /tasks
 * @param {express.Request} req - body: `{ title: string }`
 * @param {express.Response} res
 * @returns {void} 201 on success, 400 if `title` is empty
 */
app.post('/tasks', (req, res) => {
  const title = req.body.title;
  if (title === '') res.status(400).json({});
  tasks.push({ id: tasks.length, title, done: false });
  res.status(201).json({ message: 'task added successfully' });
});

/**
 * @route PUT /tasks/:id
 * @param {express.Request} req - body: `{ title?: string, done?: boolean }`
 * @param {express.Response} res
 * @returns {void} 202 on success, 400 if fields missing, 404 if not found
 */
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id >= tasks.length) res.status(404).json({});
  const title = req.body.title;
  const done = req.body.done;

  if (title === undefined || done === undefined) res.status(400).json({});

  if (title != undefined) {
    tasks[id].title = title;
  }
  if (done != undefined) {
    tasks[id].done = done;
  }

  res.status(202).json({});
});

/**
 * @route DELETE /tasks/:id
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {void} 204 on success, 404 if not found
 */
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id >= tasks.length) res.status(404).json({});
  tasks.splice(id, 1);
  res.status(204).json({});
});

app.get('/stats', (req, res) => {
  let stats = {
    total: tasks.length,
    done: tasks.filter((r) => r.done === true),
    pending: tasks.filter((r) => r.done !== true),
  };

  res.json(stats);
});

/**
 * @route GET /health
 * @param {express.Request} req
 * @param {express.Response} res
 * @returns {void} 200 with `{ status: 'ok' }`
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
