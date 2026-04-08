import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal, loginAgent } from "./helpers.js";

describe("SSR view routes", () => {
  let data;
  let agent;

  beforeAll(async () => {
    await resetDb();
    data = await seedMinimal();
    agent = request.agent(app);
    await loginAgent(agent, "student@test.local", "TestStudent123");
  });

  test("GET / (home) renders HTML", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Courses|Upcoming Courses/i);
  });

  test("GET /courses (list page) renders HTML and shows Test Course", async () => {
    const res = await request(app).get("/courses");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses/:id (detail page) renders HTML", async () => {
    const res = await request(app).get(`/courses/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Test Course/);
  });

  test("GET /courses/:id/book renders course booking form when signed in", async () => {
    const res = await agent.get(`/courses/${data.course._id}/book`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Confirm course booking|Book/i);
  });

  test("GET /sessions/:id/book renders session booking form when signed in", async () => {
    const sessionId = data.sessions[0]._id;
    const res = await agent.get(`/sessions/${sessionId}/book`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toMatch(/Book a single class|Confirm/i);
  });
});
