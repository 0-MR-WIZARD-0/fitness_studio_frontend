import {
  api,
  API_BASE,
  type Announcement,
  type Condition,
  type Format,
  type RiskLevel,
  type HomeFaq,
  type HomeHero,
  type HomeStep,
  type Review,
  type ReviewStatus,
  type SiteSettings,
  type Slot,
  type Hall,
  type RentalSlot,
  type Service,
  type StudioDocument,
  type StudioPhoto,
  type Trainer,
} from "./api";

export type UploadFolder =
  | "hero"
  | "faq"
  | "steps"
  | "formats"
  | "mechanisms"
  | "announcements"
  | "trainers"
  | "studio";

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
  api<{ user: AdminUser }>(
    "/auth/login",
    authOpts("POST", { username, password }),
  );
export const adminMe = () =>
  api<{ user: AdminUser }>("/auth/me", { auth: true });
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

export const adminFaqList = () =>
  api<HomeFaq[]>("/home/admin/faq", { auth: true });
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

export interface ConditionInput {
  name: string;
  order?: number;
  isActive?: boolean;
  rules: { formatId: number; risk: RiskLevel; note?: string }[];
}
export const adminConditions = () =>
  api<Condition[]>("/survey/admin/conditions", { auth: true });
export const createCondition = (data: ConditionInput) =>
  api<Condition>("/survey/conditions", authOpts("POST", data));
export const updateCondition = (id: number, data: ConditionInput) =>
  api<Condition>(`/survey/conditions/${id}`, authOpts("PUT", data));
export const deleteCondition = (id: number) =>
  api(`/survey/conditions/${id}`, authOpts("DELETE"));
export const importConditions = (items: ConditionInput[]) =>
  api<{ created: number; updated: number }>(
    "/survey/conditions/import",
    authOpts("POST", { items }),
  );

export const adminReviews = (status?: ReviewStatus) =>
  api<Review[]>(`/reviews/admin/all${status ? `?status=${status}` : ""}`, {
    auth: true,
  });
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
  trainerId: number | null;
  trainer: Trainer | null;
  hallId: number | null;
  hall: Hall | null;
  bookings: { id: number; name: string }[];
  _count: { bookings: number };
}
export const adminSlots = () =>
  api<AdminSlot[]>("/booking/admin/slots", { auth: true });
export const createSlot = (data: {
  formatId?: number;
  trainerId?: number | null;
  hallId?: number | null;
  startsAt: string;
  durationMin?: number;
  capacity?: number;
  isDiagnostic?: boolean;
}) => api<Slot>("/booking/slots", authOpts("POST", data));
export const createWeekdaySlots = (data: {
  formatId?: number;
  trainerId?: number | null;
  hallId?: number | null;
  time: string;
  weeks: number;
  fromDate?: string;
  durationMin?: number;
  capacity?: number;
  isDiagnostic?: boolean;
}) =>
  api<{ created: number; skipped?: number }>(
    "/booking/slots/weekdays",
    authOpts("POST", data),
  );
export const updateSlot = (
  id: number,
  startsAt: string,
  trainerId?: number | null,
  confirm?: { password: string; notified: boolean },
) =>
  api<Slot>(
    `/booking/slots/${id}`,
    authOpts("PUT", {
      startsAt,
      ...(trainerId !== undefined ? { trainerId } : {}),
      ...(confirm ?? {}),
    }),
  );

export interface AdminRentalSlot extends RentalSlot {
  bookings: { id: number; name: string; phone: string; email: string | null }[];
}
export const adminRentSlots = () =>
  api<AdminRentalSlot[]>("/rent/admin/slots", { auth: true });
export const createRentSlot = (data: {
  startsAt: string;
  endsAt: string;
  price?: number;
  comment?: string;
  isActive?: boolean;
  serviceId?: number | null;
  hallId?: number | null;
}) => api<RentalSlot>("/rent/slots", authOpts("POST", data));
export const updateRentSlot = (
  id: number,
  data: {
    startsAt: string;
    endsAt: string;
    price?: number;
    comment?: string;
    isActive?: boolean;
    serviceId?: number | null;
    hallId?: number | null;
  },
) => api<RentalSlot>(`/rent/slots/${id}`, authOpts("PUT", data));

export interface HallInput {
  title: string;
  description?: string;
  priceSingle?: number;
  price4?: number;
  price8?: number;
  price12?: number;
  isMain?: boolean;
  bookingUrl?: string;
  dayStart?: string;
  dayEnd?: string;
  bufferMin?: number;
  order?: number;
  isActive?: boolean;
}
export const adminHalls = () => api<Hall[]>("/halls/admin", { auth: true });
export const createHall = (data: HallInput) =>
  api<Hall>("/halls", authOpts("POST", data));
export const updateHall = (id: number, data: HallInput) =>
  api<Hall>(`/halls/${id}`, authOpts("PUT", data));
export const deleteHall = (id: number) =>
  api(`/halls/${id}`, authOpts("DELETE"));

export interface ServiceInput {
  title: string;
  description?: string;
  price?: number;
  durationMin?: number | null;
  order?: number;
  isActive?: boolean;
}
export const adminServices = () =>
  api<Service[]>("/services/admin", { auth: true });
export const createService = (data: ServiceInput) =>
  api<Service>("/services", authOpts("POST", data));
export const updateService = (id: number, data: ServiceInput) =>
  api<Service>(`/services/${id}`, authOpts("PUT", data));
export const deleteService = (id: number) =>
  api(`/services/${id}`, authOpts("DELETE"));
export const addStudioPhoto = (data: {
  url: string;
  caption?: string;
  order?: number;
}) => api<StudioPhoto>("/rent/photos", authOpts("POST", data));
export const updateStudioPhoto = (
  id: number,
  data: { url: string; caption?: string; order?: number },
) => api<StudioPhoto>(`/rent/photos/${id}`, authOpts("PUT", data));
export const deleteStudioPhoto = (id: number) =>
  api(`/rent/photos/${id}`, authOpts("DELETE"));

export const deleteRentSlot = (id: number) =>
  api<{ ok: boolean; closed: boolean }>(
    `/rent/slots/${id}`,
    authOpts("DELETE"),
  );
export const syncRentSlots = (days?: number) =>
  api<{ created: number; removed: number }>(
    "/rent/sync",
    authOpts("POST", days ? { days } : {}),
  );

export const adminTrainers = () =>
  api<Trainer[]>("/trainers/admin", { auth: true });
export const createTrainer = (data: Partial<Trainer>) =>
  api<Trainer>("/trainers", authOpts("POST", data));
export const updateTrainer = (id: number, data: Partial<Trainer>) =>
  api<Trainer>(`/trainers/${id}`, authOpts("PUT", data));
export const deleteTrainer = (id: number) =>
  api(`/trainers/${id}`, authOpts("DELETE"));
export const deleteSlot = (
  id: number,
  confirm?: { password: string; notified: boolean },
) =>
  api<{ ok: boolean; cancelled: number }>(
    `/booking/slots/${id}`,
    authOpts("DELETE", confirm ?? {}),
  );
export interface AdminBooking {
  id: number;
  userId: number | null;
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
  announcement: {
    id: number;
    title: string;
    startsAt: string;
    isFree: boolean;
  } | null;
  rentalSlot: { id: number; startsAt: string } | null;
  promoCode: { code: string; kind: string } | null;
}
export const moveClientBooking = (bookingId: number, slotId: number) =>
  api(
    `/booking/admin/bookings/${bookingId}/move`,
    authOpts("POST", { slotId }),
  );
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

export const adminDocuments = () =>
  api<StudioDocument[]>("/documents/admin", { auth: true });
export const createDocument = (data: {
  title: string;
  fileUrl: string;
  order?: number;
  isActive?: boolean;
}) => api<StudioDocument>("/documents", authOpts("POST", data));
export const updateDocument = (
  id: number,
  data: { title: string; fileUrl: string; order?: number; isActive?: boolean },
) => api<StudioDocument>(`/documents/${id}`, authOpts("PUT", data));
export const deleteDocument = (id: number) =>
  api(`/documents/${id}`, authOpts("DELETE"));

export async function uploadDocumentFile(file: File): Promise<{ url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch(`${API_BASE}/documents/file`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  if (!res.ok) {
    let message = "Не удалось загрузить файл";
    try {
      const body = (await res.json()) as { message?: string | string[] };
      if (body?.message)
        message = Array.isArray(body.message)
          ? body.message.join(", ")
          : body.message;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}
