// routes/courses.js
import { Router } from "express";
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { requireOrganiserJson } from "../middleware/auth.js";

const router = Router();

router.get("/", async (req, res) => {
  const courses = await CourseModel.list();
  res.json({ courses });
});

router.post("/", requireOrganiserJson, async (req, res) => {
  const course = await CourseModel.create(req.body);
  res.status(201).json({ course });
});

router.get("/:id", async (req, res) => {
  const course = await CourseModel.findById(req.params.id);
  if (!course) return res.status(404).json({ error: "Course not found" });
  const sessions = await SessionModel.listByCourse(course._id);
  res.json({ course, sessions });
});

router.patch("/:id", requireOrganiserJson, async (req, res) => {
  const course = await CourseModel.update(req.params.id, req.body);
  if (!course) return res.status(404).json({ error: "Course not found" });
  res.json({ course });
});

router.delete("/:id", requireOrganiserJson, async (req, res) => {
  const existing = await CourseModel.findById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Course not found" });
  await BookingModel.removeByCourse(req.params.id);
  await SessionModel.removeByCourse(req.params.id);
  await CourseModel.remove(req.params.id);
  res.status(204).send();
});

export default router;
