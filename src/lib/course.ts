const MS_DAY = 86400000;
const WINDOW = 6 * MS_DAY;

export function courseIds<T extends { id: number; startsAt: string | Date }>(
  slots: T[],
  threshold: number,
): Set<number> {
  const sorted = [...slots].sort(
    (a, b) => +new Date(a.startsAt) - +new Date(b.startsAt),
  );
  const ids = new Set<number>();
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (
      j + 1 < sorted.length &&
      +new Date(sorted[j + 1].startsAt) - +new Date(sorted[i].startsAt) <=
        WINDOW
    ) {
      j += 1;
    }
    if (j - i + 1 >= threshold) {
      for (let k = i; k <= j; k += 1) ids.add(sorted[k].id);
      i = j + 1;
    } else {
      i += 1;
    }
  }
  return ids;
}
