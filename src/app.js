const express = require('express');
const morgan = require('morgan');
const app = express();

app.use(express.json());
app.use(morgan('dev'));

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
    .staus(200)
    .json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/tasks', (req, res) => {
  res.status(200).json({
    tasks,
  });
});

app.get('/tasks/:id', (req, res) => {
  if (id < tasks.length)
    res.status(200).json({
      task: tasks[id],
    });

  res.status(404).json({ error: `Task ${id} not found` });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = app;
