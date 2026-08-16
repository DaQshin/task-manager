const express = require('express');
const morgan = require('morgan');
const swaggerui = require('swagger-ui-express');
const openapiSpec = require('./swagger');
const db = require('./db/db.js');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/docs', swaggerui.serve, swaggerui.setup(openapiSpec));

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
app.get('/tasks', (req, res) => {
  db.all('SELECT * FROM TASKS', [], (err, result) => {
    console.log('error :', err);
    console.log('result :', result);

    if (err) {
      return res.status(500).json({ error: err });
    }

    if (req.query.done !== undefined) {
      const done = req.query.done == 'true';
      result = result.filter((t) => t.done == done);
    }

    if (req.query.search !== undefined) {
      const title = req.query.search.toLowerCase();
      result = result.filter((t) => t.title.includes(title));
    }

    res.json({
      result,
    });
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
app.get('/stats', (req, res) => {
  db.all('SELECT * FROM TASKS', [], (err, result) => {
    console.log('error :', err);
    console.log('result :', result);

    if (err) {
      return res.status(500).json({ error: err });
    }

    const total = result.length;
    const done = result.filter((t) => t.done == true).length;
    res.json({
      total,
      done,
      open: total - done,
    });
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
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  db.get('SELECT * FROM TASKS WHERE id = ?', [id], (err, result) => {
    console.log('error :', err);
    console.log('result :', result);

    if (err) {
      return res.status(500).json({ error: err });
    }

    if (result) {
      res.json({
        result,
      });
    } else {
      res.status(404).json({ error: `Task ${id} not found` });
    }
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
app.post('/tasks', (req, res) => {
  const title = req.body.title;
  if (title === '') res.status(400).json({});

  const stmt = db.prepare('INSERT INTO TASKS (title, done) VALUES (? , ?)');
  stmt.run(title, false, (err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    stmt.finalize((err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        message: 'task added successfully',
      });
    });
  });
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
app.put('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const title = req.body.title;
  const done = req.body.done;

  if (title === undefined && done === undefined) res.status(400).json({});

  db.get('SELECT * FROM TASKS WHERE id = ?', [id], (err, result) => {
    console.log('error :', err);
    console.log('result :', result);

    if (err) {
      return res.status(500).json({ error: err });
    }

    const stmt_title = db.prepare('UPDATE TASKS SET title = ? WHERE id = ?');
    const stmt_done = db.prepare('UPDATE TASKS SET done = ? WHERE id = ?');

    if (title != undefined) {
      stmt_title.run(title, id, (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        stmt_title.finalize((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
        });
      });
    }
    if (done != undefined) {
      stmt_done.run(done, id, (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        stmt_done.finalize((err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
        });
      });
    }

    res.status(202).json({ message: 'data updated successfully' });
  });
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
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  db.get('SELECT * FROM TASKS WHERE id = ?', [id], (err, result) => {
    console.log('error :', err);
    console.log('result :', result);

    if (err) {
      return res.status(500).json({ error: err });
    }

    db.run('DELETE FROM TASKS WHERE id = ?', [id], (err) => {
      console.log('error :', err);
      if (err) {
        return res.status(500).json({ error: err });
      }
      res.status(204).json({ message: 'data removed from the db' });
    });
  });
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
