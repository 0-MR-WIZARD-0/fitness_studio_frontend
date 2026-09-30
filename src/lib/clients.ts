import { api } from "./api";

export type Sex = "FEMALE" | "MALE";
export type BodyType = "ASTHENIC" | "NORMOSTHENIC" | "HYPERSTHENIC";
export type ZoneLevel = "low" | "norm" | "warn" | "high";

export interface Zone {
  level: ZoneLevel;
  label: string;
}

export interface GirthField {
  key: GirthKey;
  label: string;
  howTo: string;
  norm: string;
}

export interface BioField {
  key: BioKey;
  label: string;
  unit: string;
  norm: string;
}

export type GirthKey =
  "chestCm" | "waistCm" | "hipsCm" | "armCm" | "thighCm" | "calfCm";

export type BioKey =
  | "weightKg"
  | "fatPct"
  | "muscleKg"
  | "visceralFat"
  | "waterPct"
  | "boneKg"
  | "metabolicAge"
  | "bmr";

export type NumericKey = GirthKey | BioKey;

export interface FunctionalTest {
  id: number;
  name: string;
  measures: string;
  howTo: string;
  norm: string;
  unit: string;
  order: number;
  isActive: boolean;
}

export interface ZoneTables {
  whr: {
    title: string;
    rows: { label: string; female: string; male: string }[];
  };
  whtr: { title: string; rows: { label: string; value: string }[] };
  bmi: { title: string; rows: { label: string; value: string }[] };
}

export interface Protocol {
  girths: GirthField[];
  bio: BioField[];
  bodyTypes: { value: BodyType; label: string }[];
  zones: ZoneTables;
  tests: FunctionalTest[];
}

export interface Ratio {
  value: number;
  zone: Zone;
}

export interface Derived {
  age: number | null;
  bmi: Ratio | null;
  whr: Ratio | null;
  whtr: Ratio | null;
  ideal: {
    broca: number | null;
    lorentz: number | null;
    bmiRef: number | null;
    average: number | null;
  };
  fat: Zone | null;
  water: Zone | null;
  visceral: Zone | null;
}

export interface TestResult {
  id: number;
  testId: number;
  value: string;
  passed: boolean | null;
}

export type MeasurementNumbers = Record<NumericKey, number | null>;

export interface Measurement extends MeasurementNumbers {
  id: number;
  takenAt: string;
  strengths: string;
  risks: string;
  trainingAdvice: string;
  nutritionAdvice: string;
  nextCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: number | null;
  author: string | null;
  editor: string | null;
  derived: Derived;
  delta: Partial<Record<NumericKey, number>>;
  prevAt: string | null;
  tests: TestResult[];
}

export interface ClientCard {
  id: number;
  sex: Sex | null;
  birthDate: string | null;
  heightCm: number | null;
  bodyType: BodyType | null;
  note: string;
  updatedAt: string;
  updatedBy: string | null;
}

export interface ClientCardData {
  user: { id: number; name: string; email: string; phone: string };
  card: ClientCard | null;
  measurements: Measurement[];
}

export interface ClientRow {
  id: number;
  name: string;
  phone: string;
  email: string;
  hasCard: boolean;
  measurements: number;
  lastAt: string | null;
}

export interface CardDraft {
  sex: Sex | null;
  birthDate: string | null;
  heightCm: number | null;
  bodyType: BodyType | null;
  note: string;
}

export interface MeasurementDraft extends Partial<MeasurementNumbers> {
  takenAt?: string;
  strengths?: string;
  risks?: string;
  trainingAdvice?: string;
  nutritionAdvice?: string;
  nextCheckAt?: string | null;
  tests?: { testId: number; value: string; passed: boolean | null }[];
}

const auth = (
  method: string,
  body?: unknown,
): RequestInit & { auth: boolean } => ({
  method,
  auth: true,
  body: body !== undefined ? JSON.stringify(body) : undefined,
});

export const getProtocol = () => api<Protocol>("/clients/protocol");

export const listClients = (q = "") =>
  api<ClientRow[]>(
    `/clients/admin${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`,
    { auth: true },
  );

export const getClientCard = (userId: number) =>
  api<ClientCardData>(`/clients/admin/${userId}`, { auth: true });

export const saveClientCard = (userId: number, draft: CardDraft) =>
  api<ClientCardData>(`/clients/admin/${userId}/card`, auth("PUT", draft));

export const addMeasurement = (userId: number, draft: MeasurementDraft) =>
  api<ClientCardData>(
    `/clients/admin/${userId}/measurements`,
    auth("POST", draft),
  );

export const updateMeasurement = (id: number, draft: MeasurementDraft) =>
  api<ClientCardData>(`/clients/measurements/${id}`, auth("PUT", draft));

export const deleteMeasurement = (id: number) =>
  api<ClientCardData>(`/clients/measurements/${id}`, auth("DELETE"));

export const listFunctionalTests = () =>
  api<FunctionalTest[]>("/clients/tests", { auth: true });

export const createFunctionalTest = (draft: Partial<FunctionalTest>) =>
  api<FunctionalTest>("/clients/tests", auth("POST", draft));

export const updateFunctionalTest = (
  id: number,
  draft: Partial<FunctionalTest>,
) => api<FunctionalTest>(`/clients/tests/${id}`, auth("PUT", draft));

export const deleteFunctionalTest = (id: number) =>
  api<{ ok: boolean; hidden: boolean; message?: string }>(
    `/clients/tests/${id}`,
    auth("DELETE"),
  );

export const myCard = () => api<ClientCardData>("/clients/me", { auth: true });

export const SEX_LABEL: Record<Sex, string> = {
  FEMALE: "Женский",
  MALE: "Мужской",
};

export const ZONE_CLASS: Record<ZoneLevel, string> = {
  low: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  norm: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  warn: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  high: "border-red-400/40 bg-red-400/10 text-red-300",
};
