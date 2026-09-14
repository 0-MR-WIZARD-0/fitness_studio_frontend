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
    } catch {}
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
  subtitle2: string;
  description: string;
  imageUrl: string | null;
  faqImageUrl: string | null;
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
  durationMin: number;
  order: number;
  isActive: boolean;
  forWhom?: ForWhomItem[];
  mechanisms?: Mechanism[];
}
export type RiskLevel = "ALLOWED" | "CAUTION" | "FORBIDDEN";
export interface ConditionRule {
  id: number;
  conditionId: number;
  formatId: number;
  risk: RiskLevel;
  note: string;
}
export interface Condition {
  id: number;
  name: string;
  order: number;
  isActive: boolean;
  rules: ConditionRule[];
}
export interface StudioPhoto {
  id: number;
  url: string;
  caption: string;
  order: number;
}
export interface RentalSlot {
  id: number;
  startsAt: string;
  endsAt: string;
  durationMin: number;
  price: number;
  comment: string;
  isActive: boolean;
  isAuto: boolean;
  serviceId: number | null;
  serviceTitle: string;
  hallId: number | null;
  hallTitle: string | null;
  isBooked: boolean;
}

export interface Hall {
  id: number;
  title: string;
  description: string;
  priceSingle: number;
  price4: number;
  price8: number;
  price12: number;
  isMain: boolean;
  bookingUrl: string;
  dayStart: string;
  dayEnd: string;
  bufferMin: number;
  order: number;
  isActive: boolean;
}
export const getHalls = () => api<Hall[]>("/halls");

export interface Service {
  id: number;
  title: string;
  description: string;
  price: number;
  durationMin: number | null;
  order: number;
  isActive: boolean;
}
export const getServices = () => api<Service[]>("/services");
export const orderService = (data: {
  serviceId: number;
  documentIds?: number[];
}) =>
  api<{ total: number }>("/services/order", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
export interface StudioDocument {
  id: number;
  title: string;
  fileUrl: string;
  order: number;
  isActive: boolean;
}
export const getDocuments = () => api<StudioDocument[]>("/documents");

export interface AccountUser {
  id: number;
  email: string;
  name: string;
  phone: string;
}
export type BookingKind =
  "LESSON" | "DIAGNOSTIC" | "ANNOUNCEMENT" | "RENT" | "SERVICE";
export interface AccountBooking {
  id: number;
  kind: BookingKind;
  title: string;
  startsAt: string | null;
  endsAt: string | null;
  durationMin: number | null;
  trainerName: string | null;
  formatId: number | null;
  slotId: number | null;
  rentalSlotId: number | null;
  price: number;
  isFree: boolean;
  isCourse: boolean;
  status: "PENDING" | "PAID" | "CANCELLED";
  promoCode: string | null;
  canMove: boolean;
  canCancel: boolean;
  canFreeze: boolean;
  courseGroupId: string | null;
  cancelWarning: string | null;
  editHours: number;
  courseHours: number;
  createdAt: string;
}

export interface AccountCourse {
  courseGroupId: string;
  lessons: number;
  firstAt: string | null;
  total: number;
  canCancel: boolean;
  courseHours: number;
  giftCode: string | null;
  giftUsedAt: string | null;
  freezeExpiresAt: string | null;
}

export interface AccountFreeze {
  id: number;
  courseGroupId: string;
  expiresAt: string;
  usedAt: string | null;
  isExpired: boolean;
}
export interface AccountPromo {
  id: number;
  code: string;
  kind: "GENERIC" | "GIFT";
  isUsed: boolean;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}

const accountOpts = (method: string, body?: unknown): FetchOpts => ({
  method,
  auth: true,
  body: body !== undefined ? JSON.stringify(body) : undefined,
});

export const accountMe = () =>
  api<{ user: AccountUser }>("/account/me", { auth: true });
export const accountLogin = (email: string, password: string) =>
  api<{ user: AccountUser }>(
    "/account/login",
    accountOpts("POST", { email, password }),
  );
export const accountRegister = (data: {
  email: string;
  password: string;
  name: string;
  phone: string;
}) =>
  api<{ user: AccountUser }>("/account/register", accountOpts("POST", data));
export const accountLogout = () =>
  api<{ ok: boolean }>("/account/logout", accountOpts("POST"));
export const accountProfile = (data: { name: string; phone: string }) =>
  api<{ user: AccountUser }>("/account/profile", accountOpts("PUT", data));
export const accountBookings = () =>
  api<AccountBooking[]>("/account/bookings", { auth: true });
export const accountPromos = () =>
  api<AccountPromo[]>("/account/promo", { auth: true });
export const cancelAccountBooking = (id: number) =>
  api<{ ok: boolean; burnedGift: string | null }>(
    `/account/bookings/${id}/cancel`,
    accountOpts("POST"),
  );
export const accountCourses = () =>
  api<AccountCourse[]>("/account/courses", { auth: true });
export const accountFreezes = () =>
  api<AccountFreeze[]>("/account/freezes", { auth: true });
export const cancelAccountCourse = (courseGroupId: string) =>
  api<{ ok: boolean; cancelled: number; burnedGift: string | null }>(
    "/account/courses/cancel",
    accountOpts("POST", { courseGroupId }),
  );
export const freezeAccountBooking = (id: number) =>
  api<{ ok: boolean }>(`/account/bookings/${id}/freeze`, accountOpts("POST"));
export const moveAccountBooking = (
  id: number,
  target: { slotId?: number; rentalSlotId?: number },
) => api(`/account/bookings/${id}/move`, accountOpts("POST", target));

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
export interface Trainer {
  id: number;
  name: string;
  role: string;
  description: string;
  photoUrl: string | null;
  order: number;
  isActive: boolean;
}
export interface Slot {
  id: number;
  startsAt: string;
  durationMin: number;
  capacity: number;
  formatId: number | null;
  isDiagnostic: boolean;
  formatName: string | null;
  trainerId: number | null;
  trainerName: string | null;
  hallId?: number | null;
  hallName?: string | null;
  pricePerSession: number;
  taken: number;
  remaining: number;
}
export interface SiteSettings {
  id: number;
  address: string;
  phone: string;
  email: string;
  courseThreshold: number;
  pricePerSession: number;
  priceCourse: number;
  userAgreementUrl: string;
  telegramUrl: string;
  maxUrl: string;
  rentPricePerHour: number;
  rentDayStart: string;
  rentDayEnd: string;
  rentBufferMin: number;
  bookingEditHours: number;
  courseCancelHours: number;
  mapLat: number | null;
  mapLng: number | null;
}
export interface Announcement {
  id: number;
  title: string;
  description: string;
  startsAt: string;
  durationMin: number;
  trainerId: number | null;
  trainerName: string | null;
  capacity: number;
  taken: number;
  remaining: number;
  price: number;
  isFree: boolean;
  isActive: boolean;
}

export const getHero = () => api<HomeHero>("/home/hero");
export const getFaq = () => api<HomeFaq[]>("/home/faq");
export const getSteps = () => api<HomeStep[]>("/home/steps");
export const getFormats = () => api<Format[]>("/formats");
export const getFormat = (slug: string) => api<Format>(`/formats/slug/${slug}`);
export const getConditions = () => api<Condition[]>("/survey/conditions");
export const getTrainers = () => api<Trainer[]>("/trainers");
export const getRentSlots = () => api<RentalSlot[]>("/rent/slots");
export const getStudioPhotos = () => api<StudioPhoto[]>("/rent/photos");
export const bookRent = (data: {
  rentalSlotId: number;
  documentIds?: number[];
}) =>
  api<{ total: number }>("/rent/book", {
    method: "POST",
    auth: true,
    body: JSON.stringify(data),
  });
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
