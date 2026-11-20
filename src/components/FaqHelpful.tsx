"use client";

import { useState } from "react";
import { track } from "@/lib/tracking";

/** "Was this helpful?" Sends only the question id and yes/no, never free text. */
export function FaqHelpful({ questionId }: { questionId: string }) {
  const [answered, setAnswered] = useState(false);
  if (answered) return <p role="status" className="text-slate">Thank you for telling us.</p>;
  const answer = (value: "yes" | "no") => {
    track("faq_helpful", { question_id: questionId, value, page_type: "faq" });
    setAnswered(true);
  };
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="font-semibold text-maroon">Was this helpful?</span>
      <button type="button" onClick={() => answer("yes")} className="btn-ghost min-h-12">Yes</button>
      <button type="button" onClick={() => answer("no")} className="btn-ghost min-h-12">No</button>
    </div>
  );
}
