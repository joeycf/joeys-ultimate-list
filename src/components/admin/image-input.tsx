"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 4 * 1024 * 1024;

interface ImageInputProps {
  value: string;
  onChange: (url: string) => void;
  uploadAction: (formData: FormData) => Promise<{ url?: string; error?: string }>;
}

/**
 * One field, two sources: paste a URL or upload a file (Vercel Blob). Both
 * write the same URL string into the bound RHF field. `uploadAction` is the
 * server `uploadImage` action, passed from the server page.
 */
export function ImageInput({ value, onChange, uploadAction }: ImageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    // Client-side guard (server re-validates).
    if (!TYPES.includes(file.type)) {
      toast.error("Use a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be 4MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const res = await uploadAction(fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      if (res?.url) {
        onChange(res.url);
        toast.success("Image uploaded.");
      }
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Input
          type="url"
          inputMode="url"
          placeholder="https://…  or upload →"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="shrink-0"
        >
          {uploading ? (
            "Uploading…"
          ) : (
            <>
              <Upload className="size-3.5" /> Upload
            </>
          )}
        </Button>
      </div>

      {value ? (
        <div className="flex items-center gap-3">
          {/* Plain <img> preview (admin-only; public views use CoverImage). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt=""
            className="h-16 w-24 shrink-0 rounded-md border border-border object-cover"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onChange("")}
          >
            <X className="size-3.5" /> Remove
          </Button>
        </div>
      ) : null}
    </div>
  );
}
