// seed/seed.js — reset and recreate the demo data used in README and demos
import { usersDb, coursesDb, sessionsDb, bookingsDb } from "../models/_db.js";
import { seedDemoData } from "./seedDemoData.js";

async function run() {
  console.log("Initializing DB…");
  const { workshop, weekly } = await seedDemoData({ wipeExisting: true });

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
