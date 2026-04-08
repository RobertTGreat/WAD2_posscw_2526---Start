// routes/bookings.js
import { Router } from "express";
import {
  bookCourse,
  bookSession,
  cancelBooking,
} from "../controllers/bookingController.js";
import { requireAuthJson } from "../middleware/auth.js";

const router = Router();

router.post("/course", requireAuthJson, bookCourse);
router.post("/session", requireAuthJson, bookSession);
router.delete("/:bookingId", requireAuthJson, cancelBooking);

export default router;
