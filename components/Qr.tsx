"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { BASE_PATH, roomHref } from "@/lib/room";

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]"];

/**
 * The address other devices should use for links and QR codes.
 * 1. NEXT_PUBLIC_SITE_URL when set (the deployed domain);
 * 2. otherwise the address this page was opened with, unless that is localhost;
 * 3. on localhost, this computer's current Wi-Fi address from /api/lan, re-checked every 30 s
 *    so a change of network is picked up without restarting anything.
 */
export function usePublicBase() {
  const fixed = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const [base, setBase] = useState(fixed ?? "");
  useEffect(() => {
    if (fixed) return;
    setBase(window.location.origin + BASE_PATH);
    if (!LOCAL_HOSTS.includes(window.location.hostname)) return;
    let alive = true;
    const load = () =>
      fetch("/api/lan", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { base: string | null }) => alive && d.base && setBase(d.base))
        .catch(() => {});
    load();
    const t = window.setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [fixed]);
  return base;
}

export const joinUrl = (base: string, room: string) => `${base}${roomHref("join", room)}`;

export function Qr({ value, size, className, label = "QR สำหรับเข้าร่วม" }: { value: string; size: number; className?: string; label?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: size * 2, color: { dark: "#0e1a2b", light: "#f3f6f8" } })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size]);
  return (
    <div className={`rounded-2xl bg-white p-3 ${className ?? ""}`} style={{ width: size + 24, height: size + 24 }}>
      {src && <img src={src} alt={label} width={size} height={size} />}
    </div>
  );
}
