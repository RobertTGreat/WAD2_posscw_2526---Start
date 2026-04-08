// routes/organiser.js
import { Router } from "express";
import { requireOrganiser } from "../middleware/auth.js";
import { requireFormCsrf } from "../middleware/csrfForm.js";
import {
  dashboard,
  getNewCourse,
  postCreateCourse,
  getEditCourse,
  postUpdateCourse,
  postDeleteCourse,
  getNewSession,
  postCreateSession,
  getEditSession,
  postUpdateSession,
  postDeleteSession,
  getClassList,
  getUsers,
  postSetRole,
  postDeleteUser,
} from "../controllers/organiserController.js";

const router = Router();
router.use(requireOrganiser);

router.get("/", dashboard);

router.get("/courses/new", getNewCourse);
router.post("/courses", requireFormCsrf, postCreateCourse);
router.get("/courses/:id/edit", getEditCourse);
router.post("/courses/:id", requireFormCsrf, postUpdateCourse);
router.post("/courses/:id/delete", requireFormCsrf, postDeleteCourse);

router.get("/courses/:courseId/sessions/new", getNewSession);
router.post("/courses/:courseId/sessions", requireFormCsrf, postCreateSession);

router.get("/sessions/:id/edit", getEditSession);
router.post("/sessions/:id", requireFormCsrf, postUpdateSession);
router.post("/sessions/:id/delete", requireFormCsrf, postDeleteSession);
router.get("/sessions/:id/participants", getClassList);

router.get("/users", getUsers);
router.post("/users/:id/role", requireFormCsrf, postSetRole);
router.post("/users/:id/delete", requireFormCsrf, postDeleteUser);

export default router;
