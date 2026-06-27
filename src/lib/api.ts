export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export const API_BASE = `${API_URL}/api`;

export function mediaUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API_URL}${path}`;
}

type FetchOpts = RequestInit & { auth?: boolean };

export async function api<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const { auth, headers, ...rest } = opts;
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: auth ? "include" : rest.credentials,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
  });
  if (!res.ok) {
    let message = `Ошибка ${res.status}`;
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body?.message)
        message = Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message;
    } catch {
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export interface Sphere {
  label: string;
  items: string[];
}
export interface HomeHero {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string | null;
  spheres: Sphere[];
}
export interface HomeFaq {
  id: number;
  question: string;
  answer: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
}
export interface HomeStep {
  id: number;
  label: string;
  title: string;
  description: string;
  imageUrl: string | null;
  order: number;
  isActive: boolean;
}
export interface ForWhomItem {
  id: number;
  title: string;
  description: string;
  order: number;
}
export interface Mechanism {
  id: number;
  number: number;
  title: string;
  bullets: string[];
  imageUrl: string | null;
  order: number;
}
export interface Format {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  miniResults: string[];
  previewImageUrl: string | null;
  heroImageUrl: string | null;
  pricePerSession: number;
  priceCourse: number;
  order: number;
  isActive: boolean;
  forWhom?: ForWhomItem[];
  mechanisms?: Mechanism[];
}
export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";
export type MediaType = "NONE" | "IMAGE" | "VIDEO";
export interface Review {
  id: number;
  authorName: string;
  text: string;
  rating: number | null;
  mediaUrl: string | null;
  mediaType: MediaType;
  status: ReviewStatus;
  createdAt: string;
}
export interface Slot {
  id: number;
  startsAt: string;
  durationMin: number;
  capacity: number;
  formatId: number | null;
  isDiagnostic: boolean;
  formatName: string | null;
  pricePerSession: number;
  coursePerSession: number;
  taken: number;
  remaining: number;
}
export interface SiteSettings {
  id: number;
  address: string;
  phone: string;
  email: string;
  courseThreshold: number;
  userAgreementUrl: string;
}
export interface Announcement {
  id: number;
  title: string;
  description: string;
  imageUrl: string | null;
  startsAt: string;
  capacity: number;
  price: number;
  isFree: boolean;
  isActive: boolean;
}

export const getHero = () => api<HomeHero>("/home/hero");
export const getFaq = () => api<HomeFaq[]>("/home/faq");
export const getSteps = () => api<HomeStep[]>("/home/steps");
export const getFormats = () => api<Format[]>("/formats");
export const getFormat = (slug: string) =>
  api<Format>(`/formats/slug/${slug}`);
export const getApprovedReviews = () => api<Review[]>("/reviews");
export const getSettings = () => api<SiteSettings>("/settings");
export const getAvailableSlots = (formatId?: number) =>
  api<Slot[]>(`/booking/slots${formatId ? `?formatId=${formatId}` : ""}`);
export const getDiagnosticSlots = () => api<Slot[]>("/booking/diagnostics");
export const getAnnouncements = () => api<Announcement[]>("/announcements");
export const validatePromo = (code: string) =>
  api<{ valid: boolean; kind?: string }>("/promo/validate", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
