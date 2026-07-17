import { useEffect } from "react";

interface PageMetaProps {
  title: string;
  description: string;
  /** Absolute or path-relative canonical URL for this page. */
  canonical?: string;
  /** When true, sets <meta name="robots" content="noindex, follow">. Use for portal, admin, checkout, thank-you, funnel, etc. */
  noindex?: boolean;
}

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [key, val] = selector.replace("meta[", "").replace("]", "").split("=");
    el.setAttribute(key, val.replace(/"/g, ""));
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

/** Sets per-page <title>, description, canonical, Open Graph / Twitter tags, and optional robots noindex. */
const PageMeta = ({ title, description, canonical, noindex }: PageMetaProps) => {
  useEffect(() => {
    document.title = title;

    setMeta('meta[name="description"]', "content", description);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);

    // Robots directive: only apply/remove when noindex is explicitly set,
    // so pages without the prop keep the default (indexable) behavior.
    if (noindex) {
      setMeta('meta[name="robots"]', "content", "noindex, follow");
    } else {
      const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (existing) existing.setAttribute("content", "index, follow");
    }

    const url = canonical
      ? canonical.startsWith("http")
        ? canonical
        : `https://rylandpartners.com${canonical.startsWith("/") ? "" : "/"}${canonical}`
      : typeof window !== "undefined"
        ? `https://rylandpartners.com${window.location.pathname}`
        : undefined;

    if (url) {
      setMeta('meta[property="og:url"]', "content", url);
      let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", url);
    }
  }, [title, description, canonical, noindex]);

  return null;
};

export default PageMeta;
