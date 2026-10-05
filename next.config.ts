import type { NextConfig } from "next";

// GitHub Pages build (see .github/workflows/pages.yml): plain files under a sub-path, no server.
const pages = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  // Changes every build; the 3D model's frame URL carries it so browsers never reuse a model from an older deploy
  // (GitHub Pages lets them keep public/ files for 10 minutes).
  env: { MODEL_BUILD: (process.env.GITHUB_SHA ?? String(Date.now())).slice(0, 8) },
  // Phones on the same Wi-Fi open the dev server by this computer's LAN address.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "172.*.*.*"],
  ...(pages && {
    output: "export",
    basePath: process.env.NEXT_PUBLIC_BASE_PATH || undefined,
    images: { unoptimized: true },
  }),
};

export default nextConfig;
