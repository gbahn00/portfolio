"use client";

import { Profile } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/Reveal";
import { MediaFrame } from "@/components/ui/MediaFrame";

// §4 Profile & Key Numbers — 현재 역할과 수행 범위를 빠르게 이해시키는 구간.
export function ProfileKeyNumbers({ profile }: { profile: Profile }) {
  const facts = [...profile.keyFacts].sort((a, b) => a.order - b.order);

  return (
    <section className="intro-section bg-bg-soft flex items-center border-t border-line">
      <Container className="w-full py-16 md:py-0">
        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.4fr] gap-10 md:gap-16 items-center">
          <Reveal strength="strong">
            <div className="relative aspect-[4/5] w-full max-w-xs overflow-hidden rounded-sm">
              <MediaFrame media={profile.profilePhoto} className="h-full w-full" />
            </div>
          </Reveal>

          <div>
            <Reveal>
              <p className="accent-text text-sm font-medium mb-4 tracking-wide">PROFILE</p>
            </Reveal>
            <Reveal delay={0.05} strength="strong" holdAfterEnter>
              <p className="statement-title font-medium text-korean mb-8 max-w-2xl">{profile.representativePhrase}</p>
            </Reveal>

            <RevealGroup className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 pt-4 border-t border-line">
              {facts.map((f) => (
                <RevealItem key={f.label}>
                  <p className="text-korean text-sm text-ink-muted mb-1">{f.label}</p>
                  <p className="text-korean text-base md:text-lg text-ink font-medium">{f.value}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </Container>
    </section>
  );
}
