// seed/seed.js — demo data with bcrypt-hashed user passwords (NeDB)
import {
  initDb,
  usersDb,
  coursesDb,
  sessionsDb,
  bookingsDb,
} from "../models/_db.js";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { UserModel } from "../models/userModel.js";
import { hashPassword } from "../services/authService.js";

const iso = (d) => new Date(d).toISOString();

async function wipeAll() {
  await Promise.all([
    usersDb.remove({}, { multi: true }),
    coursesDb.remove({}, { multi: true }),
    sessionsDb.remove({}, { multi: true }),
    bookingsDb.remove({}, { multi: true }),
  ]);
  await Promise.all([
    usersDb.compactDatafile(),
    coursesDb.compactDatafile(),
    sessionsDb.compactDatafile(),
    bookingsDb.compactDatafile(),
  ]);
}

async function run() {
  console.log("Initializing DB…");
  await initDb();

  console.log("Wiping existing data…");
  await wipeAll();

  console.log("Creating users…");
  const student = await UserModel.create({
    name: "Fiona",
    email: "fiona@student.local",
    passwordHash: await hashPassword("StudentDemo123!"),
    role: "student",
    createdAt: new Date().toISOString(),
  });

  const organiser = await UserModel.create({
    name: "Studio Admin",
    email: "organiser@studio.local",
    passwordHash: await hashPassword("OrganiserDemo123!"),
    role: "organiser",
    createdAt: new Date().toISOString(),
  });

  console.log("Creating weekend workshop…");
  const workshop = await CourseModel.create({
    title: "Winter Mindfulness Workshop",
    level: "beginner",
    type: "WEEKEND_WORKSHOP",
    allowDropIn: false,
    startDate: "2026-01-10",
    endDate: "2026-01-11",
    instructorName: "Ava Chen",
    location: "Stillpoint Studio, 12 Kelvin Way, Glasgow G12",
    defaultPriceGbp: 45,
    sessionIds: [],
    description:
      "Two days of breath, posture alignment, and meditation. Tea and props provided.",
  });

  const base = new Date("2026-01-10T09:00:00");
  const wSessions = [];
  for (let i = 0; i < 5; i++) {
    const start = new Date(base.getTime() + i * 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: workshop._id,
      startDateTime: iso(start),
      endDateTime: iso(end),
      capacity: 20,
      bookedCount: 0,
      location: "Stillpoint Studio, Main Hall",
      priceGbp: 45,
    });
    wSessions.push(s);
  }
  await CourseModel.update(workshop._id, {
    sessionIds: wSessions.map((s) => s._id),
  });

  console.log("Creating weekly block…");
  const weekly = await CourseModel.create({
    title: "12‑Week Vinyasa Flow",
    level: "intermediate",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-02-02",
    endDate: "2026-04-20",
    instructorName: "Ben O’Neill",
    location: "Stillpoint Studio, Studio 2",
    defaultPriceGbp: 14,
    sessionIds: [],
    description: "Progressive sequences building strength and flexibility.",
  });

  const first = new Date("2026-02-02T18:30:00");
  const bSessions = [];
  for (let i = 0; i < 12; i++) {
    const start = new Date(first.getTime() + i * 7 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 75 * 60 * 1000);
    const s = await SessionModel.create({
      courseId: weekly._id,
      startDateTime: iso(start),
      endDateTime: iso(end),
      capacity: 18,
      bookedCount: 0,
      location: "Stillpoint Studio, Studio 2",
      priceGbp: 14,
    });
    bSessions.push(s);
  }
  await CourseModel.update(weekly._id, {
    sessionIds: bSessions.map((s) => s._id),
  });

  const [users, courses, sessions, bookings] = await Promise.all([
    usersDb.count({}),
    coursesDb.count({}),
    sessionsDb.count({}),
    bookingsDb.count({}),
  ]);
  console.log("— Verification —");
  console.log("Users   :", users);
  console.log("Courses :", courses);
  console.log("Sessions:", sessions);
  console.log("Bookings:", bookings);

  console.log("\n✅ Seed complete.");
  console.log("Student login   : fiona@student.local / StudentDemo123!");
  console.log("Organiser login : organiser@studio.local / OrganiserDemo123!");
  console.log("Workshop ID     :", workshop._id);
  console.log("Weekly course ID:", weekly._id);
}

run().catch((err) => {
  console.error("❌ Seed failed:", err?.stack || err);
  process.exit(1);
});
