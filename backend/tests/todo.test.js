const request = require("supertest");
const app = require("../index");

describe("Todo API", () => {
  let todoId;

  it("POST /api/todos → create todo", async () => {
    const res = await request(app)
      .post("/api/todos")
      .send({ title: "Test Todo" });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("id");

    todoId = res.body.id;
  });

  it("GET /api/todos → fetch todos", async () => {
    const res = await request(app).get("/api/todos");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("DELETE /api/todos/:id → delete todo", async () => {
    const res = await request(app).delete(`/api/todos/${todoId}`);
    expect(res.statusCode).toBe(200);
  });
});


const { pool } = require("../index");

afterAll(async () => {
  await pool.end();
});
