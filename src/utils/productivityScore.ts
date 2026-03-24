import type { TodoItemModel } from "@state/useTodoStore";

export type ProductivityTrend = "up" | "stable" | "down";

export type ScoreCategoryInsight = {
  category: string;
  points: number;
};

export type CategoryCompletionInsight = {
  category: string;
  completed: number;
};

export type WeeklyDayInsight = {
  key: string;
  label: string;
  completed: number;
  total: number;
  points: number;
};

export type PriorityBreakdown = {
  low: number;
  medium: number;
  high: number;
};

export type PointBreakdown = {
  addedPoints: number;
  completedPoints: number;
  consistencyBonus: number;
  total: number;
};

export type ProductivityInsights = {
  score: number;
  trend: ProductivityTrend;
  trendLabel: string;
  scoreDeltaWeekly: number;
  completionRate: number;
  todayPoints: number;
  weeklyCompleted: number;
  weeklyTotal: number;
  onTimeRate: number;
  streakDays: number;
  streakLevel: string;
  completedCount: number;
  activeCount: number;
  topCategories: ScoreCategoryInsight[];
  completedByCategory: CategoryCompletionInsight[];
  activeByPriority: PriorityBreakdown;
  pointBreakdown: PointBreakdown;
  last7Days: WeeklyDayInsight[];
  explanation: string;
};

const CATEGORY_WEIGHTS: Record<string, number> = {
  housework: 1.05,
  sports: 1.15,
  work: 1.35,
  social: 1.05,
  shopping: 1.1,
  health: 1.3,
  education: 1.25,
  other: 1.0,
};

const PRIORITY_BONUS: Record<TodoItemModel["priority"], number> = {
  low: 1,
  medium: 2,
  high: 4,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeCategory = (category: string) => category.trim().toLowerCase();

const CATEGORY_LABELS: Record<string, string> = {
  housework: "Ev İşi",
  sports: "Spor",
  work: "İş",
  social: "Sosyal",
  shopping: "Alışveriş",
  health: "Sağlık",
  education: "Eğitim",
  other: "Diğer",
};

const SHORT_DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

const toDayKey = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const safeDate = (value: string) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getInitialLast7Days = (): WeeklyDayInsight[] => {
  const days: WeeklyDayInsight[] = [];
  const today = new Date();

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setHours(0, 0, 0, 0);
    day.setDate(today.getDate() - i);
    days.push({
      key: toDayKey(day),
      label: SHORT_DAYS[day.getDay()],
      completed: 0,
      total: 0,
      points: 0,
    });
  }

  return days;
};

const getStreakLevel = (days: number) => {
  if (days >= 14) return "Efsane";
  if (days >= 10) return "Usta";
  if (days >= 6) return "Güçlü";
  if (days >= 3) return "İyi";
  return "Başlangıç";
};

const toDisplayCategory = (category: string) => {
  if (!category) return "Genel";
  return CATEGORY_LABELS[category] ?? (category.charAt(0).toUpperCase() + category.slice(1));
};

export const calculateMockProductivityInsights = (todos: TodoItemModel[]): ProductivityInsights => {
  const last7Days = getInitialLast7Days();

  if (!todos.length) {
    return {
      score: 58,
      trend: "stable",
      trendLabel: "Dengeli baslangic",
      scoreDeltaWeekly: 0,
      completionRate: 0,
      todayPoints: 8,
      weeklyCompleted: 2,
      weeklyTotal: 5,
      onTimeRate: 72,
      streakDays: 2,
      streakLevel: "Başlangıç",
      completedCount: 0,
      activeCount: 0,
      topCategories: [
        { category: "Saglik", points: 10 },
        { category: "Kisisel", points: 8 },
      ],
      completedByCategory: [],
      activeByPriority: { low: 0, medium: 0, high: 0 },
      pointBreakdown: {
        addedPoints: 8,
        completedPoints: 0,
        consistencyBonus: 6,
        total: 14,
      },
      last7Days,
      explanation:
        "Son gunlerde duzenli baslangic yaptin. Gorev ekleme istikrarin iyi, tamamlamayi artirdikca skorun daha hizli yukselecek.",
    };
  }

  let addedPoints = 0;
  let completedPoints = 0;
  const categoryPoints: Record<string, number> = {};
  const completedByCategoryMap: Record<string, number> = {};
  const activeByPriority: PriorityBreakdown = { low: 0, medium: 0, high: 0 };
  let completedCount = 0;
  const dayMap = Object.fromEntries(last7Days.map((d) => [d.key, d])) as Record<string, WeeklyDayInsight>;

  for (const todo of todos) {
    const categoryKey = normalizeCategory(todo.category);
    const categoryWeight = CATEGORY_WEIGHTS[categoryKey] ?? 1;
    const createdAt = safeDate(todo.createdAt);
    const dayKey = createdAt ? toDayKey(createdAt) : null;

    const addPoint = Math.round(2 * categoryWeight);
    addedPoints += addPoint;
    categoryPoints[categoryKey] = (categoryPoints[categoryKey] ?? 0) + addPoint;
    if (dayKey && dayMap[dayKey]) {
      dayMap[dayKey].total += 1;
      dayMap[dayKey].points += addPoint;
    }

    if (!todo.isCompleted) {
      activeByPriority[todo.priority] += 1;
      continue;
    }

    completedCount += 1;
    const baseCompletion = 8 + PRIORITY_BONUS[todo.priority];
    const weightedCompletion = Math.round(baseCompletion * categoryWeight);
    completedPoints += weightedCompletion;
    categoryPoints[categoryKey] = (categoryPoints[categoryKey] ?? 0) + weightedCompletion;
    completedByCategoryMap[categoryKey] = (completedByCategoryMap[categoryKey] ?? 0) + 1;
    if (dayKey && dayMap[dayKey]) {
      dayMap[dayKey].completed += 1;
      dayMap[dayKey].points += weightedCompletion;
    }
  }

  const completionRateRatio = completedCount / todos.length;
  const completionRate = Math.round(completionRateRatio * 100);
  const streakDays = clamp(Math.round(2 + completionRateRatio * 5), 1, 7);
  const onTimeRate = clamp(Math.round(64 + completionRateRatio * 28), 45, 96);
  const consistencyBonus = streakDays * 3;
  const weeklyTotal = last7Days.reduce((acc, day) => acc + day.total, 0);
  const weeklyCompleted = last7Days.reduce((acc, day) => acc + day.completed, 0);
  const todayPoints = clamp(Math.round((addedPoints + completedPoints) * 0.24), 6, 64);

  const totalScoreRaw = 45 + addedPoints + completedPoints + consistencyBonus;
  const score = clamp(totalScoreRaw, 0, 1000);

  const firstThree = last7Days.slice(0, 3);
  const lastThree = last7Days.slice(-3);
  const firstRate =
    firstThree.reduce((acc, d) => acc + (d.total ? d.completed / d.total : 0), 0) / firstThree.length;
  const lastRate =
    lastThree.reduce((acc, d) => acc + (d.total ? d.completed / d.total : 0), 0) / lastThree.length;
  const scoreDeltaWeekly = Math.round((lastRate - firstRate) * 100);

  const trend: ProductivityTrend =
    scoreDeltaWeekly > 8 ? "up" : scoreDeltaWeekly < -8 ? "down" : "stable";
  const trendLabel =
    trend === "up" ? "Yukselen ivme" : trend === "down" ? "Dikkat gerektiriyor" : "Dengeli ilerleme";

  const topCategories = Object.entries(categoryPoints)
    .map(([category, points]) => ({
      category: toDisplayCategory(category),
      points,
    }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 3);

  const completedByCategory = Object.entries(completedByCategoryMap)
    .map(([category, completed]) => ({
      category: toDisplayCategory(category),
      completed,
    }))
    .sort((a, b) => b.completed - a.completed);

  const strongestCategory = topCategories[0]?.category ?? "Genel";
  const explanation = `Skorun; gorev ekleme aliskanligi, tamamlama orani ve tutarlilik bonusundan olusuyor. En guclu alanin ${strongestCategory}. Haftalik ivme puanin ${scoreDeltaWeekly >= 0 ? `+${scoreDeltaWeekly}` : scoreDeltaWeekly}. Zamaninda tamamlama oranini artirarak puani daha hizli yukseltebilirsin.`;

  return {
    score,
    trend,
    trendLabel,
    scoreDeltaWeekly,
    completionRate,
    todayPoints,
    weeklyCompleted,
    weeklyTotal: Math.max(weeklyTotal, 1),
    onTimeRate,
    streakDays,
    streakLevel: getStreakLevel(streakDays),
    completedCount,
    activeCount: todos.length - completedCount,
    topCategories,
    completedByCategory,
    activeByPriority,
    pointBreakdown: {
      addedPoints,
      completedPoints,
      consistencyBonus,
      total: addedPoints + completedPoints + consistencyBonus,
    },
    last7Days,
    explanation,
  };
};
