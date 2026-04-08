import request from "supertest";
import { app } from "../index.js";
import { resetDb } from "./helpers.js";

describe("Custom account register + login", () => {
  beforeAll(async () => {
    await resetDb();
  });

  test("POST /register creates account then POST /login accepts same credentials", async () => {
    const email = `user-${Date.now()}@example.com`;
    const password = "MyCustomPass99";

    const reg = await request(app).post("/register").type("form").send({
      name: "Custom User",
      email,
      password,
      confirmPassword: password,
    });
    expect(reg.status).toBe(302);
    expect(reg.headers.location).toMatch(/signedup=1/);

    const agent = request.agent(app);
    const login = await agent.post("/login").type("form").send({
      email,
      password,
      next: "/courses",
    });
    expect(login.status).toBe(302);
    expect(login.headers.location).toBe("/courses");

    const page = await agent.get("/courses");
    expect(page.status).toBe(200);
    expect(page.text).toMatch(/Custom User/i);
  });

  test("login accepts email with different spacing/case than stored", async () => {
    await resetDb();
    const email = `mixed-${Date.now()}@example.com`;
    const password = "AnotherPass88";

    await request(app).post("/register").type("form").send({
      name: "Mixed Case",
      email: `  ${email.toUpperCase()}  `,
      password,
      confirmPassword: password,
    });

    const res = await request(app).post("/login").type("form").send({
      email: email,
      password,
      next: "/courses",
    });
    expect(res.status).toBe(302);
  });
});
