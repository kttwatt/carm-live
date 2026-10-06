"use client";

import { Explanation } from "@/components/Explanation";
import { Qr, joinUrl, usePublicBase } from "@/components/Qr";
import { LeaderList, usePolled } from "@/components/Leaderboard";
import { Model3DStage } from "@/components/Model3D";
import { VideoScene } from "@/components/VideoScene";
import { SoundHint } from "@/components/SoundHint";
import { useSearchParams } from "next/navigation";
import { ORMap } from "@/components/ORMap";
import { LecturePage } from "@/components/LecturePage";
import { OneLine } from "@/components/OneLine";
import { isTopic, pagesFor } from "@/lib/pages";
import { ResultBars } from "@/components/ResultBars";
import { Suspense, useCallback } from "react";
import { questionFor, type Question } from "@/lib/questions";
import { KIND_LABEL, isInteractive, sceneAt } from "@/lib/scenes";
import { useSummary } from "@/lib/useSummary";
import type { Summary } from "@/lib/transport";
import { PHASE_LABEL } from "@/lib/state";
import { useLive } from "@/lib/useLive";
import { asset, useRoom } from "@/lib/room";

const PRESENCE = { role: "screen" as const };

// The explanation after the reveal, boxed and large enough to read from the back of the room.
function Answer({ text }: { text: string }) {
  return (
    <div className="flex flex-col gap-[1vh] rounded-3xl border-2 border-ok bg-night-2 px-[2vw] py-[2vh]">
      <p className="font-display text-[2.6vw] font-extrabold leading-none tracking-wide text-ok">เฉลย</p>
      <div className="text-[1.9vw] font-medium leading-relaxed text-paper">
        <Explanation text={text} />
      </div>
    </div>
  );
}

// The choices on the projector while the room answers, in a fixed order, each with its live count (refreshed every 2 s);
// the correct one stays hidden until the reveal.
function ChoiceList({ question, summary }: { question: Question; summary: Summary | null }) {
  const counts = summary?.counts ?? {};
  // Bars are scaled to the most-picked choice, so differences show even with few answers.
  const most = Math.max(0, ...question.choices.map((c) => counts[c.id] ?? 0));
  return (
    <>
      {question.multi && <p className="text-[1.4vw] font-semibold text-amber">เลือกได้หลายข้อ</p>}
      {/* one choice per row */}
      <ul className="grid grid-cols-1 gap-[1.2vh]">
        {question.choices.map((c) => {
          const n = counts[c.id] ?? 0;
          const pct = most ? Math.round((n / most) * 100) : 0;
          return (
            <li key={c.id} className="relative overflow-hidden rounded-2xl border border-line text-[1.7vw] leading-snug">
              <div className="absolute inset-y-0 left-0 bg-sky/25 transition-[width] duration-500" style={{ width: `${pct}%` }} />
              <div className="relative flex items-baseline justify-between gap-[1vw] px-[1.4vw] py-[1.2vh]">
                <span>{c.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-amber">{n} คน</span>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// Projector view: no controls, only what the room should see.
function ScreenView() {
  const room = useRoom();
  const { state, status, participants, summary, leaderboard } = useLive(room, PRESENCE);
  const base = usePublicBase();
  // The miniature on the control page loads this page with ?preview=1: same picture, no sound.
  const preview = useSearchParams().get("preview") === "1";
  const sceneIndex = state?.sceneIndex ?? 0;
  const question = questionFor(sceneAt(sceneIndex).id);
  const results = useSummary(summary, sceneIndex, state?.phase ?? "idle", !!question && state?.phase !== "idle");

  const top10 = useCallback(() => leaderboard(10), [leaderboard]);
  const board = usePolled(top10, sceneAt(sceneIndex).kind === "leaderboard" || state?.phase === "scores");

  if (status === "missing") return <div className="flex flex-1 items-center justify-center text-2xl text-mist">ไม่พบห้อง {room}</div>;

  const scene = sceneAt(state?.sceneIndex ?? 0);
  const phase = state?.phase ?? "idle";
  const url = joinUrl(base, room);

  // The presenter opened "QR เข้าห้อง": the join QR covers whatever scene is showing until it is closed.
  if (state?.sim?.qr) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-[2.5vh] px-[5vw] py-[4vh]">
        <p className="font-display text-[2.6vw] font-bold">สแกนเพื่อเข้าร่วม</p>
        <Qr value={url} size={560} className="max-h-[66vh] max-w-[66vh] [&_img]:h-full [&_img]:w-full" />
        <p className="text-[1.8vw] text-mist">
          รหัสห้อง <b className="font-mono tracking-[0.2em] text-paper">{room}</b>
          {" · "}เข้าร่วมแล้ว <b className="tabular-nums text-amber">{participants}</b> คน
        </p>
      </main>
    );
  }

  if (scene.kind === "video" && scene.video) {
    return (
      <VideoScene
        key={scene.id}
        src={scene.video}
        playing={state?.sim?.vidPlay !== false}
        seq={state?.sim?.vidSeq ?? 0}
        muted={preview}
      />
    );
  }

  if (scene.kind === "leaderboard" || (question && phase === "scores")) {
    const midway = scene.kind !== "leaderboard";
    return (
      <main className="flex flex-1 flex-col gap-[3vh] px-[7vw] py-[6vh]">
        <p className="text-[1.5vw] font-semibold tracking-wide text-amber">
          {midway ? `คะแนนสะสมหลังข้อ: ${scene.title}` : "สรุปคะแนนจากทุกกิจกรรม"}
        </p>
        <h1 className="font-display text-[4vw] font-bold leading-tight">{midway ? "ผู้นำและคะแนน" : "อันดับคะแนน"}</h1>
        <div className="max-w-[70vw]">
          <LeaderList rows={board} size="xl" />
        </div>
        <p className="text-[1.1vw] text-mist">แสดงเลขที่และชื่อ · ดูคะแนนและอันดับของตัวเองบนมือถือ</p>
      </main>
    );
  }

  // The 3D C-arm model takes over the projector while the presenter shows it.
  if (state?.sim?.m3?.on) return <Model3DStage m3={state.sim.m3} muted={preview} />;

  // The closing summary: each topic in a card with its take-home line, one under another.
  if (scene.kind === "outline" && scene.items && scene.notes) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-[3.5vh] px-[7vw] py-[6vh]">
        <h1 className="font-display text-[4vw] font-bold leading-tight text-amber">{scene.title}</h1>
        <ol className="flex flex-col gap-[1.2vh]">
          {scene.items.map((item, i) => (
            <li key={item} className="flex items-center gap-[1.2vw] rounded-2xl border border-line bg-night-2 px-[1.6vw] py-[1.2vh]">
              <span className="grid aspect-square w-[2.8vw] shrink-0 place-items-center rounded-full bg-amber font-display text-[1.5vw] font-bold text-ink">
                {i + 1}
              </span>
              <span className="flex min-w-0 flex-col gap-[0.3vh]">
                <span className="font-display text-[1.7vw] font-bold leading-snug">{item}</span>
                <span className="text-[1.4vw] leading-snug text-sky">{scene.notes?.[i]}</span>
              </span>
            </li>
          ))}
        </ol>
      </main>
    );
  }

  if (scene.kind === "outline" && scene.items) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-[4vh] px-[8vw] py-[7vh]">
        <h1 className="font-display text-[4vw] font-bold leading-tight">{scene.title}</h1>
        <ol className={`flex flex-col ${scene.notes ? "gap-[1.6vh]" : "gap-[2.2vh]"}`}>
          {scene.items.map((item, i) => (
            <li key={item} className="flex items-baseline gap-[1.4vw] text-[2.4vw] leading-snug">
              <span className="w-[2.6vw] shrink-0 text-right font-display font-bold tabular-nums text-amber">{i + 1}</span>
              <span className="flex min-w-0 flex-col">
                <span className={scene.notes ? "font-semibold" : ""}>{item}</span>
                {scene.notes?.[i] && <span className="text-[1.6vw] leading-snug text-sky">{scene.notes[i]}</span>}
              </span>
            </li>
          ))}
        </ol>
      </main>
    );
  }

  if (scene.kind === "cover") {
    return (
      <main className="relative flex-1 overflow-hidden bg-night">
        <img
          src={asset("/cover.webp")}
          alt="การสัมมนา ความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด แลกเปลี่ยนความรู้เรื่องรังสีที่ใช้ในห้องผ่าตัดกับการป้องกันรังสี"
          className="absolute inset-0 h-full w-full object-contain"
        />
      </main>
    );
  }

  if (scene.kind === "join") {
    return (
      <main className="flex flex-1 items-center gap-[3vw] px-[5vw] py-[5vh]">
        <div className="flex min-w-0 flex-1 flex-col gap-[2.5vh]">
          <img
            src={asset("/cover.webp")}
            alt="การสัมมนา ความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด"
            className="max-h-[58vh] w-full rounded-2xl object-cover"
          />
          <h1 className="whitespace-nowrap font-display text-[2.6vw] font-bold leading-tight">{scene.title}</h1>
          <ol className="list-decimal pl-[2vw] text-[1.5vw] leading-relaxed text-mist">
            <li>สแกน QR ด้วยกล้องมือถือ</li>
            <li>ตั้งเลขที่ ชื่อจริง</li>
            <li>เปิดหน้าจอค้างไว้ หน้าจอจะเปลี่ยนตามผู้บรรยาย</li>
          </ol>
          <p className="text-[1.8vw]">
            เข้าร่วมแล้ว <b className="tabular-nums text-amber">{participants}</b> คน
          </p>
        </div>
        <div className="flex flex-col items-center gap-[2vh]">
          <Qr value={url} size={420} className="max-h-[60vh] max-w-[34vw] [&_img]:h-full [&_img]:w-full" />
          <p className="text-[1.6vw] text-mist">
            รหัสห้อง <b className="font-mono tracking-[0.2em] text-paper">{room}</b>
          </p>
          <p className="text-[1vw] text-mist">{url}</p>
        </div>
      </main>
    );
  }

  // Closing slide: a QR to the self-guided 3D model, which stays open after the seminar.
  if (scene.kind === "end") {
    const simUrl = `${base}/simulator`;
    return (
      <main className="flex flex-1 items-center gap-[4vw] px-[6vw] py-[6vh]">
        <div className="flex min-w-0 flex-1 flex-col gap-[3vh]">
          <h1 className="font-display text-[4.2vw] font-bold leading-tight">{scene.title}</h1>
          <p className="text-[2.2vw] leading-snug">
            ทบทวนต่อที่บ้านด้วย <b className="text-amber">C-Arm สามมิติ</b>
          </p>
          <p className="text-[1.6vw] leading-relaxed text-mist">
            ฉายรังสี กลับด้านหลอด เปลี่ยนท่า AP/LAT และดูหน้าที่ของแต่ละส่วนได้เอง ไม่ต้องใช้รหัสห้อง เข้าได้ทุกเวลาแม้จบสัมมนาแล้ว
          </p>
          <p className="break-all text-[1.4vw] text-sky">{simUrl}</p>
        </div>
        <div className="flex flex-col items-center gap-[2vh]">
          <Qr value={simUrl} size={420} label="QR เข้าเล่น C-Arm สามมิติ" className="max-h-[60vh] max-w-[34vw] [&_img]:h-full [&_img]:w-full" />
          <p className="text-[1.6vw] text-mist">สแกนเพื่อเข้าเล่น</p>
        </div>
      </main>
    );
  }

  // Lecture pages: the presenter's "next" moves pg.n; it only counts while pg.s is this scene.
  const pages = pagesFor(scene.id);
  const pg = state?.sim?.pg;
  const pageN = pg && pg.s === sceneIndex ? Math.min(pg.n, Math.max(pages.length - 1, 0)) : 0;
  // A lecture page carries its own title (its heading), so the slide's title is left off. A topic page stands
  // alone in the middle; the others start 15% down the screen.
  const lecture = !question && !isInteractive(scene.kind) && pages.length > 0;
  const top = lecture && !isTopic(pages[pageN]);

  return (
    <main
      className={`relative flex min-h-0 flex-1 flex-col gap-[3vh] px-[7vw] ${top ? "justify-start pt-[15vh] pb-[6vh]" : question && phase === "revealed" ? "justify-center py-[5vh]" : "justify-center py-[8vh]"}`}
    >
      {
        <>
          {question ? (
            // a question's title says it is one, and stays on one line
            <OneLine size={4.2} className="font-display font-bold leading-tight">
              คำถาม: {question.promptAsTitle ? question.prompt : scene.title}
            </OneLine>
          ) : (
            !lecture && <h1 className="font-display text-[4.2vw] font-bold leading-tight">{scene.title}</h1>
          )}
          {question ? (
            <div className={`mt-[1vh] flex flex-col gap-[2vh] ${question.map || phase === "revealed" ? "max-w-[86vw]" : "max-w-[70vw]"}`}>
              {/* a prompt that only repeats the slide title is not shown twice */}
              {!question.promptAsTitle && question.prompt.trim() !== scene.title.trim() && <p className="text-[2.2vw] leading-snug">{question.prompt}</p>}
              {question.map ? (
                <div className="flex items-start gap-[2.5vw]">
                  {/* sized by height so the whole room fits on the projector */}
                  <ORMap
                    geometry={question.map}
                    reveal={phase === "revealed"}
                    correct={question.correct}
                    counts={phase === "revealed" ? results?.counts : null}
                    className="shrink-0"
                    style={{ width: "min(54vh, 45vw)" }}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-[2vh]">
                    {phase === "revealed" ? (
                      <Answer text={question.explanation} />
                    ) : (
                      <>
                        <ChoiceList question={question} summary={results} />
                        <p className="w-fit rounded-2xl bg-amber px-[1.6vw] py-[1vh] text-[1.6vw] font-semibold text-ink">
                          {phase === "idle" ? "เตรียมตอบบนมือถือ" : PHASE_LABEL[phase]}
                          {phase !== "idle" && ` · ตอบแล้ว ${results?.respondents ?? 0} คน`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              ) : phase === "revealed" ? (
                // bars and the answer side by side, so eight choices and the answer fit one screen
                <div className="flex items-start gap-[3vw]">
                  <div className="min-w-0 flex-1">
                    <ResultBars question={question} summary={results} showCorrect size="xl" />
                  </div>
                  <div className="w-[36%] shrink-0">
                    <Answer text={question.explanation} />
                  </div>
                </div>
              ) : (
                <>
                  <ChoiceList question={question} summary={results} />
                  <p className="w-fit rounded-2xl bg-amber px-[1.6vw] py-[1vh] text-[1.6vw] font-semibold text-ink">
                    {phase === "idle" ? "เตรียมตอบบนมือถือ" : PHASE_LABEL[phase]}
                    {phase !== "idle" && ` · ตอบแล้ว ${results?.respondents ?? 0} คน`}
                  </p>
                </>
              )}
            </div>
          ) : isInteractive(scene.kind) ? (
            <div className="mt-[2vh] flex max-w-[60vw] flex-col gap-[1vh] rounded-3xl bg-amber p-[2.5vw] text-ink">
              <p className="text-[1.3vw] font-semibold tracking-wide">กิจกรรมบนมือถือ · {KIND_LABEL[scene.kind]}</p>
              <p className="text-[2vw] leading-snug">{scene.activity}</p>
              <p className="text-[1.4vw] font-semibold">{PHASE_LABEL[phase]}</p>
            </div>
          ) : pages.length > 0 ? (
            <LecturePage page={pages[pageN]} lite={preview} />
          ) : null}
        </>
      }
      {status === "offline" && <p className="absolute left-[3vw] top-[3vh] text-[1vw] text-warn">หลุดการเชื่อมต่อ กำลังลองใหม่</p>}
    </main>
  );
}

// useSearchParams needs a Suspense boundary to build as a static page.
export default function ScreenPage() {
  return (
    <>
      <Suspense>
        <ScreenView />
      </Suspense>
      <SoundHint />
    </>
  );
}
