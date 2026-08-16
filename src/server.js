const app = require('./app.js');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database('./src/db/tasks.db');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )`);

  db.get('SELECT COUNT(*) AS count FROM TASKS', [], (err, row) => {
    if (err) throw err;

    if (row.count == 0) {
      const insert = db.prepare(
        'INSERT INTO TASKS (title, done) VALUES (?, ?)',
      );
      insert.run('Buy groceries', 0);
      insert.run('Write SQLite notes', 1);
      insert.run('Walk the dog', 0);
      insert.finalize();
      console.log('Seeded 3 example tasks');
    } else {
      console.log(`Table already has ${row.count} rows — skipping seed`);
    }
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
