const { Pool } = require('pg');
const dotenv = require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

class SQLOperations {
  static async init() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        done BOOLEAN NOT NULL DEFAULT FALSE
      )
    `);

    const { rows } = await pool.query('SELECT COUNT(*) AS count FROM tasks');

    if (Number(rows[0].count) === 0) {
      await pool.query(
        `
        INSERT INTO tasks (title, done)
        VALUES
          ($1, $2),
          ($3, $4),
          ($5, $6)
      `,
        [
          'Buy groceries',
          false,
          'Write PostgreSQL notes',
          true,
          'Walk the dog',
          false,
        ],
      );

      console.log('Seeded 3 example tasks');
    } else {
      console.log(`Table already has ${rows[0].count} rows — skipping seed`);
    }
  }

  static async getAll() {
    const { rows } = await pool.query('SELECT * FROM tasks');
    return rows;
  }

  static async getOne(id) {
    const { rows } = await pool.query(`SELCET * FROM tasks WHERE id = $1`, [
      id,
    ]);
    return rows[0];
  }

  static async createOne(title) {
    const { rows } = await pool.query(
      `INSERT INTO tasks (title) VALUES ($1) RETURNING *`,
      [title],
    );

    return rows[0];
  }

  static async updateOne(id, title, done) {
    const { rows } = await pool.query(
      `UPDATE tasks SET title=COALESCE($1, title) done=COALESCE($2, done) WHERE id=$3 RETURNING *`,
      [title, done, id],
    );
    return rows[0];
  }

  static async deleteOne(id) {
    const { rows } = await pool.query(`DELETE FROM tasks WHERE id = $1`, [id]);
    return rows[0];
  }
}

module.exports = { pool, SQLOperations };
