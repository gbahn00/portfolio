import { Reveal } from "@/components/motion/Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-12 md:mb-16">
      {eyebrow && (
        <Reveal>
          <p className="accent-text text-sm md:text-base font-medium tracking-wide mb-3">{eyebrow}</p>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="text-3xl md:text-5xl font-bold leading-tight whitespace-pre-line text-korean">{title}</h2>
      </Reveal>
      {description && (
        <Reveal delay={0.1}>
          <p className="text-ink-muted text-base md:text-lg mt-5 max-w-2xl leading-relaxed whitespace-pre-line text-korean">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
