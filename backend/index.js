require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const path = require('path');

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
   ROUTER (IMPORTANT FIX)
========================= */
const router = express.Router();

/* =========================
   ROUTES
========================= */

router.put('/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;

  if (title) {
    const result = await pool.query(
      'UPDATE todos SET title=$1 WHERE id=$2 RETURNING *',
      [title, id]
    );
    return res.json(result.rows[0]);
  }

  const result = await pool.query(
    'UPDATE todos SET completed = NOT completed WHERE id=$1 RETURNING *',
    [id]
  );

  res.json(result.rows[0]);
});

// Health
router.get('/health', (req, res) => {
  res.json({
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
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// ADD todo
router.post('/todos', async (req, res) => {
  try {
    console.log("BODY:", req.body); // DEBUG

    const { title } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await pool.query(
      'INSERT INTO todos (title) VALUES ($1) RETURNING *',
      [title]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add todo' });
  }
});

// TOGGLE
router.put('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE todos SET completed = NOT completed WHERE id = $1 RETURNING *',
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// DELETE
router.delete('/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      'DELETE FROM todos WHERE id = $1',
      [id]
    );

    res.json({ success: true });
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
