const { Pool } = require('pg');

/* =========================
   MOCK DB (FOR TESTING)
========================= */
if (process.env.NODE_ENV === 'test') {
  console.log("🧪 Using MOCK DB");

  let todos = [];
  let id = 1;

  module.exports = {
    query: async (text, params) => {

      // INSERT
      if (text.includes('INSERT')) {
        const todo = {
          id: id++,
          title: params[0],
          completed: false,
          created_at: new Date(),
        };
        todos.push(todo);
        return { rows: [todo] };
      }

      // SELECT ALL
      if (text.includes('SELECT * FROM todos')) {
        return { rows: [...todos].reverse() };
      }

      // DELETE
      if (text.includes('DELETE')) {
        const deleteId = Number(params[0]);
        todos = todos.filter(t => t.id !== deleteId);
        return { rows: [] };
      }

      // UPDATE (toggle completed)
      if (text.includes('UPDATE todos SET completed')) {
        const updateId = Number(params[0]);
        const todo = todos.find(t => t.id === updateId);
        if (todo) {
          todo.completed = !todo.completed;
        }
        return { rows: [todo] };
      }

      // UPDATE title
      if (text.includes('UPDATE todos SET title')) {
        const [title, updateId] = params;
        const todo = todos.find(t => t.id === Number(updateId));
        if (todo) {
          todo.title = title;
        }
        return { rows: [todo] };
      }

      return { rows: [] };
    },

    // ✅ IMPORTANT: match real DB interface
    end: async () => {
      console.log("🧪 Mock DB closed");
    }
  };

} else {
  /* =========================
     REAL DB (DEV / PROD)
  ========================= */
  console.log("🚀 Using REAL DB");

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  module.exports = pool;
}
