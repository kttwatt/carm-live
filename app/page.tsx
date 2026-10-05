"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSession, liveMode } from "@/lib/transport";
import { normalizeRoom, RoomSchema } from "@/lib/state";
import { roomHref } from "@/lib/room";

export default function Home() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");

  async function create() {
    setBusy(true);
    setError("");
    try {
      const { room, key } = await createSession("ความปลอดภัยทางรังสีของพยาบาลห้องผ่าตัด");
      localStorage.setItem(`carm-presenter-${room}`, key);
      router.push(roomHref("control", room));
    } catch (e) {
      setError(`สร้างห้องไม่สำเร็จ: ${(e as Error).message}`);
      setBusy(false);
    }
  }

  function join(e: React.FormEvent) {
    e.preventDefault();
    const room = normalizeRoom(code);
    if (!RoomSchema.safeParse(room).success) return setError("รหัสห้องคือตัวอักษรและตัวเลข 6 ตัว");
    router.push(roomHref("join", room));
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-10 px-4 py-12">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-widest text-amber">C-ARM RADIATION SAFETY LIVE</p>
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">ห้องกิจกรรมสดสำหรับสัมมนาความปลอดภัยทางรังสี</h1>
        <p className="text-mist">ผู้เข้าร่วมสแกน QR ครั้งเดียว แล้วมือถือจะเปลี่ยนตามวิทยากรตลอด 60 นาที</p>
      </header>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-night-2 p-6">
        <h2 className="font-display text-xl font-bold">สำหรับผู้บรรยาย</h2>
        <p className="text-sm text-mist">ระบบจะสร้างรหัสห้องและลิงก์ควบคุมให้ เก็บลิงก์ควบคุมไว้ ห้ามแชร์ให้ผู้เข้าร่วม</p>
        <button
          onClick={create}
          disabled={busy}
          className="mt-2 w-fit rounded-xl bg-amber px-6 py-3 font-display text-lg font-bold text-ink disabled:opacity-50"
        >
          {busy ? "กำลังสร้างห้อง…" : "สร้างห้องกิจกรรมใหม่"}
        </button>
      </section>

      <form onSubmit={join} className="flex flex-col gap-3 rounded-2xl border border-line p-6">
        <label htmlFor="room" className="font-display text-xl font-bold">
          มีรหัสห้องแล้ว
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="room"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="เช่น K7MP2Q"
            autoCapitalize="characters"
            className="min-w-0 flex-1 rounded-xl border border-line bg-night px-4 py-3 font-mono text-lg uppercase tracking-widest"
          />
          <button className="rounded-xl border border-sky px-6 py-3 font-semibold text-sky">เข้าร่วม</button>
        </div>
      </form>

      {error && <p className="text-warn" role="alert">{error}</p>}
      {liveMode === "local" && (
        <p className="text-sm text-mist">
          ตอนนี้ยังไม่ได้ต่อฐานข้อมูล ระบบทำงานแบบทดลองในเบราว์เซอร์เดียว (เปิดหลายแท็บได้) ใส่ค่า Supabase ในไฟล์ .env.local เพื่อใช้กับมือถือจริง
        </p>
      )}
    </main>
  );
}
