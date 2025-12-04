import type { Locale } from "./translations"

export function getTranslatedName(
  name: string | Array<Record<Locale, string>>,
  lang: Locale
): string {
  if (typeof name === "string") return name
  const entry = name.find((n) => Object.prototype.hasOwnProperty.call(n, lang))
  return entry ? (entry as Record<Locale, string>)[lang] : ""
}


