import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/authz";
import { readLocalFile } from "@/lib/storage";

export const runtime = "nodejs";

// Serves locally-stored blobs (dev fallback). In production with Vercel Blob,
// document URLs point directly at the blob store and don't hit this route.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { name } = await params;
  try {
    const buf = await readLocalFile(decodeURIComponent(name));
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${decodeURIComponent(name).replace(/^\d+-/, "")}"`,
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
