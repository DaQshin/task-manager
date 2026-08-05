const express = require('express');
const morgan = require('morgan');
const swaggerui = require('swagger-ui-express');
const openapi = require('../docs/openapi.json');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

app.use('/docs', swaggerui.serve, swaggerui.setup(openapi));

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

app.get('/tasks', (req, res) => {
  res.status(200).json({
    tasks,
  });
});

app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= tasks.length)
    res.status(404).json({ error: `Task ${id} not found` });
  const task = tasks.find((t) => t.id === id);
  res.status(200).json({
    task,
  });
});

app.post('/tasks', (req, res) => {
  const title = req.body.title;
  if (title === '') res.status(400).json({});
  tasks.push({ id: tasks.length, title, done: false });
  res.status(201).json({ message: 'task added successfully' });
});

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

app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (id >= 0 && id >= tasks.length) res.status(404).json({});
  tasks.splice(id, 1);
  res.status(204).json({});
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
