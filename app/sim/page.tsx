import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "C-Arm สามมิติ · ทดลองใช้เอง",
  description: "แบบจำลองสามมิติของเครื่อง C-Arm ทดลองฉายรังสี กลับด้านหลอด เปลี่ยนท่า AP/LAT และดูหน้าที่ของแต่ละส่วนได้เอง ไม่ต้องใช้รหัสห้อง",
};

// Self-guided 3D model for anyone, during or after the seminar: no room code, every control in the viewer's hands.
// The model is a plain page (public/carm-sim.html, a copy of the presenter's carm-3d.html); the frame fills the screen.
export default function SimPage() {
  return (
    <iframe
      src={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/carm-sim.html?v=${process.env.MODEL_BUILD}`}
      title="แบบจำลองสามมิติของเครื่อง C-Arm"
      allow="fullscreen"
      allowFullScreen
      className="fixed inset-0 h-dvh w-full border-0"
    />
  );
}
