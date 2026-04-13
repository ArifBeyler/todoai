export type TodoMeaningCategory =
  | "pet"
  | "health"
  | "home"
  | "work"
  | "relationship"
  | "selfcare"
  | "errands"
  | "fitness"
  | "education"
  | "finance"
  | "general";

export type TodoTone = "warm" | "focused" | "energetic" | "gentle";

export type TodoMeaning = {
  category: TodoMeaningCategory;
  emoji: string;
  tone: TodoTone;
};

type MeaningRule = {
  pattern: RegExp;
  category: TodoMeaningCategory;
  emoji: string;
  tone: TodoTone;
};

const MEANING_RULES: MeaningRule[] = [
  {
    pattern: /köpek|kedi|mama|veteriner|taşıma|yürüyüş|pati|kuş|balık|hamster|tavşan|papağan|tasma/i,
    category: "pet",
    emoji: "🐶",
    tone: "warm",
  },
  {
    pattern: /spor|egzersiz|koşu|yoga|pilates|antrenman|fitness|yüzme|bisiklet|gym/i,
    category: "fitness",
    emoji: "💪",
    tone: "energetic",
  },
  {
    pattern: /doktor|ilaç|hastane|sağlık|vitamin|aşı|terapi|diş|kontrol|randevu/i,
    category: "health",
    emoji: "🏥",
    tone: "gentle",
  },
  {
    pattern: /temizlik|çamaşır|bulaşık|ütü|süpür|fırın|ev\s|evde|mutfak|yemek|pişir|tarif/i,
    category: "home",
    emoji: "🏠",
    tone: "gentle",
  },
  {
    pattern: /toplantı|sunum|mail|rapor|proje|deadline|ofis|müşteri|çalış|iş\b/i,
    category: "work",
    emoji: "💼",
    tone: "focused",
  },
  {
    pattern: /anne|baba|arkadaş|sevgili|doğum günü|hediye|aile|ziyaret|buluşma|parti|davet/i,
    category: "relationship",
    emoji: "❤️",
    tone: "warm",
  },
  {
    pattern: /kitap|meditasyon|günlük|dinlen|uyku|müzik|podcast/i,
    category: "selfcare",
    emoji: "🌿",
    tone: "gentle",
  },
  {
    pattern: /ders|ödev|sınav|okuma|kurs|eğitim|okul|üniversite/i,
    category: "education",
    emoji: "📚",
    tone: "focused",
  },
  {
    pattern: /fatura|banka|noter|vergi|ödeme|kredi|para|maaş/i,
    category: "finance",
    emoji: "💰",
    tone: "focused",
  },
  {
    pattern: /kargo|iade|market|alışveriş|sipariş|mağaza|satın/i,
    category: "errands",
    emoji: "📋",
    tone: "focused",
  },
  {
    pattern: /ara\b|telefon|arama/i,
    category: "relationship",
    emoji: "📞",
    tone: "warm",
  },
];

const normalize = (text: string): string =>
  text
    .replace(/İ/gi, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .trim();

export const classifyTodoMeaning = (title: string): TodoMeaning => {
  const normalizedTitle = normalize(title);

  for (const rule of MEANING_RULES) {
    if (rule.pattern.test(normalizedTitle)) {
      return {
        category: rule.category,
        emoji: rule.emoji,
        tone: rule.tone,
      };
    }
  }

  return { category: "general", emoji: "", tone: "focused" };
};

export const shouldUseEmoji = (
  meaning: TodoMeaning,
  context: "active_hours" | "outside_hours" | "achievement" | "system",
): boolean => {
  if (context === "system") return false;
  if (context === "achievement") return true;
  if (meaning.category === "general") return false;
  if (meaning.tone === "warm" || meaning.tone === "energetic") return true;
  if (context === "active_hours" && meaning.emoji !== "") return true;
  return false;
};
