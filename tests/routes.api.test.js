import request from "supertest";
import { app } from "../index.js";
import { resetDb, seedMinimal, loginAgent } from "./helpers.js";

describe("JSON API routes", () => {
  let data;
  let studentAgent;
  let organiserAgent;

  beforeAll(async () => {
    await resetDb();
    data = await seedMinimal();
    studentAgent = request.agent(app);
    await loginAgent(studentAgent, "student@test.local", "TestStudent123");
    organiserAgent = request.agent(app);
    await loginAgent(organiserAgent, "organiser@test.local", "TestOrganiser123");
  });

  test("GET /api/courses returns array of courses", async () => {
    const res = await request(app).get("/api/courses");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/json/);
    expect(Array.isArray(res.body.courses)).toBe(true);
    expect(res.body.courses.some((c) => c.title === "Test Course")).toBe(true);
  });

  test("POST /api/courses creates a course (organiser only)", async () => {
    const payload = {
      title: "API Created Course",
      level: "advanced",
      type: "WEEKEND_WORKSHOP",
      allowDropIn: false,
      startDate: "2026-05-01",
      endDate: "2026-05-02",
      instructorName: "API Teacher",
      location: "Studio X",
      defaultPriceGbp: 20,
      description: "Created via API route.",
      sessionIds: [],
    };
    const res = await organiserAgent.post("/api/courses").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.course).toBeDefined();
    expect(res.body.course.title).toBe("API Created Course");
  });

  test("GET /api/courses/:id returns course + sessions", async () => {
    const res = await request(app).get(`/api/courses/${data.course._id}`);
    expect(res.status).toBe(200);
    expect(res.body.course._id).toBe(data.course._id);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBe(2);
  });

  test("POST /api/sessions creates a session (organiser)", async () => {
    const payload = {
      courseId: data.course._id,
      startDateTime: new Date("2026-02-16T18:30:00").toISOString(),
      endDateTime: new Date("2026-02-16T19:45:00").toISOString(),
      capacity: 16,
      bookedCount: 0,
      location: "Studio A",
      priceGbp: 15,
    };
    const res = await organiserAgent.post("/api/sessions").send(payload);
    expect(res.status).toBe(201);
    expect(res.body.session).toBeDefined();
    expect(res.body.session.courseId).toBe(data.course._id);
  });

  test("GET /api/sessions/by-course/:courseId returns sessions array", async () => {
    const res = await request(app).get(
      `/api/sessions/by-course/${data.course._id}`
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.sessions)).toBe(true);
    expect(res.body.sessions.length).toBeGreaterThanOrEqual(2);
  });

  test("POST /api/bookings/course creates a course booking (CONFIRMED or WAITLISTED)", async () => {
    const res = await studentAgent.post("/api/bookings/course").send({
      courseId: data.course._id,
    });
    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.type).toBe("COURSE");
    expect(["CONFIRMED", "WAITLISTED"]).toContain(res.body.booking.status);
  });

  test("POST /api/bookings/session creates a session booking (CONFIRMED or WAITLISTED)", async () => {
    const res = await studentAgent.post("/api/bookings/session").send({
      sessionId: data.sessions[0]._id,
    });
    expect(res.status).toBe(201);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.type).toBe("SESSION");
    expect(["CONFIRMED", "WAITLISTED"]).toContain(res.body.booking.status);
  });

  test("DELETE /api/bookings/:id cancels a booking", async () => {
    const create = await studentAgent.post("/api/bookings/session").send({
      sessionId: data.sessions[1]._id,
    });
    expect(create.status).toBe(201);
    const bookingId = create.body.booking._id;

    const del = await studentAgent.delete(`/api/bookings/${bookingId}`);
    expect(del.status).toBe(200);
    expect(del.body.booking.status).toBe("CANCELLED");
  });
});
