export function isPublished(status?: string): boolean {
  return status === "published";
}

export function visibleSorted<T extends { visible?: boolean; order?: number }>(list: T[]): T[] {
  return [...(list || [])]
    .filter((i) => i.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
