import type { LiveStatus } from "@/lib/useLive";

const LABEL: Record<LiveStatus, string> = {
  connecting: "กำลังเชื่อมต่อ",
  live: "เชื่อมต่อแล้ว",
  offline: "หลุดการเชื่อมต่อ กำลังลองใหม่",
  missing: "ไม่พบห้องนี้",
};
const DOT: Record<LiveStatus, string> = {
  connecting: "bg-mist",
  live: "bg-ok",
  offline: "bg-warn animate-pulse",
  missing: "bg-warn",
};

export function StatusPill({ status, mode }: { status: LiveStatus; mode?: "supabase" | "local" }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 text-sm text-mist">
      <span className={`h-2.5 w-2.5 rounded-full ${DOT[status]}`} aria-hidden />
      {LABEL[status]}
      {mode === "local" && <span className="text-amber">· โหมดทดลองในเครื่องเดียว</span>}
    </span>
  );
}
