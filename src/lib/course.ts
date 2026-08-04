const MS_DAY = 86400000;
const WINDOW = 7 * MS_DAY;

export interface CourseSummary<T> {
  groups: T[][];
  countedIds: Set<number>;
}

export function courseGroups<T extends { id: number; startsAt: string | Date }>(
  slots: T[],
  threshold: number,
): CourseSummary<T> {
  const sorted = [...slots].sort(
    (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
  );
  const groups: T[][] = [];
  const countedIds = new Set<number>();

  if (threshold < 1) return { groups, countedIds };

  let i = 0;
  while (i + threshold - 1 < sorted.length) {
    const first = +new Date(sorted[i].startsAt);
    const last = +new Date(sorted[i + threshold - 1].startsAt);
    if (last - first <= WINDOW) {
      const group = sorted.slice(i, i + threshold);
      groups.push(group);
      for (const s of group) countedIds.add(s.id);
      i += threshold;
    } else {
      i += 1;
    }
  }

  return { groups, countedIds };
}
