"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { uploadDocument } from "@/actions/documents";

export function UploadDocument({ studyId, stageIndex }: { studyId: string; stageIndex: number }) {
  const ref = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string>("");
  const [pending, start] = useTransition();

  return (
    <form
      action={(fd) => start(() => uploadDocument(fd).then(() => setName("")))}
      className="flex items-center gap-2"
    >
      <input type="hidden" name="studyId" value={studyId} />
      <input type="hidden" name="stageIndex" value={stageIndex} />
      <input
        ref={ref}
        type="file"
        name="file"
        className="hidden"
        onChange={(e) => setName(e.target.files?.[0]?.name ?? "")}
      />
      <button type="button" className="btn-secondary text-meta" onClick={() => ref.current?.click()}>
        <Upload size={15} /> {name || "Choose file"}
      </button>
      <button type="submit" className="btn-primary text-meta" disabled={!name || pending}>
        {pending ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}
