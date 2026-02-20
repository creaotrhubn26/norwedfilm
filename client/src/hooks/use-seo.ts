import { useEffect } from "react";

interface UseSeoOptions {
  title: string;
  description: string;
  canonicalPath?: string;
  ogType?: "website" | "article";
}

function upsertMetaByName(name: string, content: string) {
  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertMetaByProperty(property: string, content: string) {
  let element = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function upsertCanonical(pathname: string) {
  let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  link.setAttribute("href", `${window.location.origin}${normalizedPath}`);
}

export function useSeo({ title, description, canonicalPath, ogType = "website" }: UseSeoOptions) {
  useEffect(() => {
    document.title = title;
    upsertMetaByName("description", description);
    upsertMetaByName("language", "Norwegian");

    upsertMetaByProperty("og:title", title);
    upsertMetaByProperty("og:description", description);
    upsertMetaByProperty("og:type", ogType);
    upsertMetaByProperty("og:locale", "nb_NO");

    if (canonicalPath) {
      upsertCanonical(canonicalPath);
    }
  }, [title, description, canonicalPath, ogType]);
}
