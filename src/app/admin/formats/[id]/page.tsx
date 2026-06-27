"use client";

import { use, useEffect, useState } from "react";
import type { Format } from "@/lib/api";
import { adminFormat } from "@/lib/admin";
import { FormatEditor } from "@/components/admin/FormatEditor";

export default function EditFormatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [format, setFormat] = useState<Format | null>(null);

  useEffect(() => {
    adminFormat(Number(id)).then(setFormat);
  }, [id]);

  if (!format) return <p>Загрузка…</p>;
  return <FormatEditor initial={format} />;
}
