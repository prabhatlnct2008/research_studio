import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// File storage abstraction (FRD §5.4 — files live in blob, only references in
// the DB). Uses Vercel Blob when BLOB_READ_WRITE_TOKEN is set; otherwise falls
// back to local disk so the app runs without provisioning a store.
const LOCAL_DIR = path.join(process.cwd(), ".localblob");
const useVercel = !!process.env.BLOB_READ_WRITE_TOKEN;

export type StoredFile = { ref: string; url: string };

export async function putFile(
  key: string,
  data: Buffer,
  contentType?: string,
): Promise<StoredFile> {
  if (useVercel) {
    const { put } = await import("@vercel/blob");
    const blob = await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return { ref: blob.url, url: blob.url };
  }

  await mkdir(LOCAL_DIR, { recursive: true });
  const safe = `${Date.now()}-${key.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await writeFile(path.join(LOCAL_DIR, safe), data);
  return { ref: `local:${safe}`, url: `/api/blob/${encodeURIComponent(safe)}` };
}

export async function deleteFile(ref: string): Promise<void> {
  if (ref.startsWith("local:")) {
    const name = ref.slice("local:".length);
    await unlink(path.join(LOCAL_DIR, name)).catch(() => {});
    return;
  }
  if (useVercel) {
    const { del } = await import("@vercel/blob");
    await del(ref).catch(() => {});
  }
}

export async function readLocalFile(name: string): Promise<Buffer> {
  return readFile(path.join(LOCAL_DIR, name));
}

export function urlForRef(ref: string): string {
  if (ref.startsWith("local:")) {
    return `/api/blob/${encodeURIComponent(ref.slice("local:".length))}`;
  }
  return ref;
}
