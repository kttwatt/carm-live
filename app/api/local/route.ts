import { handle } from "@/lib/localRooms";

/** Rehearsal rooms shared by every device on the same Wi-Fi (see lib/localRooms.ts). */
export async function POST(request: Request) {
  try {
    return Response.json({ data: handle(await request.json()) ?? null });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 400 });
  }
}
