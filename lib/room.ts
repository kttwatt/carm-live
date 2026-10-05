"use client";

import { useSearchParams } from "next/navigation";
import { normalizeRoom } from "@/lib/state";

/** Sub-path the site is served under (e.g. "/carm-live" on GitHub Pages), empty when run locally. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix for files in public/, which next/link and the router don't rewrite. */
export const asset = (path: string) => `${BASE_PATH}${path}`;

/** Room pages are plain files (static hosting), so the room code travels as ?r=. */
export const roomHref = (page: "join" | "control" | "screen" | "summary", room: string) => `/${page}?r=${room}`;

export const useRoom = () => normalizeRoom(useSearchParams().get("r") ?? "");
