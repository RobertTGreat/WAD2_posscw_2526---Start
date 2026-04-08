// controllers/organiserController.js — organiser-only CRUD and class lists
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import { BookingModel } from "../models/bookingModel.js";
import { UserModel } from "../models/userModel.js";

const LEVELS = ["beginner", "intermediate", "advanced"];
const TYPES = ["WEEKLY_BLOCK", "WEEKEND_WORKSHOP"];

function selectFlags(course) {
  const level = course?.level || "beginner";
  const type = course?.type || "WEEKLY_BLOCK";
  return {
    beginner: level === "beginner",
    intermediate: level === "intermediate",
    advanced: level === "advanced",
    weekly: type === "WEEKLY_BLOCK",
    weekend: type === "WEEKEND_WORKSHOP",
  };
}

function parseMoney(v) {
  const n = Number.parseFloat(String(v ?? "").replace(/[£,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

function parseDateInput(name, value) {
  const s = String(value || "").trim();
  if (!s) throw new Error(`${name} is required`);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`${name} is not a valid date`);
  return s;
}

function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const dashboard = async (req, res, next) => {
  try {
    const courses = await CourseModel.list({});
    const withCounts = await Promise.all(
      courses.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          sessionsCount: sessions.length,
          startDate: c.startDate,
        };
      })
    );
    withCounts.sort((a, b) => String(a.title).localeCompare(b.title));
    res.render("organiser/dashboard", {
      title: "Organiser",
      courses: withCounts,
      showSignupBanner: req.query.signedup === "1",
    });
  } catch (e) {
    next(e);
  }
};

export const getNewCourse = (req, res) => {
  res.render("organiser/course_form", {
    title: "New course",
    action: "/organiser/courses",
    course: {},
    sel: selectFlags({ level: "beginner", type: "WEEKLY_BLOCK" }),
    error: null,
  });
};

export const postCreateCourse = async (req, res, next) => {
  try {
    const title = String(req.body.title || "").trim();
    const level = String(req.body.level || "");
    const type = String(req.body.type || "");
    const location = String(req.body.location || "").trim();
    const defaultPriceGbp = parseMoney(req.body.defaultPriceGbp);
    const allowDropIn = req.body.allowDropIn === "on" || req.body.allowDropIn === "true";
    const startDate = parseDateInput("Start date", req.body.startDate);
    const endDate = parseDateInput("End date", req.body.endDate);
    const description = String(req.body.description || "").trim();
    const instructorName = String(req.body.instructorName || "").trim();

    if (title.length < 2) throw new Error("Title is too short");
    if (!LEVELS.includes(level)) throw new Error("Invalid level");
    if (!TYPES.includes(type)) throw new Error("Invalid course type");
    if (!location) throw new Error("Location is required");
    if (defaultPriceGbp == null || defaultPriceGbp < 0) throw new Error("Valid default price is required");

    await CourseModel.create({
      title,
      level,
      type,
      allowDropIn,
      startDate,
      endDate,
      description,
      location,
      defaultPriceGbp,
      instructorName: instructorName || "TBA",
      sessionIds: [],
    });
    res.redirect("/organiser");
  } catch (e) {
    res.status(400).render("organiser/course_form", {
      title: "New course",
      action: "/organiser/courses",
      error: e.message,
      course: req.body,
      sel: selectFlags(req.body),
    });
  }
};

const fmtDateTime = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const getEditCourse = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.id);
    if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });
    const sessions = await SessionModel.listByCourse(course._id);
    const sessionRows = sessions.map((s) => ({
      id: s._id,
      start: fmtDateTime(s.startDateTime),
      end: fmtDateTime(s.endDateTime),
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
    }));
    res.render("organiser/course_edit", {
      title: "Edit course",
      course,
      sessions: sessionRows,
      sel: selectFlags(course),
      error: null,
    });
  } catch (e) {
    next(e);
  }
};

export const postUpdateCourse = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await CourseModel.findById(id);
    if (!existing) return res.status(404).render("error", { title: "Not found", message: "Course not found" });

    const title = String(req.body.title || "").trim();
    const level = String(req.body.level || "");
    const type = String(req.body.type || "");
    const location = String(req.body.location || "").trim();
    const defaultPriceGbp = parseMoney(req.body.defaultPriceGbp);
    const allowDropIn = req.body.allowDropIn === "on" || req.body.allowDropIn === "true";
    const startDate = parseDateInput("Start date", req.body.startDate);
    const endDate = parseDateInput("End date", req.body.endDate);
    const description = String(req.body.description || "").trim();
    const instructorName = String(req.body.instructorName || "").trim();

    if (title.length < 2) throw new Error("Title is too short");
    if (!LEVELS.includes(level)) throw new Error("Invalid level");
    if (!TYPES.includes(type)) throw new Error("Invalid course type");
    if (!location) throw new Error("Location is required");
    if (defaultPriceGbp == null || defaultPriceGbp < 0) throw new Error("Valid default price is required");

    await CourseModel.update(id, {
      title,
      level,
      type,
      allowDropIn,
      startDate,
      endDate,
      description,
      location,
      defaultPriceGbp,
      instructorName: instructorName || "TBA",
    });
    res.redirect("/organiser");
  } catch (e) {
    const id = req.params.id;
    const course = await CourseModel.findById(id);
    const sessions = course ? await SessionModel.listByCourse(course._id) : [];
    const sessionRows = sessions.map((s) => ({
      id: s._id,
      start: fmtDateTime(s.startDateTime),
      end: fmtDateTime(s.endDateTime),
      capacity: s.capacity,
      booked: s.bookedCount ?? 0,
    }));
    res.status(400).render("organiser/course_edit", {
      title: "Edit course",
      error: e.message,
      course: { ...req.body, _id: id },
      sessions: sessionRows,
      sel: selectFlags(req.body),
    });
  }
};

export const postDeleteCourse = async (req, res, next) => {
  try {
    const id = req.params.id;
    const course = await CourseModel.findById(id);
    if (!course)
      return res.status(404).render("error", { title: "Not found", message: "Course not found" });

    await BookingModel.removeByCourse(id);
    await SessionModel.removeByCourse(id);
    await CourseModel.remove(id);
    res.redirect("/organiser");
  } catch (e) {
    next(e);
  }
};

export const getNewSession = async (req, res, next) => {
  try {
    const course = await CourseModel.findById(req.params.courseId);
    if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });
    res.render("organiser/session_form", {
      title: "New class session",
      action: `/organiser/courses/${course._id}/sessions`,
      course,
      session: { startDateTime: "", endDateTime: "", capacity: 18 },
      error: null,
    });
  } catch (e) {
    next(e);
  }
};

export const postCreateSession = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await CourseModel.findById(courseId);
    if (!course) return res.status(404).render("error", { title: "Not found", message: "Course not found" });

    const startDateTime = new Date(String(req.body.startDateTime || "")).toISOString();
    const endDateTime = new Date(String(req.body.endDateTime || "")).toISOString();
    const capacity = Number.parseInt(req.body.capacity, 10);
    const location = String(req.body.location || "").trim();
    const priceGbp = req.body.priceGbp ? parseMoney(req.body.priceGbp) : null;

    if (Number.isNaN(Date.parse(startDateTime))) throw new Error("Invalid start date/time");
    if (Number.isNaN(Date.parse(endDateTime))) throw new Error("Invalid end date/time");
    if (new Date(endDateTime) <= new Date(startDateTime)) throw new Error("End must be after start");
    if (!Number.isFinite(capacity) || capacity < 1) throw new Error("Capacity must be at least 1");

    const session = await SessionModel.create({
      courseId,
      startDateTime,
      endDateTime,
      capacity,
      bookedCount: 0,
      location: location || undefined,
      priceGbp: priceGbp != null ? priceGbp : undefined,
    });

    const sessions = await SessionModel.listByCourse(courseId);
    await CourseModel.update(courseId, { sessionIds: sessions.map((s) => s._id) });
    res.redirect(`/organiser/courses/${courseId}/edit`);
  } catch (e) {
    const course = await CourseModel.findById(req.params.courseId);
    res.status(400).render("organiser/session_form", {
      title: "New class session",
      action: `/organiser/courses/${req.params.courseId}/sessions`,
      course,
      error: e.message,
      session: req.body,
    });
  }
};

export const getEditSession = async (req, res, next) => {
  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).render("error", { title: "Not found", message: "Session not found" });
    const course = await CourseModel.findById(session.courseId);
    res.render("organiser/session_form", {
      title: "Edit class session",
      action: `/organiser/sessions/${session._id}`,
      course,
      session: {
        ...session,
        startDateTime: toDatetimeLocal(session.startDateTime),
        endDateTime: toDatetimeLocal(session.endDateTime),
        priceGbp: session.priceGbp ?? "",
        location: session.location ?? "",
      },
      error: null,
    });
  } catch (e) {
    next(e);
  }
};

export const postUpdateSession = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await SessionModel.findById(id);
    if (!existing) return res.status(404).render("error", { title: "Not found", message: "Session not found" });

    const startDateTime = new Date(String(req.body.startDateTime || "")).toISOString();
    const endDateTime = new Date(String(req.body.endDateTime || "")).toISOString();
    const capacity = Number.parseInt(req.body.capacity, 10);
    const location = String(req.body.location || "").trim();
    const priceGbp = req.body.priceGbp ? parseMoney(req.body.priceGbp) : null;

    if (Number.isNaN(Date.parse(startDateTime))) throw new Error("Invalid start date/time");
    if (Number.isNaN(Date.parse(endDateTime))) throw new Error("Invalid end date/time");
    if (new Date(endDateTime) <= new Date(startDateTime)) throw new Error("End must be after start");
    if (!Number.isFinite(capacity) || capacity < 1) throw new Error("Capacity must be at least 1");

    const booked = existing.bookedCount ?? 0;
    if (capacity < booked) throw new Error("Capacity cannot be below current bookings");

    await SessionModel.update(id, {
      startDateTime,
      endDateTime,
      capacity,
      location: location || undefined,
      priceGbp: priceGbp != null ? priceGbp : undefined,
    });
    res.redirect(`/organiser/courses/${existing.courseId}/edit`);
  } catch (e) {
    const existing = await SessionModel.findById(req.params.id);
    const course = existing ? await CourseModel.findById(existing.courseId) : null;
    res.status(400).render("organiser/session_form", {
      title: "Edit class session",
      action: `/organiser/sessions/${req.params.id}`,
      course,
      error: e.message,
      session: { ...req.body, _id: req.params.id },
    });
  }
};

export const postDeleteSession = async (req, res, next) => {
  try {
    const id = req.params.id;
    const session = await SessionModel.findById(id);
    if (!session) return res.status(404).render("error", { title: "Not found", message: "Session not found" });

    const bookings = await BookingModel.listBySession(id);
    if (bookings.length > 0) {
      return res.status(400).render("error", {
        title: "Cannot delete",
        message: "This class has bookings. Cancel or reassign bookings first.",
      });
    }

    const courseId = session.courseId;
    await SessionModel.remove(id);
    const sessions = await SessionModel.listByCourse(courseId);
    await CourseModel.update(courseId, { sessionIds: sessions.map((s) => s._id) });
    res.redirect(`/organiser/courses/${courseId}/edit`);
  } catch (e) {
    next(e);
  }
};

export const getClassList = async (req, res, next) => {
  try {
    const session = await SessionModel.findById(req.params.id);
    if (!session) return res.status(404).render("error", { title: "Not found", message: "Session not found" });
    const course = await CourseModel.findById(session.courseId);
    const bookings = await BookingModel.listBySession(session._id);
    const rows = [];
    for (const b of bookings) {
      const u = await UserModel.findById(b.userId);
      rows.push({
        userName: u?.name ?? "Unknown",
        userEmail: u?.email ?? "",
        bookingId: b._id,
        status: b.status,
      });
    }
    const fmt = (iso) =>
      new Date(iso).toLocaleString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    res.render("organiser/class_list", {
      title: "Class list",
      course,
      session: {
        ...session,
        startLabel: fmt(session.startDateTime),
        endLabel: fmt(session.endDateTime),
      },
      participants: rows,
    });
  } catch (e) {
    next(e);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const users = await UserModel.list();
    const organisers = await UserModel.countByRole("organiser");
    const rows = users.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isSelf: u._id === req.user._id,
      isStudent: u.role === "student",
    }));
    res.render("organiser/users", {
      title: "Users & organisers",
      users: rows,
      organisersCount: organisers,
    });
  } catch (e) {
    next(e);
  }
};

export const postSetRole = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (id === req.user._id) {
      return res.status(400).render("error", { title: "Not allowed", message: "You cannot change your own role here." });
    }
    const role = String(req.body.role || "");
    if (role !== "student" && role !== "organiser") {
      return res.status(400).render("error", { title: "Invalid", message: "Invalid role." });
    }
    const target = await UserModel.findById(id);
    if (!target) return res.status(404).render("error", { title: "Not found", message: "User not found" });

    if (target.role === "organiser" && role === "student") {
      const count = await UserModel.countByRole("organiser");
      if (count <= 1) {
        return res.status(400).render("error", {
          title: "Not allowed",
          message: "There must be at least one organiser.",
        });
      }
    }

    await UserModel.update(id, { role });
    res.redirect("/organiser/users");
  } catch (e) {
    next(e);
  }
};

export const postDeleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (id === req.user._id) {
      return res.status(400).render("error", { title: "Not allowed", message: "You cannot remove yourself." });
    }
    const target = await UserModel.findById(id);
    if (!target) return res.status(404).render("error", { title: "Not found", message: "User not found" });

    if (target.role === "organiser") {
      const count = await UserModel.countByRole("organiser");
      if (count <= 1) {
        return res.status(400).render("error", {
          title: "Not allowed",
          message: "There must be at least one organiser.",
        });
      }
    }

    await UserModel.remove(id);
    res.redirect("/organiser/users");
  } catch (e) {
    next(e);
  }
};
