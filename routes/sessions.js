// routes/sessions.js
import { Router } from "express";
import { SessionModel } from "../models/sessionModel.js";
import { CourseModel } from "../models/courseModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { requireOrganiserJson } from "../middleware/auth.js";

const router = Router();

router.post("/", requireOrganiserJson, async (req, res) => {
  const session = await SessionModel.create({
    ...req.body,
    bookedCount: req.body.bookedCount ?? 0,
  });
  const sessions = await SessionModel.listByCourse(session.courseId);
  await CourseModel.update(session.courseId, {
    sessionIds: sessions.map((s) => s._id),
  });
  res.status(201).json({ session });
});

router.get("/by-course/:courseId", async (req, res) => {
  const sessions = await SessionModel.listByCourse(req.params.courseId);
  res.json({ sessions });
});

router.patch("/:id", requireOrganiserJson, async (req, res) => {
  const updated = await SessionModel.update(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: "Session not found" });
  res.json({ session: updated });
});

router.delete("/:id", requireOrganiserJson, async (req, res) => {
  const session = await SessionModel.findById(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const bookings = await BookingModel.listBySession(session._id);
  if (bookings.length)
    return res.status(400).json({ error: "Session has active bookings" });
  await SessionModel.remove(req.params.id);
  const sessions = await SessionModel.listByCourse(session.courseId);
  await CourseModel.update(session.courseId, {
    sessionIds: sessions.map((s) => s._id),
  });
  res.status(204).send();
});

export default router;
