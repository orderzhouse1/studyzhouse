"use client";

import { ImagePlus, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdminApiError, adminFetchJson } from "@/lib/courses-client-api";
import { cn } from "@/lib/utils";

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

export function CourseThumbnailDropzone({
  value,
  onChange,
  disabled,
  inputId,
}: {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  inputId?: string;
}): React.ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = localPreview || value || null;

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(localPreview);
      }
    };
  }, [localPreview]);

  const uploadFile = useCallback(
    async (file: File): Promise<void> => {
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("اختر ملف صورة (JPG أو PNG أو WebP).");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("حجم الصورة كبير (الحد 5 ميجابايت).");
        return;
      }

      const blobUrl = URL.createObjectURL(file);
      setLocalPreview(blobUrl);
      setUploading(true);
      try {
        const dataUrl = await fileToDataUrl(file);
        const json = await adminFetchJson<{
          success: true;
          data: { url: string };
        }>("/admin/uploads/course-thumbnail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: dataUrl }),
        });
        onChange(json.data.url);
        setLocalPreview(null);
        URL.revokeObjectURL(blobUrl);
      } catch (e) {
        setLocalPreview(null);
        URL.revokeObjectURL(blobUrl);
        setError(
          e instanceof AdminApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "تعذّر رفع الصورة.",
        );
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  function pickFile(file: File | null): void {
    if (!file || disabled || uploading) return;
    void uploadFile(file);
  }

  function clearImage(e: React.MouseEvent): void {
    e.stopPropagation();
    if (disabled || uploading) return;
    setLocalPreview(null);
    setError(null);
    onChange("");
  }

  return (
    <div className="space-y-1">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !uploading) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pickFile(e.dataTransfer.files[0] ?? null);
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
          "relative flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-2 py-2 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border/80 bg-muted/20 hover:border-primary/35 hover:bg-muted/35",
          (disabled || uploading) && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />

        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
        ) : preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="معاينة غلاف الكورس"
            className="max-h-14 max-w-full rounded object-contain"
          />
        ) : (
          <>
            <ImagePlus className="h-5 w-5 text-muted-foreground" aria-hidden />
            <p className="text-[0.625rem] leading-snug text-muted-foreground">
              اسحب الصورة أو انقر للاختيار
            </p>
          </>
        )}

        {preview && !uploading ? (
          <button
            type="button"
            className="absolute start-1.5 top-1.5 rounded-full bg-card/95 p-0.5 text-muted-foreground shadow-sm hover:text-destructive"
            onClick={clearImage}
            aria-label="إزالة الصورة"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="text-[0.625rem] text-destructive">{error}</p>
      ) : (
        <p className="text-[0.625rem] text-muted-foreground">
          JPG · PNG · WebP — حتى 5 ميجابايت
        </p>
      )}
    </div>
  );
}
