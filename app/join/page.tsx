"use client";

import { SIMULATOR_URL } from "@/lib/links";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AnswerPanel } from "@/components/AnswerPanel";
import { LeaderList, MyScore, usePolled } from "@/components/Leaderboard";
import { scoreAnswer } from "@/lib/scoring";
import { StatusPill } from "@/components/StatusPill";
import { Model3DStage } from "@/components/Model3D";
import { questionFor } from "@/lib/questions";
import { KIND_LABEL, isInteractive, sceneAt } from "@/lib/scenes";
import { NicknameSchema, PHASE_LABEL } from "@/lib/state";
import { useLive } from "@/lib/useLive";
import { asset, useRoom } from "@/lib/room";

const PHONE_READ = { once: true, spreadMs: 6000 };

function JoinView() {
  const room = useRoom();
  const [nickname, setNickname] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Rejoining the same room skips the nickname step.
  useEffect(() => {
    setNickname(localStorage.getItem(`carm-nick-${room}`));
  }, [room]);

  const presence = useMemo(() => (nickname ? { role: "participant" as const, nickname } : null), [nickname]);
  const { state, status, participants, joinParticipant, submitAnswer, myAnswer, myResult, leaderboard, mode } = useLive(room, presence);
  const kindNow = sceneAt(state?.sceneIndex ?? 0).kind;
  const showingScores = !!nickname && (kindNow === "leaderboard" || kindNow === "end" || state?.phase === "scores");
  // Scores are fixed while they show: each phone reads them once, at a random moment in the first 6 s, retrying every 5 s.
  const result = usePolled(myResult, showingScores, 5000, PHONE_READ);
  const top10 = useCallback(() => leaderboard(10), [leaderboard]);
  const board = usePolled(top10, showingScores && kindNow !== "end", 5000, PHONE_READ);
  const me = result && nickname ? { nickname, rank: result.rank, score: result.score } : null;

  async function submit(name: string) {
    const parsed = NicknameSchema.safeParse(name);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setBusy(true);
    setError("");
    try {
      await joinParticipant(parsed.data);
      localStorage.setItem(`carm-nick-${room}`, parsed.data);
      setNickname(parsed.data);
    } catch (e) {
      setError(`เข้าร่วมไม่สำเร็จ: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  if (status === "missing") {
    return <Shell><p className="text-center text-lg text-mist">ไม่พบห้อง {room} ตรวจรหัสห้องอีกครั้ง</p></Shell>;
  }

  if (!nickname) {
    return (
      <Shell>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(draft);
          }}
          className="flex flex-col gap-4"
        >
          <p className="text-sm font-semibold tracking-wide text-amber">ห้อง {room}</p>
          <h1 className="font-display text-3xl font-bold">ใส่เลขที่และชื่อจริงเพื่อเข้าร่วม</h1>
          <p className="text-sm text-mist">เช่น 12 สมหญิง ชื่อนี้จะแสดงในอันดับคะแนนตอนท้าย</p>
          <label htmlFor="nick" className="sr-only">เลขที่และชื่อจริง</label>
          <input
            id="nick"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={24}
            autoComplete="off"
            placeholder="เลขที่ ชื่อจริง"
            className="rounded-xl border border-line bg-night-2 px-4 py-4 text-lg"
          />
          <button disabled={busy} className="rounded-xl bg-amber py-4 font-display text-lg font-bold text-ink disabled:opacity-50">
            {busy ? "กำลังเข้าร่วม…" : "เข้าร่วม"}
          </button>
          {error && <p className="text-warn" role="alert">{error}</p>}
        </form>
      </Shell>
    );
  }

  const scene = sceneAt(state?.sceneIndex ?? 0);
  const phase = state?.phase ?? "idle";
  const waiting = scene.kind === "cover" || scene.kind === "join" || scene.kind === "video";
  const question = questionFor(scene.id);
  const sceneIndex = state?.sceneIndex ?? 0;

  return (
    <Shell>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm">
          <b>{nickname}</b> <span className="text-mist">· ห้อง {room}</span>
        </p>
        <StatusPill status={status} mode={mode} />
      </header>

      {state?.sim?.m3?.on && <Model3DStage m3={state.sim.m3} lite />}

      <section aria-live="polite" className="flex flex-1 flex-col justify-center gap-4">
        {scene.kind === "outline" && scene.items ? (
          <>
            <h1 className="font-display text-3xl font-bold leading-snug">{scene.title}</h1>
            <ol className="flex flex-col gap-3">
              {scene.items.map((item, i) => (
                <li key={item} className="flex items-baseline gap-3 text-lg leading-snug">
                  <span className="w-5 shrink-0 text-right font-display font-bold tabular-nums text-amber">{i + 1}</span>
                  <span className="flex flex-col">
                    <span>{item}</span>
                    {scene.notes?.[i] && <span className="text-sm text-sky">{scene.notes[i]}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : waiting ? (
          <>
            <img src={asset("/cover.webp")} alt="ปกการสัมมนา ความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด" className="w-full rounded-2xl" />
            <p className="text-mist">เปิดหน้านี้ค้างไว้ หน้าจอจะเปลี่ยนเองเมื่อถึงกิจกรรม</p>
            <p>
              เข้าร่วมแล้ว <b className="tabular-nums text-amber">{participants}</b> คน
            </p>
          </>
        ) : scene.kind === "leaderboard" ? (
          <>
            <h1 className="font-display text-3xl font-bold">สรุปคะแนน</h1>
            <MyScore result={result} />
            <LeaderList rows={board} me={me} />
          </>
        ) : scene.kind === "end" ? (
          <>
            <h1 className="font-display text-3xl font-bold">ขอบคุณที่ร่วมกิจกรรม</h1>
            <MyScore result={result} />
            <a href={SIMULATOR_URL} className="rounded-xl border-2 border-amber px-4 py-3 text-center font-display font-bold text-amber">
              กดเข้าเล่น C-Arm สามมิติ (เข้าได้ทุกเวลา)
            </a>
            <p className="text-mist">หรือปิดหน้านี้ได้เลย</p>
          </>
        ) : question && phase === "scores" ? (
          <>
            <p className="text-sm font-semibold tracking-wide text-amber">คะแนนหลังข้อนี้</p>
            <h1 className="font-display text-2xl font-bold leading-snug">{scene.title}</h1>
            <ThisQuestion room={room} sceneIndex={sceneIndex} question={question} />
            <MyScore result={result} />
            <LeaderList rows={board} me={me} />
          </>
        ) : question ? (
          <AnswerPanel
            key={sceneIndex}
            room={room}
            sceneIndex={sceneIndex}
            question={question}
            phase={phase}
            submitAnswer={submitAnswer}
            myAnswer={myAnswer}
          />
        ) : isInteractive(scene.kind) ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-amber p-5 text-ink">
            <p className="text-sm font-semibold tracking-wide">กิจกรรม · {KIND_LABEL[scene.kind]}</p>
            <h1 className="font-display text-2xl font-bold leading-snug">{scene.title}</h1>
            <p>{scene.activity}</p>
            <p className="rounded-lg bg-ink/10 px-3 py-2 font-semibold">{PHASE_LABEL[phase]}</p>
            <p className="text-sm">[ เกมจำลองจะเพิ่มในระยะ C–E ]</p>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold tracking-wide text-amber">
              วิทยากรคนที่ {scene.speaker} · สไลด์ {scene.slide} จาก 12
            </p>
            <h1 className="font-display text-3xl font-bold leading-snug">{scene.title}</h1>
            <p className="text-mist">ฟังวิทยากรบนจอหลัก กิจกรรมถัดไปจะขึ้นที่นี่เอง</p>
          </>
        )}
      </section>
    </Shell>
  );
}

/** Points for the question just revealed, from the answer this device sent. */
function ThisQuestion({ room, sceneIndex, question }: { room: string; sceneIndex: number; question: NonNullable<ReturnType<typeof questionFor>> }) {
  const [answer, setAnswer] = useState<string[] | null | undefined>(undefined);
  useEffect(() => {
    const cached = localStorage.getItem(`carm-answer-${room}-${sceneIndex}`);
    setAnswer(cached ? (JSON.parse(cached) as string[]) : null);
  }, [room, sceneIndex]);
  if (answer === undefined) return null;
  const pts = answer ? scoreAnswer(answer, question) : 0;
  return (
    <p className={`font-display text-xl font-bold ${pts === 100 ? "text-ok" : pts > 0 ? "text-amber" : "text-warn"}`}>
      {answer ? `ข้อนี้ได้ ${pts} คะแนน` : "ข้อนี้ไม่ได้ตอบ (0 คะแนน)"}
    </p>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-6 px-4 py-6">{children}</main>;
}

// useSearchParams needs a Suspense boundary to build as a static page.
export default function JoinPage() {
  return (
    <Suspense>
      <JoinView />
    </Suspense>
  );
}
