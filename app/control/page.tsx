"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Qr, joinUrl, usePublicBase } from "@/components/Qr";
import { LeaderList, usePolled } from "@/components/Leaderboard";
import { DemoControls } from "@/components/Demo";
import { MODEL3D_SCENES, Model3DControls } from "@/components/Model3D";
import { ORMap } from "@/components/ORMap";
import { ResultBars } from "@/components/ResultBars";
import { StatusPill } from "@/components/StatusPill";
import { ScreenPreview } from "@/components/ScreenPreview";
import { questionFor } from "@/lib/questions";
import { useSummary } from "@/lib/useSummary";
import { KIND_LABEL, SCENES, isInteractive, sceneAt } from "@/lib/scenes";
import { DEFAULT_SIM, PHASE_LABEL, type Phase, type Sim } from "@/lib/state";
import { useLive } from "@/lib/useLive";
import { roomHref, useRoom } from "@/lib/room";

const PRESENCE = { role: "presenter" as const };
/** confirmRestart value for the header "start over" button (scene indexes are 0 and up) */
const RESTART_ALL = -1;

function PresentView() {
  const room = useRoom();
  const { state, status, participants, update, setSim, summary, leaderboard, mode } = useLive(room, PRESENCE);
  const base = usePublicBase();
  const [key, setKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showQr, setShowQr] = useState(false);
  /** scene index waiting for "clear all scores?" confirmation, or RESTART_ALL for the "start over" button */
  const [confirmRestart, setConfirmRestart] = useState<number | null>(null);

  // The presenter key arrives once as ?k= (shareable to a co-presenter), then lives in localStorage.
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

  const go = useCallback(
    async (sceneIndex: number, phase: Phase = "idle") => {
      if (!key || busy) return;
      setBusy(true);
      setError("");
      try {
        await update({ sceneIndex: Math.min(Math.max(sceneIndex, 0), SCENES.length - 1), phase }, key);
      } catch (e) {
        setError(`เปลี่ยนฉากไม่สำเร็จ: ${(e as Error).message}`);
      } finally {
        setBusy(false);
      }
    },
    [key, busy, update],
  );

  const changeSim = useCallback(
    async (next: Sim) => {
      if (!key) return;
      setBusy(true);
      setError("");
      try {
        await setSim(next, key);
      } catch (e) {
        setError(`เปลี่ยนการสาธิตไม่สำเร็จ: ${(e as Error).message}`);
      } finally {
        setBusy(false);
      }
    },
    [key, setSim],
  );

  // The QR popup also puts the join QR on the main screen; it rides along in the shared demo settings.
  const toggleQr = useCallback(
    (open: boolean) => {
      setShowQr(open);
      if (key) setSim({ ...(state?.sim ?? DEFAULT_SIM), qr: open }, key).catch(() => {});
    },
    [key, setSim, state?.sim],
  );

  const index = state?.sceneIndex ?? 0;
  const sim = state?.sim ?? DEFAULT_SIM;
  const vidPlaying = sim.vidPlay !== false;
  const phase = state?.phase ?? "idle";
  const scene = sceneAt(index);
  const next = index + 1 < SCENES.length ? SCENES[index + 1] : null;
  const interactive = isInteractive(scene.kind);
  const question = questionFor(scene.id);
  const top10 = useCallback(() => leaderboard(10), [leaderboard]);
  const board = usePolled(top10, scene.kind === "leaderboard" || phase === "scores");
  const results = useSummary(summary, index, phase, !!question && !!key, key ?? undefined);

  // A question scene must be revealed before moving forward; going back is always allowed.
  const mustReveal = !!question && phase !== "revealed" && phase !== "scores";
  // After the reveal, the first "next" shows the running scores; the second moves on.
  const scoresNext = !!question && phase === "revealed";
  const move = useCallback(
    (target: number) => {
      if (target > index && mustReveal) return setError("กดเฉลยก่อน แล้วจึงไปฉากถัดไปได้");
      if (target > index && scoresNext) return go(index, "scores");
      // Landing on a question (forward or back) opens it fresh; the server clears its earlier answers.
      const opensQuestion = target !== index && !!questionFor(sceneAt(target).id);
      go(target, opensQuestion ? "open" : "idle");
      // A video always opens playing, even if it was paused when the presenter left it.
      if (target !== index && sceneAt(target).kind === "video" && state?.sim?.vidPlay === false && key)
        setSim({ ...state.sim, vidPlay: true }, key).catch(() => {});
    },
    [index, mustReveal, scoresNext, go, state?.sim, key, setSim],
  );

  // Entering question 1 wipes every answer in the room, so ask first when there is anything to lose.
  const FIRST_QUESTION = SCENES.findIndex((s) => questionFor(s.id));
  const requestMove = useCallback(
    async (target: number) => {
      if (target !== FIRST_QUESTION || target === index || !key) return move(target);
      const counts = await Promise.all(
        SCENES.map((s, i) => (questionFor(s.id) ? summary(i, key).then((r) => r?.respondents ?? 0).catch(() => 0) : 0)),
      );
      if (counts.some((n) => n > 0)) setConfirmRestart(target);
      else move(target);
    },
    [FIRST_QUESTION, index, key, move, summary],
  );

  // "Start over": back to scene 1 with every answer and score cleared. The server clears the room when it
  // enters question 1, so the room passes through it (unopened) on the way back to the first scene.
  const restartAll = useCallback(async () => {
    if (!key) return;
    setBusy(true);
    setError("");
    try {
      if (index === FIRST_QUESTION) await update({ sceneIndex: 0, phase: "idle" }, key);
      await update({ sceneIndex: FIRST_QUESTION, phase: "idle" }, key);
      await update({ sceneIndex: 0, phase: "idle" }, key);
      await setSim(DEFAULT_SIM, key);
    } catch (e) {
      setError(`เริ่มใหม่ไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }, [key, index, FIRST_QUESTION, update, setSim]);

  // Clickers send arrow keys or Page Up/Down.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || confirmRestart !== null || showQr) return;
      if (["ArrowRight", "PageDown"].includes(e.key)) requestMove(index + 1);
      if (["ArrowLeft", "PageUp"].includes(e.key)) requestMove(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestMove, index, confirmRestart, showQr]);

  if (status === "missing") return <Center>ไม่พบห้อง {room}</Center>;
  if (key === null) return <Center>ไม่มีสิทธิ์ควบคุมห้องนี้ เปิดจากลิงก์ผู้บรรยายที่ได้ตอนสร้างห้อง</Center>;

  const presenterLink = `${base}${roomHref("control", room)}&k=${key}`;

  return (
    <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 pt-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:pb-6">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold">
            ห้อง <span className="font-mono tracking-widest text-amber">{room}</span>
          </h1>
          <StatusPill status={status} mode={mode} />
          <span className="rounded-full bg-night-2 px-3 py-1 text-sm">
            ผู้เข้าร่วมออนไลน์ <b className="tabular-nums">{participants}</b> คน
          </span>
          <button
            onClick={() => setConfirmRestart(RESTART_ALL)}
            disabled={busy}
            className="ml-auto rounded-lg border border-warn px-3 py-2 text-sm font-semibold text-warn disabled:opacity-40"
            aria-haspopup="dialog"
          >
            เริ่มใหม่
          </button>
          <button
            onClick={() => toggleQr(true)}
            className="rounded-lg bg-amber px-3 py-2 text-sm font-semibold text-ink"
            aria-haspopup="dialog"
          >
            QR เข้าห้อง
          </button>
          <Link href={roomHref("summary", room)} target="_blank" className="rounded-lg border border-line px-3 py-2 text-sm">
            สรุปคะแนน
          </Link>
          <Link href={roomHref("screen", room)} target="_blank" className="rounded-lg border border-sky px-3 py-2 text-sm text-sky">
            เปิดจอหลัก (โปรเจกเตอร์)
          </Link>
        </header>

        <section aria-live="polite" className="flex flex-col gap-3 rounded-2xl border border-line bg-night-2 p-6">
          <p className="text-sm font-semibold tracking-wide text-amber">
            ฉาก {index + 1} จาก {SCENES.length} · {KIND_LABEL[scene.kind]}
            {scene.speaker && ` · วิทยากรคนที่ ${scene.speaker}`}
          </p>
          <h2 className="sr-only">{scene.title}</h2>
          <ScreenPreview room={room} />
          {scene.activity && <p className="text-mist">กิจกรรม: {scene.activity}</p>}
          {interactive && (
            <p className="text-sm">
              สถานะ: <b className="text-sky">{PHASE_LABEL[phase]}</b>
              {question && (
                <>
                  {" · "}ตอบแล้ว <b className="tabular-nums text-amber">{results?.respondents ?? 0}</b> จาก {participants} คนที่ออนไลน์
                </>
              )}
            </p>
          )}
        </section>

        {scene.kind === "video" && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => changeSim({ ...sim, vidPlay: !vidPlaying })}
              disabled={busy}
              className="rounded-xl border-2 border-sky py-4 font-display text-lg font-bold text-sky disabled:opacity-40"
            >
              {vidPlaying ? "⏸ หยุดชั่วคราว" : "▶ เล่นต่อ"}
            </button>
            <button
              onClick={() => changeSim({ ...sim, vidPlay: true, vidSeq: (sim.vidSeq ?? 0) + 1 })}
              disabled={busy}
              className="rounded-xl border-2 border-line py-4 font-display text-lg font-bold disabled:opacity-40"
            >
              ⟲ เล่นตั้งแต่ต้น
            </button>
          </div>
        )}

        {interactive && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => go(index, phase === "open" ? "locked" : "open")}
                disabled={busy || phase === "revealed" || phase === "scores"}
                className={`rounded-xl border-2 py-4 font-display text-lg font-bold disabled:opacity-40 ${
                  phase === "open" ? "border-warn text-warn" : "border-sky text-sky"
                }`}
              >
                {phase === "open" ? "■ ปิดรับคำตอบ" : phase === "locked" ? "▶ เปิดรับคำตอบอีกครั้ง" : phase === "revealed" || phase === "scores" ? "ปิดรับคำตอบแล้ว" : "▶ เปิดรับคำตอบ"}
              </button>
              <button
                onClick={() => go(index, "revealed")}
                disabled={busy || phase === "idle" || phase === "revealed" || phase === "scores"}
                className="rounded-xl border-2 border-ok py-4 font-display text-lg font-bold text-ok disabled:opacity-40"
              >
                {phase === "revealed" || phase === "scores" ? "เฉลยแล้ว" : "เฉลย"}
              </button>
            </div>
            <button onClick={() => go(index, "idle")} disabled={busy || phase === "idle"} className="w-fit text-xs text-mist underline disabled:opacity-40">
              รีเซ็ตฉาก (กลับไปสถานะยังไม่เปิดรับคำตอบ)
            </button>
          </div>
        )}


        {(scene.kind === "leaderboard" || phase === "scores") && (
          <section className="flex flex-col gap-3 rounded-2xl border border-line p-5">
            <p className="font-semibold">10 อันดับแรก (จอหลักแสดงชุดเดียวกัน)</p>
            <LeaderList rows={board} />
          </section>
        )}

        {question && (
          <section className="flex flex-col gap-3 rounded-2xl border border-line p-5">
            <p className="font-semibold">{question.prompt}</p>
            {question.map && (
              <ORMap geometry={question.map} reveal={phase === "revealed"} correct={question.correct} counts={results?.counts} className="max-w-md" />
            )}
            <ResultBars question={question} summary={results} showCorrect />
            <p className="text-xs text-mist">ผลนี้เห็นเฉพาะผู้บรรยาย จอหลักจะแสดงเมื่อกดเฉลย</p>
          </section>
        )}


        {MODEL3D_SCENES.includes(scene.id) && <Model3DControls sim={sim} onChange={changeSim} busy={busy} />}

        <DemoControls sim={state?.sim ?? DEFAULT_SIM} onChange={changeSim} busy={busy} />

        <p className="text-xs text-mist">ใช้ปุ่มลูกศรซ้ายขวาหรือรีโมตเปลี่ยนสไลด์ได้</p>

        {/* Pinned to the bottom so the iPad never has to scroll to move on. */}
        <div className="sticky bottom-0 z-20 -mx-4 mt-auto flex flex-col gap-2 border-t border-line bg-night/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
          {error && <p className="text-sm text-warn" role="alert">{error}</p>}
          {mustReveal ? (
            <p className="text-sm text-amber">ต้องกดเฉลยก่อน จึงไปฉากถัดไปได้</p>
          ) : (
            next && <p className="truncate text-sm text-mist">ถัดไป: {next.title}</p>
          )}
          <div className="grid grid-cols-[1fr_1.4fr] gap-3">
            <button onClick={() => requestMove(index - 1)} disabled={busy || index === 0} className="rounded-xl border border-line py-4 font-display text-xl font-bold disabled:opacity-40">
              ← ก่อนหน้า
            </button>
            <button onClick={() => requestMove(index + 1)} disabled={busy || !next || mustReveal} className="rounded-xl bg-amber py-4 font-display text-xl font-bold text-ink disabled:opacity-40">
              {scoresNext ? "แสดงคะแนน →" : "ถัดไป →"}
            </button>
          </div>
          {/* Portrait iPad: the scene list sits far below, so jump from here instead. */}
          <label className="flex items-center gap-2 text-sm text-mist lg:hidden">
            <span className="shrink-0">ไปที่ฉาก</span>
            <select
              id="scene-jump"
              value={index}
              disabled={busy}
              onChange={(e) => requestMove(Number(e.target.value))}
              className="min-w-0 flex-1 rounded-lg border border-line bg-night-2 px-3 py-2 text-paper disabled:opacity-40"
            >
              {SCENES.map((s, i) => (
                <option key={s.id} value={i} disabled={i > index && mustReveal}>
                  {i + 1}. {s.slide ? `สไลด์ ${s.slide} · ` : ""}
                  {s.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <aside className="flex min-w-0 flex-col gap-4 pb-6 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:self-start lg:overflow-y-auto lg:pb-0">
        <nav aria-label="ฉากทั้งหมด" className="flex flex-col gap-1 rounded-2xl border border-line p-2">
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => requestMove(i)}
              disabled={busy || (i > index && mustReveal)}
              aria-current={i === index ? "step" : undefined}
              className={`rounded-lg px-3 py-2 text-left text-sm disabled:opacity-40 ${i === index ? "bg-sea text-white disabled:opacity-100" : "hover:bg-night-2"}`}
            >
              <span className="mr-2 font-mono text-xs text-mist">{s.slide ?? "–"}</span>
              {s.title}
              {isInteractive(s.kind) && <span className="ml-1 text-amber">●</span>}
            </button>
          ))}
        </nav>
        <details className="rounded-2xl border border-line p-3 text-xs text-mist">
          <summary className="cursor-pointer">ลิงก์ผู้บรรยาย (ห้ามแชร์ให้ผู้เข้าร่วม)</summary>
          <p className="mt-2">สแกนด้วยมือถือที่ต่อ wifi เดียวกัน เพื่อคุมห้องจากมือถือ</p>
          <Qr value={presenterLink} size={160} className="mt-2" label="QR ลิงก์ผู้บรรยาย" />
          <p className="mt-2 break-all">{presenterLink}</p>
        </details>
      </aside>
      {showQr && <QrPopup room={room} participants={participants} onClose={() => toggleQr(false)} />}
      {confirmRestart !== null && (
        <ConfirmRestart
          full={confirmRestart === RESTART_ALL}
          onCancel={() => setConfirmRestart(null)}
          onConfirm={() => {
            const t = confirmRestart;
            setConfirmRestart(null);
            if (t === RESTART_ALL) restartAll();
            else move(t);
          }}
        />
      )}
    </main>
  );
}

function ConfirmRestart({ full, onCancel, onConfirm }: { full: boolean; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-night/85 p-4 backdrop-blur-sm" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="restart-title"
        aria-describedby="restart-desc"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-3xl border-2 border-warn bg-night-2 p-6"
      >
        <h2 id="restart-title" className="font-display text-2xl font-bold">
          {full ? "เริ่มใหม่ทั้งหมด?" : "เริ่มข้อ 1 ใหม่?"}
        </h2>
        <p id="restart-desc" className="text-mist">
          {full && "กลับไปฉากแรก "}คำตอบและคะแนนของ<b className="text-paper">ทุกคนในห้อง</b>จะถูกลบ แล้วเริ่มนับใหม่จากศูนย์ ย้อนคืนไม่ได้
          รายชื่อผู้เข้าร่วมยังอยู่ครบ
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button autoFocus onClick={onCancel} className="rounded-xl border border-line px-5 py-3 font-semibold">
            ยกเลิก
          </button>
          <button onClick={onConfirm} className="rounded-xl bg-warn px-5 py-3 font-semibold text-ink">
            ลบคะแนนและเริ่มใหม่
          </button>
        </div>
      </div>
    </div>
  );
}

function QrPopup({ room, participants, onClose }: { room: string; participants: number; onClose: () => void }) {
  const url = joinUrl(usePublicBase(), room);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-night/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="QR สำหรับเข้าห้อง"
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl border border-line bg-night-2 p-6"
      >
        <div className="flex w-full items-center justify-between">
          <p className="font-display text-xl font-bold">
            ห้อง <span className="font-mono tracking-widest text-amber">{room}</span>
          </p>
          <button onClick={onClose} autoFocus className="rounded-lg px-3 py-1 text-mist hover:bg-night" aria-label="ปิด">
            ✕
          </button>
        </div>
        <Qr value={url} size={300} />
        <p className="break-all text-center text-sm text-mist">{url}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() =>
              navigator.clipboard
                ?.writeText(url)
                .then(() => setCopied(true))
                .catch(() => setCopied(false))
            }
            className="rounded-lg border border-sky px-4 py-2 text-sm text-sky"
          >
            {copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}
          </button>
        </div>
        <p className="text-sm">
          เข้าร่วมแล้ว <b className="tabular-nums text-amber">{participants}</b> คน
        </p>
      </div>
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 items-center justify-center p-6 text-center text-lg text-mist">{children}</main>;
}

// useSearchParams needs a Suspense boundary to build as a static page.
export default function ControlPage() {
  return (
    <Suspense>
      <PresentView />
    </Suspense>
  );
}
