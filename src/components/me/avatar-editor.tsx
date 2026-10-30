"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { setAvatar } from "@/lib/actions/profile";

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const OUT = 256;

/**
 * Crop to a centred square, resize to 256 px and re-encode as WebP in the browser.
 * Re-encoding strips EXIF (including GPS) and keeps uploads well under the 2 MB bucket limit.
 */
async function toSquareWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = OUT;
  canvas.height = OUT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, OUT, OUT);
  bitmap.close();
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/webp", 0.86));
}

export function AvatarEditor({ userId, name, url, hasGoogle }: { userId: string; name: string; url: string | null; hasGoogle: boolean }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [current, setCurrent] = useState(url);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string; data?: string | null }>, success: string) {
    setMsg(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) return setMsg({ ok: false, text: res.error ?? "Something went wrong." });
      setCurrent(res.data ?? null);
      setMsg({ ok: true, text: success });
      router.refresh();
    });
  }

  async function upload(file: File) {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return setMsg({ ok: false, text: "Please choose a JPG, PNG or WebP photo." });
    if (file.size > MAX_INPUT_BYTES) return setMsg({ ok: false, text: "That photo is over 10 MB. Please pick a smaller one." });
    run(async () => {
      try {
        const blob = await toSquareWebp(file);
        // Loaded on demand so the Supabase client isn't in the settings page bundle.
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const path = `${userId}/${Date.now()}.webp`;
        const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
        if (error) return { ok: false, error: "Upload failed. Please try again." };
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        const res = await setAvatar({ source: "upload", url: data.publicUrl });
        // Tidy up older uploads; the new one is already saved, so failures here are harmless.
        const { data: files } = await supabase.storage.from("avatars").list(userId);
        const old = (files ?? []).map((f) => `${userId}/${f.name}`).filter((p) => p !== path);
        if (old.length) await supabase.storage.from("avatars").remove(old);
        return res.ok ? { ok: true, data: res.data } : { ok: false, error: res.error };
      } catch {
        return { ok: false, error: "We couldn't read that photo. Try a different one." };
      }
    }, "Photo updated.");
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar name={name} url={current} size={88} />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-secondary btn-sm" disabled={pending} onClick={() => input.current?.click()}>
            <Camera className="h-4 w-4" /> {pending ? "Saving…" : current ? "Change photo" : "Upload photo"}
          </button>
          {hasGoogle && (
            <button type="button" className="btn-ghost btn-sm" disabled={pending} onClick={() => run(() => setAvatar({ source: "google" }), "Using your Google photo.")}>
              Use Google photo
            </button>
          )}
          {current && (
            <button type="button" className="btn-ghost btn-sm text-danger hover:bg-danger/5" disabled={pending} onClick={() => run(() => setAvatar({ source: "none" }), "Photo removed.")}>
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
        <p className="text-xs text-ink-muted">Square photos work best. We resize it and remove location data.</p>
        {msg && <p role={msg.ok ? "status" : "alert"} className={`text-sm ${msg.ok ? "text-success" : "text-danger"}`}>{msg.text}</p>}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Choose a profile photo"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) upload(f);
        }}
      />
    </div>
  );
}
