process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app.js");

describe("AI Chatbot API (/api/jarvis)", () => {
  test("POST /api/jarvis with greeting should return RoamMate greeting", async () => {
    const res = await request(app)
      .post("/api/jarvis")
      .send({ message: "Hello RoamMate" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("reply");
    expect(res.body.reply).toContain("RoamMate");
  });

  test("POST /api/jarvis with booking question should return booking instructions", async () => {
    const res = await request(app)
      .post("/api/jarvis")
      .send({ message: "How to book a stay?" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("reply");
    expect(res.body.reply.toLowerCase()).toContain("book");
  });

  test("POST /api/jarvis with support query should return contact info", async () => {
    const res = await request(app)
      .post("/api/jarvis")
      .send({ message: "Customer support phone" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("reply");
    expect(res.body.reply).toContain("support@roamhaven.com");
  });
});
