// utils/upcomingCourses.js
import { SessionModel } from "../models/sessionModel.js";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export function courseHasUpcomingContent(course, sessions) {
  const t0 = startOfToday().getTime();
  if (sessions.some((s) => new Date(s.startDateTime).getTime() >= t0)) return true;
  if (course.endDate) {
    const end = new Date(course.endDate);
    end.setHours(23, 59, 59, 999);
    return end.getTime() >= t0;
  }
  return false;
}

export async function filterUpcomingCourses(courses) {
  const out = [];
  for (const c of courses) {
    const sessions = await SessionModel.listByCourse(c._id);
    if (courseHasUpcomingContent(c, sessions)) out.push(c);
  }
  return out;
}

export { startOfToday };
