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

function toIsoString(value) {
  return new Date(value).toISOString();
}

async function wipeAllCollections() {
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

async function createDemoUsers() {
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

  return { student, organiser };
}

async function createWeekendWorkshop() {
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

  const workshopStart = new Date("2026-01-10T09:00:00");
  const sessions = [];

  for (let index = 0; index < 5; index += 1) {
    const start = new Date(workshopStart.getTime() + index * 2 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const session = await SessionModel.create({
      courseId: workshop._id,
      startDateTime: toIsoString(start),
      endDateTime: toIsoString(end),
      capacity: 20,
      bookedCount: 0,
      location: "Stillpoint Studio, Main Hall",
      priceGbp: 45,
    });
    sessions.push(session);
  }

  await CourseModel.update(workshop._id, {
    sessionIds: sessions.map((session) => session._id),
  });

  return workshop;
}

async function createWeeklyBlock() {
  const weekly = await CourseModel.create({
    title: "12-Week Vinyasa Flow",
    level: "intermediate",
    type: "WEEKLY_BLOCK",
    allowDropIn: true,
    startDate: "2026-02-02",
    endDate: "2026-04-20",
    instructorName: "Ben O'Neill",
    location: "Stillpoint Studio, Studio 2",
    defaultPriceGbp: 14,
    sessionIds: [],
    description: "Progressive sequences building strength and flexibility.",
  });

  const firstClassStart = new Date("2026-02-02T18:30:00");
  const sessions = [];

  for (let index = 0; index < 12; index += 1) {
    const start = new Date(
      firstClassStart.getTime() + index * 7 * 24 * 60 * 60 * 1000
    );
    const end = new Date(start.getTime() + 75 * 60 * 1000);
    const session = await SessionModel.create({
      courseId: weekly._id,
      startDateTime: toIsoString(start),
      endDateTime: toIsoString(end),
      capacity: 18,
      bookedCount: 0,
      location: "Stillpoint Studio, Studio 2",
      priceGbp: 14,
    });
    sessions.push(session);
  }

  await CourseModel.update(weekly._id, {
    sessionIds: sessions.map((session) => session._id),
  });

  return weekly;
}

async function createDemoData() {
  const users = await createDemoUsers();
  const workshop = await createWeekendWorkshop();
  const weekly = await createWeeklyBlock();
  return { ...users, workshop, weekly };
}

export async function seedDemoData({ wipeExisting = false } = {}) {
  await initDb();

  if (wipeExisting) {
    await wipeAllCollections();
  }

  return createDemoData();
}

export async function ensureDemoData() {
  await initDb();

  const [userCount, courseCount] = await Promise.all([
    usersDb.count({}),
    coursesDb.count({}),
  ]);

  if (userCount > 0 || courseCount > 0) {
    return false;
  }

  await createDemoData();
  return true;
}
