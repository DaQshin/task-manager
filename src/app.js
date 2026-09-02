const express = require('express');
const morgan = require('morgan');
const swaggerui = require('swagger-ui-express');
const openapiSpec = require('./swagger');
const { SQLOperations } = require('./db/db.js');
const supabaseClient = require('./supabase.js');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/docs', swaggerui.serve, swaggerui.setup(openapiSpec));

app.post('/auth/signup', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    });

    if (error) throw error;

    return res.status(201).json({
      user: data.user,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.post('/auth/signin', async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid login credentials',
    });
  }
});

app.get('/public/info', (req, res) => {
  res.status(200).json({
    message: 'Welcome stranger! This info is public.',
  });
});

app.get('/protected/profile', (req, res) => {
  console.log(req.headers);

  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: 'Access token required ' });
  }

  const token = authorization.split(' ')[1];

  const { data, error } = supabaseClient.auth.getUser(token);

  if (error) {
    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }

  return res.status(200).json({
    token,
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     responses:
 *       200:
 *         description: API metadata
 */
app.get('/', (req, res) => {
  res
    .status(200)
    .json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     parameters:
 *       - in: query
 *         name: done
 *         schema:
 *           type: boolean
 *         required: false
 *         description: Filter by completion status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         required: false
 *         description: Case-insensitive substring match on title
 *     responses:
 *       200:
 *         description: Returns all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 */
app.get('/tasks', async (req, res) => {
  const queryObj = new APIFeatures(req.query);

  const row = await SQLOperations.getAll();
  res.json({
    result: row,
  });
});

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Task counts
 *     responses:
 *       200:
 *         description: Total, done, and open task counts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 done:
 *                   type: integer
 *                   example: 1
 *                 open:
 *                   type: integer
 *                   example: 2
 */
app.get('/stats', async (req, res) => {
  const row = await SQLOperations.getAll();
  const total = row.length;
  const done = row.filter((r) => row.done === true).length;
  res.json({
    total,
    done,
    open: total - done,
  });
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
app.get('/tasks/:id', async (req, res) => {
  const row = await SQLOperations.getOne(req.params.id);
  res.json({
    result: row,
  });
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewTask'
 *     responses:
 *       201:
 *         description: Task created
 *       400:
 *         description: Invalid request
 */
app.post('/tasks', async (req, res) => {
  try {
    const row = await SQLOperations.createOne(req.body.title);
    res.status(201).json({ row });
  } catch (e) {
    res.status(400).json({
      error: 'Data creation failed.',
      stacktrace: e,
    });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update an existing task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTask'
 *     responses:
 *       202:
 *         description: Task updated
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Task not found
 */
app.put('/tasks/:id', async (req, res) => {
  try {
    const row = await SQLOperations.updateOne(
      req.params.id,
      req.body.title,
      req.body.done,
    );
    res.status(204).json({ row });
  } catch (e) {
    res.status(400).json({
      error: 'Data updation failed.',
      stacktracce: e,
    });
  }
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Task deleted
 *       404:
 *         description: Task not found
 */
app.delete('/tasks/:id', async (req, res) => {
  try {
    const row = await SQLOperations.deleteOne(req.params.id);
    res.status(204).json({ row });
  } catch (e) {
    res.status(400).json({
      error: 'Deletion failed.',
      stacktrace: e,
    });
  }
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Server is healthy
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
