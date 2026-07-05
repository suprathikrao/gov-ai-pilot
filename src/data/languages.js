/* ----------------------------------------------------------------
   SUPPORTED LANGUAGES
   `code` follows ISO 639-1 where possible. `native` is the label
   shown in-app. Add more entries here to extend language support —
   everything else (selector, translations lookup) reads this list.
------------------------------------------------------------------ */
export const LANGUAGES = [
  { code: "en", native: "English" },
  { code: "hi", native: "हिंदी" },
  { code: "te", native: "తెలుగు" },
  { code: "ta", native: "தமிழ்" },
  { code: "kn", native: "ಕನ್ನಡ" },
  { code: "ml", native: "മലയാളം" },
  { code: "mr", native: "मराठी" },
  { code: "bn", native: "বাংলা" },
  { code: "gu", native: "ગુજરાતી" },
  { code: "pa", native: "ਪੰਜਾਬੀ" },
  { code: "ur", native: "اردو" },
  { code: "or", native: "ଓଡ଼ିଆ" },
  { code: "as", native: "অসমীয়া" },
];

export const DEFAULT_LANGUAGE = "en";

export function languageByCode(code) {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
}
