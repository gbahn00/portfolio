import { ClosingSection } from "@/lib/types";
import { optimizedImageSrc } from "@/lib/utils";
import { PrintPage } from "./PrintPage";

export function PrintClosing({ data }: { data: ClosingSection }) {
  const bg = data.backgroundVideo?.poster || data.backgroundImage?.url;
  const links = (data.externalLinks || []).filter((l) => l.label && l.url);
  const year = new Date().getFullYear();

  return (
    <PrintPage center className="relative overflow-hidden">
      {bg && (
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={optimizedImageSrc(bg, 1920)}
            alt=""
            className="h-full w-full object-cover"
            style={{ filter: "brightness(0.45)" }}
          />
        </div>
      )}
      <div className="relative z-10">
        <h1 className="hero-title font-bold text-korean whitespace-pre-line mb-6">{data.message}</h1>
        {data.subline && <p className="text-korean text-ink-secondary body-large max-w-xl mb-6 whitespace-pre-line">{data.subline}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-secondary text-sm mb-8">
          <span className="text-ink font-medium">{data.name}</span>
          <span>{data.department}</span>
          <span>{data.role}</span>
          <span>{data.badge}</span>
        </div>
        {links.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-ink-secondary mb-8">
            {links.map((l) => (
              <span key={l.id}>{l.label}: {l.url}</span>
            ))}
          </div>
        )}
        <p className="font-en text-xs text-ink-muted">© {year} {data.name}</p>
      </div>
    </PrintPage>
  );
}
