export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("8")) digits = "7" + digits.slice(1);
  if (digits && !digits.startsWith("7")) digits = "7" + digits;
  digits = digits.slice(0, 11);

  const rest = digits.slice(1);
  if (!rest) return digits ? "+7" : "";
  let out = "+7";
  out += " (" + rest.slice(0, 3);
  if (rest.length >= 3) out += ")";
  if (rest.length > 3) out += " " + rest.slice(3, 6);
  if (rest.length > 6) out += "-" + rest.slice(6, 8);
  if (rest.length > 8) out += "-" + rest.slice(8, 10);
  return out;
}

export function isValidPhone(value: string): boolean {
  return value.replace(/\D/g, "").length === 11;
}

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email);
}

export const PASSWORD_MIN = 8;

export function passwordIssues(value: string): string[] {
  const issues: string[] = [];
  if (value.length < PASSWORD_MIN) issues.push(`не меньше ${PASSWORD_MIN} символов`);
  if (!/[a-zа-яё]/.test(value)) issues.push("строчную букву");
  if (!/[A-ZА-ЯЁ]/.test(value)) issues.push("заглавную букву");
  if (!/\d/.test(value)) issues.push("цифру");
  if (!/[^A-Za-zА-Яа-яЁё0-9\s]/.test(value)) issues.push("специальный символ");
  return issues;
}

export function isValidPassword(value: string): boolean {
  return passwordIssues(value).length === 0;
}
