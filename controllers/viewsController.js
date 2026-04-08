// controllers/viewsController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import {
  bookCourseForUser,
  bookSessionForUser,
} from "../services/bookingService.js";
import { BookingModel } from "../models/bookingModel.js";
import {
  courseHasUpcomingContent,
  startOfToday,
} from "../utils/upcomingCourses.js";

const fmtDate = (iso) =>
  new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
const fmtDateOnly = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `£${Number(n).toFixed(2)}`;
}

function sessionPrice(session, course) {
  const p = session.priceGbp ?? course.defaultPriceGbp;
  return fmtMoney(p);
}

function sessionLocation(session, course) {
  return session.location || course.location || "—";
}

export const aboutPage = (req, res) => {
  res.render("about", {
    title: "About the studio",
  });
};

export const homePage = async (req, res, next) => {
  try {
    const allCourses = await CourseModel.list();
    const cards = [];
    for (const c of allCourses) {
      const sessions = await SessionModel.listByCourse(c._id);
      if (!courseHasUpcomingContent(c, sessions)) continue;
      const upcomingSessions = sessions.filter(
        (s) => new Date(s.startDateTime) >= startOfToday()
      );
      const ordered = upcomingSessions.length ? upcomingSessions : sessions;
      const nextSession = ordered[0];
      cards.push({
        id: c._id,
        title: c.title,
        level: c.level,
        type: c.type,
        allowDropIn: c.allowDropIn,
        location: c.location || "—",
        price: fmtMoney(c.defaultPriceGbp),
        startDate: c.startDate ? fmtDateOnly(c.startDate) : "",
        endDate: c.endDate ? fmtDateOnly(c.endDate) : "",
        nextSession: nextSession ? fmtDate(nextSession.startDateTime) : "TBA",
        sessionsCount: sessions.length,
        description: c.description,
      });
    }
    cards.sort((a, b) => String(a.title).localeCompare(b.title));
    res.render("home", { title: "Stillpoint Studio", courses: cards });
  } catch (err) {
    next(err);
  }
};

export const courseDetailPage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Course not found" });

    const sessions = await SessionModel.listByCourse(courseId);
    const rows = sessions.map((s) => {
      const remaining = Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0));
      return {
        id: s._id,
        start: fmtDate(s.startDateTime),
        end: fmtDate(s.endDateTime),
        capacity: s.capacity,
        booked: s.bookedCount ?? 0,
        remaining,
        isFull: remaining <= 0,
        price: sessionPrice(s, course),
        location: sessionLocation(s, course),
        showDropIn: !!course.allowDropIn,
      };
    });

    const loginUrl = `/login?next=${encodeURIComponent(`/courses/${course._id}`)}`;

    res.render("course", {
      title: course.title,
      loginUrl,
      course: {
        id: course._id,
        title: course.title,
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        startDate: course.startDate ? fmtDateOnly(course.startDate) : "",
        endDate: course.endDate ? fmtDateOnly(course.endDate) : "",
        description: course.description,
        location: course.location || "—",
        defaultPrice: fmtMoney(course.defaultPriceGbp),
        instructorName: course.instructorName || "TBA",
      },
      sessions: rows,
      isLoggedIn: !!req.user,
      canBook: !!req.user,
    });
  } catch (err) {
    next(err);
  }
};

export const getCourseBookPage = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const course = await CourseModel.findById(courseId);
    if (!course)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Course not found" });
    const sessions = await SessionModel.listByCourse(courseId);
    const rows = sessions.map((s) => ({
      start: fmtDate(s.startDateTime),
      remaining: Math.max(0, (s.capacity ?? 0) - (s.bookedCount ?? 0)),
    }));
    res.render("course_book", {
      title: `Book · ${course.title}`,
      course: {
        id: course._id,
        title: course.title,
        level: course.level,
        type: course.type,
        allowDropIn: course.allowDropIn,
        startDate: course.startDate ? fmtDateOnly(course.startDate) : "",
        endDate: course.endDate ? fmtDateOnly(course.endDate) : "",
        description: course.description,
      },
      sessions: rows,
      sessionsCount: sessions.length,
    });
  } catch (e) {
    next(e);
  }
};

export const postBookCourse = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const booking = await bookCourseForUser(req.user._id, courseId);
    res.redirect(`/bookings/${booking._id}?status=${booking.status}`);
  } catch (err) {
    res
      .status(400)
      .render("error", { title: "Booking failed", message: err.message });
  }
};

export const getSessionBookPage = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const session = await SessionModel.findById(sessionId);
    if (!session)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Class not found" });
    const course = await CourseModel.findById(session.courseId);
    if (!course)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Course not found" });

    const remaining = Math.max(0, (session.capacity ?? 0) - (session.bookedCount ?? 0));
    res.render("session_book", {
      title: `Book class · ${course.title}`,
      course: {
        id: course._id,
        title: course.title,
        allowDropIn: course.allowDropIn,
        type: course.type,
      },
      session: {
        id: session._id,
        start: fmtDate(session.startDateTime),
        end: fmtDate(session.endDateTime),
        price: sessionPrice(session, course),
        location: sessionLocation(session, course),
        remaining,
        isFull: remaining <= 0,
      },
    });
  } catch (e) {
    next(e);
  }
};

export const postBookSession = async (req, res, next) => {
  try {
    const sessionId = req.params.id;
    const booking = await bookSessionForUser(req.user._id, sessionId);
    res.redirect(`/bookings/${booking._id}?status=${booking.status}`);
  } catch (err) {
    const message =
      err.code === "DROPIN_NOT_ALLOWED"
        ? "Drop-ins are not allowed for this course."
        : err.message;
    res.status(400).render("error", { title: "Booking failed", message });
  }
};

export const bookingConfirmationPage = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await BookingModel.findById(bookingId);
    if (!booking)
      return res
        .status(404)
        .render("error", { title: "Not found", message: "Booking not found" });
    if (booking.userId !== req.user._id) {
      return res.status(403).render("error", {
        title: "Access denied",
        message: "This booking belongs to another account.",
      });
    }

    res.render("booking_confirmation", {
      title: "Booking confirmation",
      booking: {
        id: booking._id,
        type: booking.type,
        status: req.query.status || booking.status,
        createdAt: booking.createdAt ? fmtDate(booking.createdAt) : "",
      },
    });
  } catch (err) {
    next(err);
  }
};
