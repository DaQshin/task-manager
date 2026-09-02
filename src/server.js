const app = require('./app.js');
const { pool, SQLOperations } = require('./db/db.js');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await SQLOperations.init();
    console.log('Database initialized');

    app.listen(PORT, () => {
      console.log(`server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.log('Database initialization failed', err);
    process.exit(1);
  }
}

startServer();
