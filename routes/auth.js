// routes/auth.js
import { Router } from "express";
import {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  postLogout,
} from "../controllers/authController.js";
import { requireFormCsrf } from "../middleware/csrfForm.js";

const router = Router();

router.get("/register", getRegister);
router.post("/register", postRegister);
router.get("/login", getLogin);
router.post("/login", postLogin);
router.post("/logout", requireFormCsrf, postLogout);

export default router;
