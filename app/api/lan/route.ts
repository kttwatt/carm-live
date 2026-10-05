import os from "node:os";

/**
 * The address phones on the same Wi-Fi can use to reach this computer, read fresh on every request,
 * so moving to another network needs no settings change.
 * Skips loopback, link-local (169.254.x), VirtualBox host-only (192.168.56.x) and Tailscale/CGNAT (100.64–127.x).
 */
function lanAddress(): string | null {
  const candidates: Array<{ name: string; address: string }> = [];
  for (const [name, list] of Object.entries(os.networkInterfaces())) {
    for (const a of list ?? []) {
      if (a.family !== "IPv4" || a.internal) continue;
      const [p, q] = a.address.split(".").map(Number);
      if (p === 169 && q === 254) continue;
      if (a.address.startsWith("192.168.56.")) continue;
      if (p === 100 && q >= 64 && q <= 127) continue;
      const isPrivate = p === 10 || (p === 172 && q >= 16 && q <= 31) || (p === 192 && q === 168);
      if (isPrivate) candidates.push({ name, address: a.address });
    }
  }
  // Prefer the wireless adapter, since phones join over Wi-Fi.
  const wifi = candidates.find((c) => /wi-?fi|wlan|wireless|en0/i.test(c.name));
  return (wifi ?? candidates[0])?.address ?? null;
}

export async function GET(request: Request) {
  const port = new URL(request.url).port || "3000";
  const ip = lanAddress();
  return Response.json({ base: ip ? `http://${ip}:${port}` : null });
}
