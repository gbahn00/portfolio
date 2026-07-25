import { notFound } from "next/navigation";
import { getContent } from "@/lib/data/repo";
import { Container } from "@/components/ui/Container";
import { MediaFrame } from "@/components/ui/MediaFrame";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCover } from "@/components/sections/ProjectCover";
import { isPlaceholder } from "@/lib/utils";

export const dynamic = "force-dynamic";

// §14.1 Introduction → Problem → Process → Solution → Result 구조에 대응
const BLOCK_TITLE_FALLBACK: Record<string, string> = {
  overview: "프로젝트 소개",
  before: "문제",
  purpose: "제작 목적",
  role: "담당 역할",
  process: "과정",
  decisions: "해결",
  tools: "사용 도구",
  result: "결과",
  impact: "성과 및 의미",
  "future-use": "이후 활용 가능성",
};

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const content = await getContent();
  const project = content.projects.find((p) => p.id === params.id);

  if (!project || !project.publicOk) notFound();

  const blocks = [...project.detailBlocks].filter((b) => b.visible !== false).sort((a, b) => a.order - b.order);

  return (
    <main className="bg-bg min-h-screen">
      <ProjectCover project={project} />

      <Container className="pt-24 md:pt-32 pb-24 md:pb-32">
        <div className="max-w-3xl space-y-16">
          {blocks.map((block) => (
            <Reveal key={block.id}>
              <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-korean">
                {block.title || BLOCK_TITLE_FALLBACK[block.key]}
              </h2>
              {block.body && !isPlaceholder(block.body) && (
                <p className="text-ink-muted leading-relaxed whitespace-pre-line text-korean mb-6">{block.body}</p>
              )}

              {block.images?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  {block.images.map((img, i) => (
                    <MediaFrame key={i} media={img} className="aspect-[4/3] rounded-sm" />
                  ))}
                </div>
              )}

              {block.compareImages?.length > 0 && (
                <div className="space-y-4 mb-6">
                  {block.compareImages.map((pair) => (
                    <div key={pair.id} className="grid grid-cols-2 gap-2">
                      <div>
                        <MediaFrame media={pair.before} className="aspect-[4/3] rounded-sm" />
                        <p className="text-xs text-ink-muted mt-2 text-center">보정 전</p>
                      </div>
                      <div>
                        <MediaFrame media={pair.after} className="aspect-[4/3] rounded-sm" />
                        <p className="text-xs text-ink-muted mt-2 text-center">보정 후</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {block.videos?.length > 0 &&
                block.videos.map((v, i) => (
                  <video key={i} src={v.url} controls poster={v.poster} className="w-full rounded-sm mb-6" />
                ))}

              {block.metrics?.filter((m) => !isPlaceholder(m.value)).length > 0 && (
                <div className="flex flex-wrap gap-6 mb-2">
                  {block.metrics
                    .filter((m) => !isPlaceholder(m.value))
                    .map((m) => (
                      <div key={m.id}>
                        <p className="text-2xl font-bold accent-text">{m.value}</p>
                        <p className="text-xs text-ink-muted">{m.label}</p>
                      </div>
                    ))}
                </div>
              )}
            </Reveal>
          ))}

          {project.gallery?.length > 0 && (
            <Reveal>
              <h2 className="text-xl md:text-2xl font-semibold mb-4">상세 이미지</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {project.gallery.map((img, i) => (
                  <MediaFrame key={i} media={img} className="aspect-square rounded-sm" />
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </Container>
    </main>
  );
}
