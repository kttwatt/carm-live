"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ResultBars } from "@/components/ResultBars";
import { QUESTIONS } from "@/lib/questions";
import { SCENES } from "@/lib/scenes";
import { POINTS, type ReportRow } from "@/lib/scoring";
import { useLive } from "@/lib/useLive";
import { roomHref, useRoom } from "@/lib/room";

// Question scenes in deck order: [sceneIndex, scene, question]
const QUESTION_SCENES = SCENES.flatMap((s, i) => (QUESTIONS[s.id] ? [{ index: i, scene: s, q: QUESTIONS[s.id] }] : []));
const MAX = QUESTION_SCENES.length * POINTS;

type Person = { id: string; nickname: string; points: Map<number, number>; total: number; answered: number; full: number; rank: number };

function build(rows: ReportRow[]) {
  const people = new Map<string, Person>();
  for (const r of rows) {
    const p = people.get(r.participantId) ?? { id: r.participantId, nickname: r.nickname, points: new Map(), total: 0, answered: 0, full: 0, rank: 0 };
    if (r.sceneIndex != null && r.points != null) {
      p.points.set(r.sceneIndex, r.points);
      p.total += r.points;
      p.answered += 1;
      if (r.points === POINTS) p.full += 1;
    }
    people.set(r.participantId, p);
  }
  const list = [...people.values()].sort((a, b) => b.total - a.total);
  list.forEach((p) => (p.rank = list.findIndex((x) => x.total === p.total) + 1));
  const perQuestion = QUESTION_SCENES.map(({ index, scene, q }) => {
    const answers = rows.filter((r) => r.sceneIndex === index && r.answer);
    const counts: Record<string, number> = {};
    answers.forEach((r) => r.answer!.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1)));
    const full = answers.filter((r) => r.points === POINTS).length;
    return { index, scene, q, respondents: answers.length, full, counts };
  });
  return { list, perQuestion };
}

function toCsv(list: Person[]) {
  const head = ["อันดับ", "เลขที่ ชื่อ", ...QUESTION_SCENES.map(({ scene }) => `สไลด์ ${scene.slide}`), "รวม", "ตอบ (ข้อ)", "ได้เต็ม (ข้อ)"];
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = list.map((p) => [p.rank, p.nickname, ...QUESTION_SCENES.map(({ index }) => p.points.get(index) ?? ""), p.total, p.answered, p.full]);
  // BOM so Excel opens Thai text correctly
  return "﻿" + [head, ...lines].map((l) => l.map(esc).join(",")).join("\r\n");
}

function SummaryView() {
  const room = useRoom();
  const { report, status } = useLive(room, null);
  const [key, setKey] = useState<string | null>(null);
  const [rows, setRows] = useState<ReportRow[] | null>(null);
  const [error, setError] = useState("");
  const [updated, setUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const fromUrl = url.searchParams.get("k");
    if (fromUrl) {
      localStorage.setItem(`carm-presenter-${room}`, fromUrl);
      url.searchParams.delete("k");
      window.history.replaceState(null, "", url.toString());
    }
    setKey(fromUrl ?? localStorage.getItem(`carm-presenter-${room}`));
  }, [room]);

  const load = useCallback(async () => {
    if (!key) return;
    try {
      setRows(await report(key));
      setUpdated(new Date());
      setError("");
    } catch (e) {
      setError(`โหลดคะแนนไม่สำเร็จ: ${(e as Error).message}`);
    }
  }, [key, report]);

  // Refresh every 10 s so the page can stay open during the session.
  useEffect(() => {
    if (!key || status === "connecting") return;
    load();
    const t = window.setInterval(load, 10000);
    return () => clearInterval(t);
  }, [key, status, load]);

  const data = useMemo(() => (rows ? build(rows) : null), [rows]);

  function download() {
    if (!data) return;
    const blob = new Blob([toCsv(data.list)], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `คะแนน-${room}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (status === "missing") return <Center>ไม่พบห้อง {room}</Center>;
  if (key === null) return <Center>หน้านี้สำหรับผู้บรรยาย เปิดจากหน้าผู้บรรยายของห้องนี้</Center>;

  const list = data?.list ?? [];
  const answeredAny = list.filter((p) => p.answered > 0);
  const avg = answeredAny.length ? Math.round(answeredAny.reduce((s, p) => s + p.total, 0) / answeredAny.length) : 0;
  const best = list[0]?.total ?? 0;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-end gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="text-sm font-semibold tracking-wide text-amber">ห้อง {room}</p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">สรุปคะแนน</h1>
          <p className="text-sm text-mist">
            {updated ? `อัปเดตล่าสุด ${updated.toLocaleTimeString("th-TH")} · รีเฟรชเองทุก 10 วินาที` : "กำลังโหลด…"}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Link href={roomHref("control", room)} className="rounded-lg border border-line px-4 py-2 text-sm">
            ← หน้าผู้บรรยาย
          </Link>
          <button onClick={load} className="rounded-lg border border-sky px-4 py-2 text-sm text-sky">
            รีเฟรช
          </button>
          <button onClick={download} disabled={!data || !list.length} className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-ink disabled:opacity-40">
            ดาวน์โหลด CSV (Excel)
          </button>
        </div>
      </header>
      {error && <p className="text-warn" role="alert">{error}</p>}

      {/* overview */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ["ผู้เข้าร่วม", `${list.length}`, "คน"],
          ["ตอบอย่างน้อย 1 ข้อ", `${answeredAny.length}`, "คน"],
          ["คะแนนเฉลี่ย", `${avg}`, `จาก ${MAX}`],
          ["คะแนนสูงสุด", `${best}`, `จาก ${MAX}`],
        ].map(([label, value, unit]) => (
          <div key={label} className="flex flex-col gap-1 rounded-2xl bg-night-2 p-4">
            <p className="text-sm text-mist">{label}</p>
            <p className="font-display text-3xl font-bold tabular-nums">
              {value} <span className="text-base font-normal text-mist">{unit}</span>
            </p>
          </div>
        ))}
      </section>

      {/* per question */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">รายข้อ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {data?.perQuestion.map(({ index, scene, q, respondents, full, counts }) => {
            const pct = respondents ? Math.round((full / respondents) * 100) : 0;
            return (
              <article key={index} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-line p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber">สไลด์ {scene.slide} · วิทยากรคนที่ {scene.speaker}</p>
                    <h3 className="font-semibold leading-snug">{q.prompt}</h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`font-display text-3xl font-bold tabular-nums ${pct >= 70 ? "text-ok" : pct >= 40 ? "text-amber" : "text-warn"}`}>{pct}%</p>
                    <p className="text-xs text-mist">ได้เต็ม {full}/{respondents} คน</p>
                  </div>
                </div>
                <ResultBars question={q} summary={{ respondents, counts }} showCorrect />
                {respondents > 0 && pct < 40 && <p className="text-sm text-warn">ตอบถูกน้อย ควรทบทวนเนื้อหาข้อนี้</p>}
              </article>
            );
          })}
        </div>
      </section>

      {/* per person */}
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-bold">รายบุคคล</h2>
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead className="bg-night-2 text-left text-mist">
              <tr>
                <th className="px-3 py-2 font-semibold">อันดับ</th>
                <th className="px-3 py-2 font-semibold">เลขที่ ชื่อ</th>
                {QUESTION_SCENES.map(({ index, scene }) => (
                  <th key={index} className="px-3 py-2 text-right font-semibold">
                    สไลด์ {scene.slide}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-semibold">รวม</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="px-3 py-2 font-display font-bold tabular-nums">{p.rank}</td>
                  <td className="px-3 py-2">{p.nickname}</td>
                  {QUESTION_SCENES.map(({ index }) => {
                    const v = p.points.get(index);
                    return (
                      <td key={index} className={`px-3 py-2 text-right tabular-nums ${v === POINTS ? "font-semibold text-ok" : v === 0 ? "text-warn" : v == null ? "text-mist" : ""}`}>
                        {v ?? "–"}
                      </td>
                    );
                  })}
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{p.total}</td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td colSpan={QUESTION_SCENES.length + 3} className="px-3 py-6 text-center text-mist">
                    ยังไม่มีผู้เข้าร่วม
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-mist">
          สีเขียว = ได้เต็ม 100 · สีส้ม = 0 · ขีด = ไม่ได้ตอบ · คะแนนเกมภารกิจสุดท้ายจะรวมเมื่อทำระยะ E เสร็จ · หน้านี้เห็นคำตอบรายคน ไม่ควรขึ้นจอหลัก
        </p>
      </section>
    </main>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 items-center justify-center p-6 text-center text-lg text-mist">{children}</main>;
}

// useSearchParams needs a Suspense boundary to build as a static page.
export default function SummaryPage() {
  return (
    <Suspense>
      <SummaryView />
    </Suspense>
  );
}
