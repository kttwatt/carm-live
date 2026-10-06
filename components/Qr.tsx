"use client";

import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { BASE_PATH, roomHref } from "@/lib/room";
import { CarmMark } from "@/components/CarmMark";

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

/**
 * A QR code for `value`. `carm` puts a small C-arm drawing in the middle; the code is then made at the highest error
 * correction (it still reads with about 30% of it covered; the drawing covers under 8%).
 */
export function Qr({
  value,
  size,
  className,
  label = "QR สำหรับเข้าร่วม",
  carm,
}: {
  value: string;
  size: number;
  className?: string;
  label?: string;
  carm?: boolean;
}) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(value, {
      margin: 1,
      width: size * 2,
      errorCorrectionLevel: carm ? "H" : "M",
      color: { dark: "#0e1a2b", light: "#f3f6f8" },
    })
      .then((url) => alive && setSrc(url))
      .catch(() => alive && setSrc(null));
    return () => {
      alive = false;
    };
  }, [value, size, carm]);
  return (
    <div className={`rounded-2xl bg-white p-3 ${className ?? ""}`} style={{ width: size + 24, height: size + 24 }}>
      {src && (
        <div className="relative h-full w-full">
          <img src={src} alt={label} width={size} height={size} />
          {carm && (
            <div className="absolute left-1/2 top-1/2 grid h-[26%] w-[26%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[16%] border-[3px] border-[#0b1f45] bg-white p-[3%]">
              <CarmMark className="h-full w-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
