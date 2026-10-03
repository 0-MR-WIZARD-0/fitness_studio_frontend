import type { SiteSettings } from "@/lib/api";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export function StructuredData({ settings }: { settings: SiteSettings }) {
  const links = [settings.telegramUrl, settings.maxUrl].filter(Boolean);

  const data = {
    "@context": "https://schema.org",
    "@type": "HealthClub",
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.address.trim()
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: settings.address,
            addressCountry: "RU",
          },
        }
      : {}),
    ...(settings.mapLat != null && settings.mapLng != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: settings.mapLat,
            longitude: settings.mapLng,
          },
        }
      : {}),
    ...(links.length ? { sameAs: links } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
