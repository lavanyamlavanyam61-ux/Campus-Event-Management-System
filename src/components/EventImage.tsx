import { useState } from 'react';
import { CalendarDays } from 'lucide-react';

interface EventImageProps {
  src: string;
  alt: string;
  category?: string;
  className?: string;
}

export function normalizeAssetPath(src: string): string {
  if (!src) return src;
  if (src.startsWith('/src/assets/')) {
    return `.${src}`;
  }
  return src;
}

export function EventImage({ src, alt, category, className = '' }: EventImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = normalizeAssetPath(src);

  if (!resolvedSrc || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 text-slate-500 border-b border-slate-200 ${className}`}
        role="img"
        aria-label={alt}
      >
        <CalendarDays className="w-7 h-7 text-slate-400 mb-1.5" strokeWidth={1.5} />
        <span className="text-xs font-medium text-slate-600 px-4 text-center truncate max-w-full">
          {category || 'Campus Event'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={`object-cover w-full h-full ${className}`}
    />
  );
}
