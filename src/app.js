const express = require('express');
const morgan = require('morgan');
const swaggerui = require('swagger-ui-express');
const openapiSpec = require('./swagger');
const { SQLOperations } = require('./db/db.js');
const supabaseClient = require('./supabase.js');
const APIFeatures = require('./api_features.js');
const authMiddleware = require('./middleware/auth.js');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/docs', swaggerui.serve, swaggerui.setup(openapiSpec));

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: hunter2
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 access_token:
 *                   type: string
 *                 refresh_token:
 *                   type: string
 *       400:
 *         description: Signup failed (e.g. invalid email, weak password, user already exists)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /auth/signin:
 *   post:
 *     summary: Sign in an existing user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: hunter2
 *     responses:
 *       200:
 *         description: Signed in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid login credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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
      error: err,
    });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Sign out the current user
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       500:
 *         description: Logout failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabaseClient.auth.signOut();

    if (error) throw error;

    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Logout failed',
    });
  }
});

/**
 * @swagger
 * /protected/profile:
 *   post:
 *     summary: Get the authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
app.post('/protected/profile', authMiddleware, (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      email: req.user.email,
      created_at: req.user.created_at,
    },
  });
});

/**
 * @swagger
 * /public/info:
 *   get:
 *     summary: Public informational endpoint
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: Public welcome message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Welcome stranger! This info is public.
 */
app.get('/public/info', (req, res) => {
  res.status(200).json({
    message: 'Welcome stranger! This info is public.',
  });
});

/**
 * @swagger
 * /:
 *   get:
 *     summary: API information
 *     tags: [System]
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
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
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
 *                 result:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
app.get('/tasks', authMiddleware, async (req, res) => {
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
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
app.get('/stats', authMiddleware, async (req, res) => {
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
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
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
 *                 result:
 *                   $ref: '#/components/schemas/Task'
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Task not found
 */
app.get('/tasks/:id', authMiddleware, async (req, res) => {
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
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized (missing or invalid token)
 */
app.post('/tasks', authMiddleware, async (req, res) => {
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
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
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
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Task not found
 */
app.put('/tasks/:id', authMiddleware, async (req, res) => {
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
 *     tags: [Tasks]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Task deleted
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: Task not found
 */
app.delete('/tasks/:id', authMiddleware, async (req, res) => {
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
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
