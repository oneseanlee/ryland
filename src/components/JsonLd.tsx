import { useEffect } from "react";

interface JsonLdProps {
  /** Stable id used as the <script> element id to prevent duplicates. */
  id: string;
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Injects a JSON-LD <script> into <head> and removes it on unmount.
 * Use per-route to add Breadcrumb, Service, Product, Article, FAQPage, etc.
 */
const JsonLd = ({ id, data }: JsonLdProps) => {
  useEffect(() => {
    const elId = `jsonld-${id}`;
    let el = document.getElementById(elId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = elId;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => {
      const existing = document.getElementById(elId);
      if (existing) existing.remove();
    };
  }, [id, data]);

  return null;
};

/** Builds a BreadcrumbList schema object for the given trail. */
export const breadcrumbSchema = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    name: item.name,
    item: `https://rylandpartners.com${item.path}`,
  })),
});

/** Builds a Service schema object. */
export const serviceSchema = (opts: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  areaServed?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Service",
  name: opts.name,
  description: opts.description,
  serviceType: opts.serviceType,
  areaServed: opts.areaServed ?? "United States",
  provider: {
    "@type": "Organization",
    name: "Ryland Partners",
    url: "https://rylandpartners.com",
  },
  url: `https://rylandpartners.com${opts.path}`,
});

export default JsonLd;
