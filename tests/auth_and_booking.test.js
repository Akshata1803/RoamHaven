process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app.js");

describe("Authentication & Route Protection", () => {
  test("Unauthenticated GET /bookings should redirect to /login", async () => {
    const res = await request(app).get("/bookings");
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("Unauthenticated GET /listings/new should redirect to /login", async () => {
    const res = await request(app).get("/listings/new");
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("Unauthenticated POST /bookings/create-order should redirect to /login", async () => {
    const res = await request(app)
      .post("/bookings/create-order")
      .send({
        listingId: "507f1f77bcf86cd799439011",
        name: "Test User",
        mobile: "9876543210",
        email: "test@example.com",
        startDate: "2026-11-01",
        endDate: "2026-11-03"
      });
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/login");
  });

  test("GET /login should render 200", async () => {
    const res = await request(app).get("/login");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Login");
  });

  test("GET /signup should render 200", async () => {
    const res = await request(app).get("/signup");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Sign Up");
  });
});
