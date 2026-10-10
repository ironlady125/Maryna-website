export type Ex = {
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  cuesEn: string;
  cuesRu: string;
  doseEn: string;
  doseRu: string;
  minutes: number;
};

export type Wo = {
  titleEn: string;
  titleRu: string;
  descEn: string;
  descRu: string;
  minutes: number;
  rounds?: number;
  roundSec?: number;
  restSec?: number;
  isPreview?: boolean;
  exercises: Ex[];
};

export type Prog = {
  slug: string;
  category: string;
  titleEn: string;
  titleRu: string;
  subtitleEn: string;
  subtitleRu: string;
  descEn: string;
  descRu: string;
  level: "beginner" | "intermediate" | "advanced" | "all";
  equipmentEn: string;
  equipmentRu: string;
  weeks: number;
  isFree?: boolean;
  featured?: boolean;
  priceCents?: number;
  workouts: Wo[];
};

/** Compact exercise builder: [titleEn, titleRu], [descEn, descRu], [cuesEn[], cuesRu[]], [doseEn, doseRu], minutes */
export function ex(
  t: [string, string],
  d: [string, string],
  c: [string[], string[]],
  dose: [string, string],
  minutes = 3,
): Ex {
  return {
    titleEn: t[0],
    titleRu: t[1],
    descEn: d[0],
    descRu: d[1],
    cuesEn: c[0].join("\n"),
    cuesRu: c[1].join("\n"),
    doseEn: dose[0],
    doseRu: dose[1],
    minutes,
  };
}
