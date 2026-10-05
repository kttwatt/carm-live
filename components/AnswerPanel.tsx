"use client";

import { useEffect, useRef, useState } from "react";
import { ORMap } from "@/components/ORMap";
import type { Question } from "@/lib/questions";
import type { Phase } from "@/lib/state";

/** Participant's answer card for one question scene. */
export function AnswerPanel({
  room,
  sceneIndex,
  question,
  phase,
  submitAnswer,
  myAnswer,
}: {
  room: string;
  sceneIndex: number;
  question: Question;
  phase: Phase;
  submitAnswer: (sceneIndex: number, answer: string[]) => Promise<void>;
  myAnswer: (sceneIndex: number) => Promise<string[] | null>;
}) {
  const cacheKey = `carm-answer-${room}-${sceneIndex}`;
  const [picked, setPicked] = useState<string[]>([]);
  const [sent, setSent] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<number | null>(null);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  // The server is the source of truth: a question re-entered or reset starts empty,
  // so re-read this device's answer on mount and whenever the question opens or resets.
  const fresh = phase === "open" || phase === "idle";
  useEffect(() => {
    let alive = true;
    myAnswer(sceneIndex)
      .then((a) => {
        if (!alive) return;
        setSent(a);
        setPicked(a ?? []);
        if (a) localStorage.setItem(cacheKey, JSON.stringify(a));
        else localStorage.removeItem(cacheKey);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [cacheKey, sceneIndex, myAnswer, fresh]);

  const open = phase === "open";
  const revealed = phase === "revealed";

  // Every tap saves (after a short pause so quick changes go out as one); no submit button.
  function toggle(id: string) {
    if (!open) return;
    const next = question.multi ? (picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]) : [id];
    setPicked(next);
    setError("");
    setSaving(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => save(next), 400);
  }

  async function save(answer: string[]) {
    try {
      await submitAnswer(sceneIndex, answer);
      setSent(answer.length ? answer : null);
      if (answer.length) localStorage.setItem(cacheKey, JSON.stringify(answer));
      else localStorage.removeItem(cacheKey);
    } catch (e) {
      setError(`บันทึกไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }
  const isRight = sent !== null && sent.length === question.correct.length && sent.every((s) => question.correct.includes(s));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-2xl font-bold leading-snug">{question.prompt}</h1>
      {question.multi && open && <p className="-mt-2 text-sm text-mist">เลือกได้หลายข้อ</p>}

      {question.map && (
        <div className="flex flex-col gap-2">
          <ORMap
            geometry={question.map}
            selected={picked[0] ?? null}
            onPick={open ? toggle : undefined}
            reveal={revealed}
            correct={question.correct}
          />
          <p className="text-sm text-mist">
            {picked[0]
              ? `คุณเลือก: ${question.choices.find((c) => c.id === picked[0])?.label}`
              : open
                ? "แตะวงกลม A–F บนผังเพื่อเลือกจุดยืน"
                : ""}
          </p>
        </div>
      )}

      <div role={question.multi ? "group" : "radiogroup"} aria-label="ตัวเลือก" className={`flex flex-col gap-2 ${question.map ? "hidden" : ""}`}>
        {question.choices.map((c) => {
          const on = picked.includes(c.id);
          const correct = revealed && question.correct.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              role={question.multi ? "checkbox" : "radio"}
              aria-checked={on}
              disabled={!open}
              onClick={() => toggle(c.id)}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-base transition-colors ${
                correct ? "border-ok" : on ? "border-amber bg-amber/15" : "border-line"
              } ${open ? "" : "cursor-default"}`}
            >
              <span
                aria-hidden
                className={`grid h-6 w-6 shrink-0 place-items-center border-2 text-sm ${question.multi ? "rounded-md" : "rounded-full"} ${
                  on ? "border-amber bg-amber text-ink" : "border-mist"
                }`}
              >
                {on ? "✓" : ""}
              </span>
              <span className="min-w-0 flex-1">{c.label}</span>
              {correct && <span className="shrink-0 text-sm font-semibold text-ok">ถูกต้อง</span>}
            </button>
          );
        })}
      </div>

      {phase === "idle" && <p className="text-mist">รอวิทยากรเปิดรับคำตอบ</p>}
      {open && (
        <p aria-live="polite" className={`text-center text-sm ${sent && !saving ? "text-ok" : "text-mist"}`}>
          {saving ? "กำลังบันทึก…" : sent ? "✓ บันทึกคำตอบแล้ว เปลี่ยนได้จนกว่าวิทยากรจะเฉลย" : "แตะเลือกคำตอบ ระบบบันทึกให้ทันที"}
        </p>
      )}
      {phase === "locked" && <p className="font-semibold">{sent ? "ปิดรับคำตอบแล้ว รอเฉลยบนจอหลัก" : "ปิดรับคำตอบแล้ว คุณยังไม่ได้ตอบข้อนี้"}</p>}
      {revealed && (
        <div className="flex flex-col gap-2 rounded-xl bg-night-2 p-4">
          <p className={`font-display text-lg font-bold ${sent ? (isRight ? "text-ok" : "text-warn") : "text-mist"}`}>
            {sent ? (isRight ? "ตอบถูก" : "ยังไม่ถูก") : "ไม่ได้ตอบข้อนี้"}
          </p>
          <p className="text-sm leading-relaxed text-mist">{question.explanation}</p>
        </div>
      )}
      {error && <p className="text-warn" role="alert">{error}</p>}
    </div>
  );
}
