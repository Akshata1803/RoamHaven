process.env.NODE_ENV = "test";
const request = require("supertest");
const app = require("../app.js");

describe("Core Routes & Security Headers", () => {
  test("GET / should redirect to /listings with 302", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(302);
    expect(res.headers.location).toBe("/listings");
  });

  test("GET /privacy should return 200 with Privacy Policy", async () => {
    const res = await request(app).get("/privacy");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Privacy Policy");
  });

  test("GET /terms should return 200 with Terms and Conditions", async () => {
    const res = await request(app).get("/terms");
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain("Terms and Conditions");
  });

  test("GET /undefined-route should return 404 Page Not Found", async () => {
    const res = await request(app).get("/route-that-does-not-exist-xyz");
    expect(res.statusCode).toBe(404);
  });

  test("Helmet security headers should be present on responses", async () => {
    const res = await request(app).get("/terms");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBe("SAMEORIGIN");
  });
});
