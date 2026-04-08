// routes/views.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireFormCsrf } from "../middleware/csrfForm.js";
import {
  homePage,
  aboutPage,
  courseDetailPage,
  getCourseBookPage,
  postBookCourse,
  getSessionBookPage,
  postBookSession,
  bookingConfirmationPage,
} from "../controllers/viewsController.js";
import { coursesListPage } from "../controllers/coursesListController.js";

const router = Router();

router.get("/", homePage);
router.get("/about", aboutPage);
router.get("/courses", coursesListPage);
router.get("/courses/:id", courseDetailPage);
router.get("/courses/:id/book", requireAuth, getCourseBookPage);
router.post("/courses/:id/book", requireAuth, requireFormCsrf, postBookCourse);
router.get("/sessions/:id/book", requireAuth, getSessionBookPage);
router.post("/sessions/:id/book", requireAuth, requireFormCsrf, postBookSession);
router.get("/bookings/:bookingId", requireAuth, bookingConfirmationPage);

export default router;
