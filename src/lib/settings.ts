import { db, settings } from "@/db";
import { cache } from "react";

export type ManualMethod = {
  enabled: boolean;
  label: string;
  /** Payment details shown to the buyer (email, phone, wallet, IBAN…) */
  details: string;
  instructionsEn: string;
  instructionsRu: string;
};

export const MANUAL_METHODS = ["zelle", "paypal", "venmo", "cashapp", "wise", "monobank", "crypto", "bank"] as const;
export type ManualMethodKey = (typeof MANUAL_METHODS)[number];

const manual = (label: string, enabled = true): ManualMethod => ({
  enabled,
  label,
  details: "",
  instructionsEn: "",
  instructionsRu: "",
});

export const DEFAULT_SETTINGS = {
  brand: {
    name: "MARYNA MOROZ FITNESS",
    altName: "TRAIN WITH MARYNA MOROZ",
    logoId: null as number | null,
    sloganEn: "TRAIN LIKE A FIGHTER.",
    sloganRu: "ТРЕНИРУЙСЯ КАК БОЕЦ.",
  },
  colors: {
    bg: "#09090B",
    surface: "#141418",
    surface2: "#202027",
    text: "#FFFFFF",
    muted: "#D1D1D6",
    accent: "#F43F46",
    accent2: "#FF5C48",
    lime: "#D9FF43",
  },
  home: {
    heroTitleEn: "TRAIN LIKE A FIGHTER.",
    heroTitleRu: "ТРЕНИРУЙСЯ КАК БОЕЦ.",
    heroSubEn: "Boxing. MMA. Strength. Mobility. Real training with Ukrainian UFC athlete Maryna Moroz.",
    heroSubRu: "Бокс. ММА. Сила. Мобильность. Настоящие тренировки с украинской спортсменкой UFC Мариной Мороз.",
    heroImageId: null as number | null,
    heroVideoId: null as number | null,
    featuredVideoId: null as number | null,
    coachImageId: null as number | null,
    anywhereImageId: null as number | null,
    onlineImageId: null as number | null,
    wordsEn: "FIGHTER. STRENGTH. DISCIPLINE. POWER. FOCUS.",
    wordsRu: "БОЕЦ. СИЛА. ДИСЦИПЛИНА. МОЩЬ. ФОКУС.",
    finalCtaEn: "YOUR TRAINING STARTS HERE.",
    finalCtaRu: "ТВОИ ТРЕНИРОВКИ НАЧИНАЮТСЯ ЗДЕСЬ.",
  },
  about: {
    photoId: null as number | null,
    bioEn: "",
    bioRu: "",
  },
  contacts: {
    email: "",
    phone: "",
    telegram: "",
    whatsapp: "",
    instagram: "",
    youtube: "",
    tiktok: "",
    facebook: "",
  },
  coach: {
    timezone: "America/New_York",
    noticeHours: 24,
    windowDays: 30,
    slotStepMin: 30,
    meetingUrl: "",
    notifyEmail: "",
  },
  payments: {
    stripeEnabled: true,
    manual: {
      zelle: manual("Zelle"),
      paypal: manual("PayPal"),
      venmo: manual("Venmo"),
      cashapp: manual("Cash App"),
      wise: manual("Wise"),
      monobank: manual("Monobank"),
      crypto: manual("Crypto (USDT)"),
      bank: manual("Bank transfer", false),
    } as Record<ManualMethodKey, ManualMethod>,
  },
  seo: {
    titleEn: "Maryna Moroz Fitness — Train Like a Fighter",
    titleRu: "Maryna Moroz Fitness — тренируйся как боец",
    descEn: "Boxing, MMA, kickboxing, kettlebell, dumbbell, conditioning and mobility programs from UFC veteran Maryna Moroz. Video workouts and online coaching in English and Russian.",
    descRu: "Программы по боксу, ММА, кикбоксингу, гирям, гантелям, кондиции и мобильности от ветерана UFC Марины Мороз. Видеотренировки и онлайн-коучинг на русском и английском.",
  },
};

export type Settings = typeof DEFAULT_SETTINGS;
export type SettingsKey = keyof Settings;

function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over)) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) {
    const b = (base as Record<string, unknown>)[k];
    out[k] = b && typeof b === "object" && !Array.isArray(b) ? merge(b, v) : v;
  }
  return out as T;
}

export const getSettings = cache(async (): Promise<Settings> => {
  const rows = await db.select().from(settings);
  let s = DEFAULT_SETTINGS;
  for (const r of rows) {
    if (r.key in s) s = { ...s, [r.key]: merge(s[r.key as SettingsKey], r.value) };
  }
  return s;
});

export async function saveSetting<K extends SettingsKey>(key: K, value: Settings[K]) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}
