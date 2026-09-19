"use client";

import { createContext, useContext } from "react";
import type { AdminUser } from "@/lib/admin";

const AdminContext = createContext<AdminUser | null>(null);

export const AdminProvider = AdminContext.Provider;

export const TRAINER_PATHS = [
  "/admin/profile",
  "/admin/booking",
  "/admin/services",
  "/admin/promo",
  "/admin/reviews",
];

export function useAdmin() {
  const admin = useContext(AdminContext);
  const isOwner = admin?.role === "OWNER";
  return {
    admin,
    isOwner,
    canEdit: (item: { createdById?: number | null }) =>
      isOwner || (!!admin && item.createdById === admin.id),
  };
}
