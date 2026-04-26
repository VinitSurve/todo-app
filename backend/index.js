require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');

const app = express();

/* =========================
   MIDDLEWARE
========================= */
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

/* =========================
   DATABASE CONNECTION
========================= */
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/* =========================
   STATIC FRONTEND
========================= */
app.use(express.static('/var/www/html'));
/* =========================
   ROUTER
========================= */
const router = express.Router();

/* =========================
   ROUTES
========================= */

// Health
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString(),
  });
});

// DB check
router.get('/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB connection failed' });
  }
});

// GET todos
router.get('/todos', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM todos ORDER BY id DESC'
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// ADD todo
router.post('/todos', async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title]
    );

    console.log("CREATED:", result.rows[0]);

    // ✅ FIXED: proper status
    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add todo' });
  }
});

// UPDATE / TOGGLE todo
router.put('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    let result;

    if (title) {
      result = await pool.query(
        'UPDATE todos SET title=$1 WHERE id=$2 RETURNING *',
        [title, id]
      );
    } else {
      result = await pool.query(
        'UPDATE todos SET completed = NOT completed WHERE id=$1 RETURNING *',
        [id]
      );
    }

    res.status(200).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE todo
router.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID' });
    }

    await pool.query(
      'DELETE FROM todos WHERE id = $1',
      [id]
    );

    res.status(200).json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

/* =========================
   MOUNT ROUTER
========================= */
app.use('/api', router);

/* =========================
   SERVER START
========================= */

const PORT = process.env.PORT || 3000;

// ✅ Export app (for testing)
module.exports = app;
module.exports.pool = pool;

// ✅ Start server only when run directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
