import { Achievement } from "@/lib/types";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { CountUp } from "@/components/motion/CountUp";

export function Achievements({ items }: { items: Achievement[] }) {
  const visible = [...items].filter((i) => i.visible !== false).sort((a, b) => a.order - b.order);

  if (visible.length === 0) return null;

  return (
    <section className="section-pad bg-bg">
      <Container>
        <Reveal>
          <p className="accent-text text-sm font-medium mb-4 tracking-wide">주요 성과</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="text-3xl md:text-5xl font-bold mb-16">수치로 보는 업무 범위</h2>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12">
          {visible.map((a, i) => (
            <Reveal key={a.id} delay={(i % 6) * 0.05}>
              <div>
                <p className="text-4xl md:text-6xl font-bold accent-text mb-2 font-en">
                  <CountUp value={a.value} />
                  <span className="text-2xl md:text-3xl ml-1">{a.unit}</span>
                </p>
                <p className="text-sm md:text-base text-ink-muted">{a.name}</p>
                {a.description && <p className="text-xs text-ink-muted/70 mt-1 whitespace-pre-line">{a.description}</p>}
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
