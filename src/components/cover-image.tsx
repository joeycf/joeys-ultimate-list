import Image from "next/image";
import { PlaceholderImage } from "@/components/placeholder-image";
import { cn } from "@/lib/utils";

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

function isOurBlob(url: string): boolean {
  try {
    return BLOB_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Public image renderer. Our Blob uploads are optimized via next/image; any
 * other (pasted external) URL is rendered `unoptimized` so we don't run an
 * open image-optimization proxy (and don't need a remote pattern). No URL →
 * the striped Arcade placeholder. `className` is the sized container.
 */
export function CoverImage({
  url,
  alt = "",
  accent,
  className,
  sizes = "(max-width: 768px) 100vw, 400px",
}: {
  url?: string | null;
  alt?: string;
  accent?: "emerald" | "violet" | "gold" | "muted";
  className?: string;
  sizes?: string;
}) {
  if (!url) return <PlaceholderImage accent={accent} className={className} />;

  return (
    <div className={cn("relative overflow-hidden bg-secondary", className)}>
      <Image
        src={url}
        alt={alt}
        fill
        unoptimized={!isOurBlob(url)}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
