// controllers/coursesListController.js
import { CourseModel } from "../models/courseModel.js";
import { SessionModel } from "../models/sessionModel.js";
import {
  courseHasUpcomingContent,
  startOfToday,
} from "../utils/upcomingCourses.js";

const fmtDateOnly = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

const fmtDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "TBA";

function fmtMoney(n) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return `£${Number(n).toFixed(2)}`;
}

export const coursesListPage = async (req, res, next) => {
  try {
    const {
      level,
      type,
      dropin,
      q,
      page = "1",
      pageSize = "10",
    } = req.query;

    const filter = {};
    if (level) filter.level = level;
    if (type) filter.type = type;
    if (dropin === "yes") filter.allowDropIn = true;
    if (dropin === "no") filter.allowDropIn = false;

    let courses = await CourseModel.list(filter);

    const needle = (q || "").trim().toLowerCase();
    if (needle) {
      courses = courses.filter(
        (c) =>
          c.title?.toLowerCase().includes(needle) ||
          c.description?.toLowerCase().includes(needle)
      );
    }

    const upcomingOnly = [];
    for (const c of courses) {
      const sessions = await SessionModel.listByCourse(c._id);
      if (courseHasUpcomingContent(c, sessions)) upcomingOnly.push(c);
    }
    courses = upcomingOnly;

    courses.sort((a, b) => {
      const ad = a.startDate
        ? new Date(a.startDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bd = b.startDate
        ? new Date(b.startDate).getTime()
        : Number.MAX_SAFE_INTEGER;
      if (ad !== bd) return ad - bd;
      return (a.title || "").localeCompare(b.title || "");
    });

    const p = Math.max(1, parseInt(page, 10) || 1);
    const ps = Math.max(1, parseInt(pageSize, 10) || 10);
    const total = courses.length;
    const totalPages = Math.max(1, Math.ceil(total / ps));
    const start = (p - 1) * ps;
    const pageItems = courses.slice(start, start + ps);

    const cards = await Promise.all(
      pageItems.map(async (c) => {
        const sessions = await SessionModel.listByCourse(c._id);
        const upcomingSessions = sessions.filter(
          (s) => new Date(s.startDateTime) >= startOfToday()
        );
        const ordered = upcomingSessions.length ? upcomingSessions : sessions;
        const first = ordered[0];
        return {
          id: c._id,
          title: c.title,
          level: c.level,
          type: c.type,
          allowDropIn: c.allowDropIn,
          location: c.location || "—",
          price: fmtMoney(c.defaultPriceGbp),
          startDate: fmtDateOnly(c.startDate),
          endDate: fmtDateOnly(c.endDate),
          nextSession: first ? fmtDateTime(first.startDateTime) : "TBA",
          sessionsCount: sessions.length,
          description: c.description,
        };
      })
    );

    const pagination = {
      page: p,
      pageSize: ps,
      total,
      totalPages,
      hasPrev: p > 1,
      hasNext: p < totalPages,
      prevLink: p > 1 ? buildLink(req, p - 1, ps) : null,
      nextLink: p < totalPages ? buildLink(req, p + 1, ps) : null,
    };

    const showSignupBanner = req.query.signedup === "1";

    res.render("courses", {
      title: "Courses",
      showSignupBanner,
      filters: {
        level,
        type,
        dropin,
        q,
        anyLevel: !level,
        anyType: !type,
        anyDropin: !dropin,
        levelBeginner: level === "beginner",
        levelIntermediate: level === "intermediate",
        levelAdvanced: level === "advanced",
        typeWeekly: type === "WEEKLY_BLOCK",
        typeWeekend: type === "WEEKEND_WORKSHOP",
        dropinYes: dropin === "yes",
        dropinNo: dropin === "no",
      },
      courses: cards,
      pagination,
    });
  } catch (err) {
    next(err);
  }
};

function buildLink(req, page, pageSize) {
  const url = new URL(
    `${req.protocol}://${req.get("host")}${req.originalUrl.split("?")[0]}`
  );
  const params = new URLSearchParams(req.query);
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  return `${url.pathname}?${params.toString()}`;
}
