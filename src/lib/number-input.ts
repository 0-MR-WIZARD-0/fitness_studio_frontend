export function onlyDigits(raw: string, integer = false): string {
  const dotted = raw.replace(/,/g, ".");
  if (integer) return dotted.split(".")[0].replace(/\D/g, "");

  const cleaned = dotted.replace(/[^\d.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot === -1) return cleaned;
  return cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "");
}
