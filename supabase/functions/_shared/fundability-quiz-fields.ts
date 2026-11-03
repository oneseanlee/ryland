import { BENCHMARKS, scoreAssessment, type Answer } from "./fundability.ts";

export function quizCustomFields(answers: Record<string, Answer>, completedAt: string) {
  const result = scoreAssessment(answers);
  return [
    { id: "DeHa5lUES78xgzGHK1z8", field_value: result.total },
    { id: "qus9hzaK6eiiQQ3ikUUw", field_value: result.track },
    { id: "lUoyZSsfb9zck1WHpIbd", field_value: result.failed.map((id) => BENCHMARKS.find((b) => b.id === id)?.title ?? id).join("\n") },
    { id: "k1nTuBBq6WilEdZWmvcn", field_value: JSON.stringify(answers, null, 2) },
    { id: "EgMMU713TJ2x0TxKsLIm", field_value: completedAt.slice(0, 10) },
  ];
}

export interface QuizAppointment { id?: string; title?: string; calendarTitle?: string; startTime?: string; notes?: string; description?: string }
export function fundingReviewUpdate(appt: QuizAppointment, score: number, track: string, redChecks: string, now = Date.now()) {
  const funding = [appt.title, appt.calendarTitle].some((title) => title?.toLowerCase().includes("funding review"));
  if (!appt.id || !funding || !appt.startTime || new Date(appt.startTime).getTime() <= now || !Number.isFinite(new Date(appt.startTime).getTime())) return null;
  const existing = appt.notes ?? appt.description ?? "";
  if (existing.startsWith("[Fundability Quiz:")) return null;
  return `[Fundability Quiz: ${score}/12 · Track: ${track}]\nRed flags: ${redChecks || "none"}\n\n${existing}`;
}