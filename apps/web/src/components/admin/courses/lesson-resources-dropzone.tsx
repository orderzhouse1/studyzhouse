"use client";

import { FileUp, Loader2, Paperclip, X } from "lucide-react";
import { useRef, useState } from "react";

import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

const MAX_FILES = 10;
const MAX_BYTES = 8 * 1024 * 1024;

const ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,application/pdf,application/zip";

function parseLinks(value: string): string[] {
  return value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

function linkLabel(url: string): string {
  try {
    const name = decodeURIComponent(url.split("/").pop() ?? "ملف");
    return name.length > 36 ? `${name.slice(0, 33)}…` : name;
  } catch {
    return "ملف مرفق";
  }
}

function isImageUrl(url: string): boolean {
  return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("تعذّر قراءة الملف."));
    };
    reader.onerror = () => reject(new Error("تعذّر قراءة الملف."));
    reader.readAsDataURL(file);
  });
}

function isAllowedFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return file.type === "application/pdf" || file.type === "application/zip";
}

export function LessonResourcesDropzone({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (links: string) => void;
  disabled?: boolean;
}): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const links = parseLinks(value);

  async function uploadOne(file: File, current: string[]): Promise<string[]> {
    const dataUrl = await fileToDataUrl(file);
    const json = await adminFetchJson<{
      success: true;
      data: { url: string; fileName: string | null };
    }>("/admin/uploads/lesson-resource", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileBase64: dataUrl,
        fileName: file.name,
      }),
    });
    return [...current, json.data.url];
  }

  async function handleFiles(fileList: FileList | null): Promise<void> {
    if (!fileList?.length || disabled || uploading) return;

    setError(null);
    const files = Array.from(fileList);
    const room = MAX_FILES - links.length;
    if (room <= 0) {
      setError(`الحد الأقصى ${MAX_FILES} ملفات لكل درس.`);
      return;
    }

    const batch = files.slice(0, room);
    if (files.length > room) {
      setError(`تم أخذ أول ${room} ملفات فقط (الحد ${MAX_FILES}).`);
    }

    for (const file of batch) {
      if (!isAllowedFile(file)) {
        setError("نوع غير مدعوم. الصور أو PDF أو ZIP فقط.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("حجم ملف كبير (الحد 8 ميجابايت لكل ملف).");
        return;
      }
    }

    setUploading(true);
    try {
      let next = [...links];
      for (const file of batch) {
        next = await uploadOne(file, next);
      }
      onChange(next.join("\n"));
    } catch (e) {
      setError(
        e instanceof AdminApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "تعذّر رفع الملف.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removeLink(url: string): void {
    onChange(links.filter((l) => l !== url).join("\n"));
  }

  return (
    <div className="space-y-1.5">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        onClick={() => {
          if (!disabled && !uploading) fileInputRef.current?.click();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled && !uploading) fileInputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled || uploading}
        className={cn(
          "flex min-h-[3.25rem] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-md border-2 border-dashed px-2 py-2 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/80 bg-muted/15 hover:border-primary/35 hover:bg-muted/30",
          (disabled || uploading) && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => void handleFiles(e.target.files)}
        />
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        ) : (
          <>
            <FileUp className="h-4 w-4 text-muted-foreground" aria-hidden />
            <p className="text-[0.625rem] leading-snug text-muted-foreground">
              اسحب الملفات أو انقر للاختيار
            </p>
          </>
        )}
      </div>

      {links.length > 0 ? (
        <ul className="space-y-1">
          {links.map((url) => (
            <li
              key={url}
              className="flex items-center gap-1.5 rounded-md border border-border/50 bg-muted/10 px-2 py-1"
            >
              {isImageUrl(url) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  className="h-7 w-10 shrink-0 rounded object-cover"
                />
              ) : (
                <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-[0.625rem] text-primary hover:underline"
                dir="ltr"
                onClick={(e) => e.stopPropagation()}
              >
                {linkLabel(url)}
              </a>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  removeLink(url);
                }}
                aria-label="حذف الملف"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {error ? (
        <p className="text-[0.625rem] text-destructive">{error}</p>
      ) : (
        <p className="text-[0.625rem] text-muted-foreground">
          صور · PDF · ZIP — حتى 8 ميجابايت — {links.length}/{MAX_FILES}
        </p>
      )}
    </div>
  );
}
