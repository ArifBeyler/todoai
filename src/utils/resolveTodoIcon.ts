import type { Icon } from "phosphor-react-native";
import {
  CATEGORY_ICON_MAP,
  DEFAULT_ICON_ENTRY,
  KEYWORD_RULES,
} from "@/src/constants/todoIcons";

type ResolvedIcon = {
  Icon: Icon;
  color: string;
  category: string;
  source: "keyword" | "category" | "default";
};

const normalize = (text: string): string =>
  text
    .replace(/İ/gi, "i")
    .replace(/I/g, "ı")
    .toLowerCase()
    .trim();

export const resolveTodoIcon = (title: string, category: string): ResolvedIcon => {
  const normalizedTitle = normalize(title);

  for (const rule of KEYWORD_RULES) {
    for (const keyword of rule.keywords) {
      if (normalizedTitle.includes(normalize(keyword))) {
        return { Icon: rule.icon, color: rule.color, category: rule.category, source: "keyword" };
      }
    }
  }

  const categoryEntry = CATEGORY_ICON_MAP[category];
  if (categoryEntry) {
    return { Icon: categoryEntry.icon, color: categoryEntry.color, category, source: "category" };
  }

  return {
    Icon: DEFAULT_ICON_ENTRY.icon,
    color: DEFAULT_ICON_ENTRY.color,
    category: "other",
    source: "default",
  };
};
