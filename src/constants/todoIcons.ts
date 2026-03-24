import {
  Barbell,
  BookOpen,
  House,
  Users,
  ShoppingCart,
  Sun,
  CalendarBlank,
  DotsThree,
  PawPrint,
  Broom,
  Pill,
  Briefcase,
  CookingPot,
  Baby,
  Airplane,
  MusicNote,
  GameController,
  Tree,
  Car,
  Gift,
  Phone,
  type Icon,
} from "phosphor-react-native";

export type TodoIconEntry = {
  icon: Icon;
  color: string;
  label: string;
};

export const CATEGORY_ICON_MAP: Record<string, TodoIconEntry> = {
  housework: { icon: House, color: "#C28B58", label: "Ev İşi" },
  sports: { icon: Barbell, color: "#C86A62", label: "Spor" },
  work: { icon: CalendarBlank, color: "#5C7CAA", label: "İş" },
  social: { icon: Users, color: "#9B7DC4", label: "Sosyal" },
  shopping: { icon: ShoppingCart, color: "#76A28A", label: "Alışveriş" },
  health: { icon: Sun, color: "#D4A843", label: "Sağlık" },
  education: { icon: BookOpen, color: "#5C7CAA", label: "Eğitim" },
  other: { icon: DotsThree, color: "#8A7A70", label: "Diğer" },
};

export const DEFAULT_ICON_ENTRY: TodoIconEntry = {
  icon: DotsThree,
  color: "#8A7A70",
  label: "Diğer",
};

type KeywordRule = {
  keywords: string[];
  icon: Icon;
  color: string;
  category: string;
};

export const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: [
      "kedi", "köpek", "pet", "veteriner", "kuş", "balık",
      "hamster", "tavşan", "papağan", "mama", "tasma",
    ],
    icon: PawPrint,
    color: "#C28B58",
    category: "other",
  },
  {
    keywords: [
      "spor", "yürüyüş", "koşu", "fitness", "egzersiz",
      "antrenman", "pilates", "yoga", "yüzme", "bisiklet",
    ],
    icon: Barbell,
    color: "#C86A62",
    category: "sports",
  },
  {
    keywords: [
      "doktor", "ilaç", "hastane", "randevu", "diş",
      "sağlık", "vitamin", "aşı", "kontrol", "terapi",
    ],
    icon: Pill,
    color: "#D4A843",
    category: "health",
  },
  {
    keywords: [
      "market", "alışveriş", "sipariş", "kargo",
      "mağaza", "satın", "hediye",
    ],
    icon: ShoppingCart,
    color: "#76A28A",
    category: "shopping",
  },
  {
    keywords: [
      "toplantı", "mail", "e-posta", "sunum", "rapor",
      "proje", "deadline", "ofis", "müşteri",
    ],
    icon: Briefcase,
    color: "#5C7CAA",
    category: "work",
  },
  {
    keywords: [
      "ders", "ödev", "sınav", "kitap", "okuma",
      "kurs", "eğitim", "çalış", "okul", "üniversite",
    ],
    icon: BookOpen,
    color: "#5C7CAA",
    category: "education",
  },
  {
    keywords: [
      "temizlik", "çamaşır", "bulaşık", "ütü",
      "süpür", "sil", "fırın", "ev",
    ],
    icon: Broom,
    color: "#C28B58",
    category: "housework",
  },
  {
    keywords: [
      "arkadaş", "aile", "ziyaret", "buluşma",
      "parti", "davet", "doğum günü",
    ],
    icon: Users,
    color: "#9B7DC4",
    category: "social",
  },
  {
    keywords: ["yemek", "tarif", "pişir", "mutfak", "kahvaltı", "akşam yemeği"],
    icon: CookingPot,
    color: "#C28B58",
    category: "housework",
  },
  {
    keywords: ["bebek", "çocuk", "kreş"],
    icon: Baby,
    color: "#D4A843",
    category: "social",
  },
  {
    keywords: ["seyahat", "uçuş", "otel", "tatil", "gezi", "bilet"],
    icon: Airplane,
    color: "#5C7CAA",
    category: "other",
  },
  {
    keywords: ["müzik", "gitar", "piyano", "konser", "şarkı"],
    icon: MusicNote,
    color: "#9B7DC4",
    category: "social",
  },
  {
    keywords: ["oyun", "game", "playstation", "xbox"],
    icon: GameController,
    color: "#76A28A",
    category: "other",
  },
  {
    keywords: ["bahçe", "çiçek", "bitki", "sulama"],
    icon: Tree,
    color: "#76A28A",
    category: "housework",
  },
  {
    keywords: ["araba", "servis", "lastik", "yıkama", "benzin", "muayene"],
    icon: Car,
    color: "#8A7A70",
    category: "other",
  },
  {
    keywords: ["hediye", "sürpriz"],
    icon: Gift,
    color: "#C86A62",
    category: "shopping",
  },
  {
    keywords: ["ara", "telefon", "arama"],
    icon: Phone,
    color: "#5C7CAA",
    category: "work",
  },
];
