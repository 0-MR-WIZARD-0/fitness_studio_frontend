import {
  api,
  API_BASE,
  type Announcement,
  type Format,
  type HomeFaq,
  type HomeHero,
  type HomeStep,
  type Review,
  type ReviewStatus,
  type SiteSettings,
  type Slot,
} from "./api";

export type UploadFolder =
  | "hero"
  | "faq"
  | "steps"
  | "formats"
  | "mechanisms"
  | "announcements";

const authOpts = (
  method: string,
  body?: unknown,
): RequestInit & { auth: boolean } => ({
  method,
  auth: true,
  body: body !== undefined ? JSON.stringify(body) : undefined,
});

export interface AdminUser {
  id: number;
  username: string;
}
export const adminLogin = (username: string, password: string) =>
  api<{ user: AdminUser }>("/auth/login", authOpts("POST", { username, password }));
export const adminMe = () => api<{ user: AdminUser }>("/auth/me", { auth: true });
export const adminLogout = () => api("/auth/logout", authOpts("POST"));

export async function uploadFile(
  file: File,
  folder: UploadFolder = "formats",
): Promise<{ url: string; mediaType: "IMAGE" | "VIDEO" }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/uploads?folder=${folder}`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  if (!res.ok) throw new Error("Ошибка загрузки файла");
  return res.json();
}

export async function deleteUpload(url?: string | null): Promise<void> {
  if (!url || !url.startsWith("/uploads/")) return;
  await api("/uploads", authOpts("DELETE", { url })).catch(() => {});
}

export const updateHero = (data: Partial<HomeHero>) =>
  api<HomeHero>("/home/hero", authOpts("PUT", data));

export const adminFaqList = () => api<HomeFaq[]>("/home/admin/faq", { auth: true });
export const createFaq = (data: Partial<HomeFaq>) =>
  api<HomeFaq>("/home/faq", authOpts("POST", data));
export const updateFaq = (id: number, data: Partial<HomeFaq>) =>
  api<HomeFaq>(`/home/faq/${id}`, authOpts("PUT", data));
export const deleteFaq = (id: number) =>
  api(`/home/faq/${id}`, authOpts("DELETE"));

export const adminStepList = () =>
  api<HomeStep[]>("/home/admin/steps", { auth: true });
export const createStep = (data: Partial<HomeStep>) =>
  api<HomeStep>("/home/steps", authOpts("POST", data));
export const updateStep = (id: number, data: Partial<HomeStep>) =>
  api<HomeStep>(`/home/steps/${id}`, authOpts("PUT", data));
export const deleteStep = (id: number) =>
  api(`/home/steps/${id}`, authOpts("DELETE"));

export const adminFormatList = () =>
  api<Format[]>("/formats/admin/all", { auth: true });
export const adminFormat = (id: number) =>
  api<Format>(`/formats/admin/${id}`, { auth: true });
export const createFormat = (data: unknown) =>
  api<Format>("/formats", authOpts("POST", data));
export const updateFormat = (id: number, data: unknown) =>
  api<Format>(`/formats/${id}`, authOpts("PUT", data));
export const deleteFormat = (id: number) =>
  api(`/formats/${id}`, authOpts("DELETE"));

export const adminReviews = (status?: ReviewStatus) =>
  api<Review[]>(
    `/reviews/admin/all${status ? `?status=${status}` : ""}`,
    { auth: true },
  );
export const moderateReview = (id: number, status: ReviewStatus) =>
  api<Review>(`/reviews/${id}/status`, authOpts("PUT", { status }));
export const deleteReview = (id: number) =>
  api(`/reviews/${id}`, authOpts("DELETE"));

export interface AdminSlot {
  id: number;
  startsAt: string;
  durationMin: number;
  capacity: number;
  formatId: number | null;
  isDiagnostic: boolean;
  format: Format | null;
  bookings: { id: number; name: string }[];
  _count: { bookings: number };
}
export const adminSlots = () =>
  api<AdminSlot[]>("/booking/admin/slots", { auth: true });
export const createSlot = (data: {
  formatId?: number;
  startsAt: string;
  durationMin?: number;
  capacity?: number;
  isDiagnostic?: boolean;
}) => api<Slot>("/booking/slots", authOpts("POST", data));
export const createWeekdaySlots = (data: {
  formatId?: number;
  time: string;
  weeks: number;
  fromDate?: string;
  durationMin?: number;
  capacity?: number;
  isDiagnostic?: boolean;
}) =>
  api<{ created: number }>("/booking/slots/weekdays", authOpts("POST", data));
export const updateSlot = (id: number, startsAt: string) =>
  api<Slot>(`/booking/slots/${id}`, authOpts("PUT", { startsAt }));
export const deleteSlot = (id: number) =>
  api(`/booking/slots/${id}`, authOpts("DELETE"));
export interface AdminBooking {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  isCourse: boolean;
  isDiagnostic: boolean;
  isFree: boolean;
  price: number;
  status: string;
  createdAt: string;
  slot: Slot | null;
  format: Format | null;
  announcement: { id: number; title: string } | null;
  promoCode: { code: string; kind: string } | null;
}
export const adminBookings = () =>
  api<AdminBooking[]>("/booking/admin/bookings", { auth: true });

export interface PromoCode {
  id: number;
  code: string;
  kind: "GENERIC" | "GIFT";
  isUsed: boolean;
  name: string | null;
  phone: string | null;
  email: string | null;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
}
export const adminPromos = () =>
  api<PromoCode[]>("/promo/admin", { auth: true });
export const generatePromo = () =>
  api<PromoCode>("/promo/generate", authOpts("POST"));
export const updatePromoExpiry = (id: number, expiresAt: string) =>
  api<PromoCode>(`/promo/${id}/expiry`, authOpts("PUT", { expiresAt }));
export const deletePromo = (id: number) =>
  api(`/promo/${id}`, authOpts("DELETE"));

export const adminAnnouncements = () =>
  api<Announcement[]>("/announcements/admin", { auth: true });
export const createAnnouncement = (data: Partial<Announcement>) =>
  api<Announcement>("/announcements", authOpts("POST", data));
export const updateAnnouncement = (id: number, data: Partial<Announcement>) =>
  api<Announcement>(`/announcements/${id}`, authOpts("PUT", data));
export const deleteAnnouncement = (id: number) =>
  api(`/announcements/${id}`, authOpts("DELETE"));

export const updateSettings = (data: Partial<SiteSettings>) =>
  api<SiteSettings>("/settings", authOpts("PUT", data));
