import type { NextConfig } from "next";

// GitHub Pages build (see .github/workflows/pages.yml): plain files under a sub-path, no server.
const pages = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // Phones on the same Wi-Fi open the dev server by this computer's LAN address.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
  ...(pages && {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
