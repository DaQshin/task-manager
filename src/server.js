const app = require('./app.js');
const { pool, SQLOperations } = require('./db/db.js');
const { createClient } = require('@supabase/supabase-js');

const supabaseClient = createClient(
  process.env.SUPBASE_URL,
  process.env.SUPABASE_KEY,
);

SQLOperations.init()
  .then(() => console.log('Database initialized'))
  .catch((err) => console.log('Database initialization failed'));

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
