const request = require("supertest");
const app = require("../index");

describe("API Test", () => {
  it("GET /api/health should return 200", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
  });
});

const { pool } = require("../index");

afterAll(async () => {
 await pool.end();
});
