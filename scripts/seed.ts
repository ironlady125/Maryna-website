/* Seeds the database with bilingual starter content and the admin account.
 * Safe to re-run: content is only inserted into empty tables; the admin password is updated from .env. */
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import {
  achievements,
  articles,
  availability,
  categories,
  db,
  exercises,
  faqs,
  legalPages,
  productPrograms,
  products,
  programs,
  settings,
  users,
  workouts,
} from "../src/db";
import { boxingPrograms } from "./seed/boxing";
import { otherPrograms } from "./seed/other";
import { legal } from "./seed/legal";

try {
  process.loadEnvFile?.(".env");
} catch {
  /* no .env file */
}

const read = (f: string) => fs.readFileSync(path.join(__dirname, "content", f), "utf8").trim();

const CATEGORIES = [
  ["boxing", "BOXING AT HOME", "БОКС ДОМА", "Learn real boxing fundamentals and fighter conditioning from home.", "Настоящие основы бокса и кондиция бойца — дома.", "Seven structured programs: fundamentals, shadow boxing, footwork, defense, combinations, boxing cardio and advanced boxing.", "Семь структурированных программ: основы, бой с тенью, работа ног, защита, комбинации, боксёрское кардио и продвинутый бокс."],
  ["boxer-strength", "BOXER STRENGTH & CONDITIONING", "СИЛА И КОНДИЦИЯ БОКСЁРА", "Rotational power, core stability and endurance for boxing.", "Ротационная мощь, стабильный корпус и выносливость для бокса.", "Strength workouts built around the physical qualities boxing really uses.", "Силовые тренировки вокруг качеств, которые реально нужны в боксе."],
  ["mma", "MMA FIGHTER TRAINING", "ТРЕНИРОВКИ ММА-БОЙЦА", "Train like an MMA fighter — no partner needed.", "Тренируйтесь как ММА-боец — без партнёра.", "MMA stance, striking with takedown defense, ground basics and fighter circuits.", "Стойка ММА, ударка с защитой от проходов, основы партера и круги бойца."],
  ["kickboxing", "KICKBOXING", "КИКБОКСИНГ", "Kicks, knees and punch-kick combinations.", "Удары ногами, коленями и комбинации руки–ноги.", "Kickboxing technique and rounds you can do at home.", "Техника кикбоксинга и раунды, которые можно делать дома."],
  ["kettlebell", "KETTLEBELL WORKOUTS", "ТРЕНИРОВКИ С ГИРЕЙ", "Explosive strength with one kettlebell.", "Взрывная сила с одной гирей.", "Swings, cleans, presses, get-ups and carries.", "Махи, взятия, жимы, турецкие подъёмы и переноски."],
  ["dumbbell", "DUMBBELL TRAINING", "ТРЕНИРОВКИ С ГАНТЕЛЯМИ", "Athletic strength with a pair of dumbbells.", "Атлетичная сила с парой гантелей.", "Upper and lower body strength programs for home.", "Программы на силу верха и низа тела для дома."],
  ["conditioning", "FIGHTER CONDITIONING", "КОНДИЦИЯ БОЙЦА", "Build the gas tank of a fighter.", "Выносливость, как у бойца.", "Round-based conditioning: aerobic base, intervals and fight rounds.", "Кондиция в формате раундов: аэробная база, интервалы и боевые раунды."],
  ["mobility", "MOBILITY & FLEXIBILITY", "МОБИЛЬНОСТЬ И ГИБКОСТЬ", "Move better and recover faster.", "Двигайтесь свободнее и восстанавливайтесь быстрее.", "Mobility flows for hips, spine and shoulders plus recovery stretching.", "Комплексы мобильности для таза, позвоночника и плеч и восстановительная растяжка."],
  ["acl", "MY ACL HOME RECOVERY", "МОЁ ВОССТАНОВЛЕНИЕ ACL ДОМА", "My journey back to strength after two ACL reconstructions.", "Мой путь к силе после двух реконструкций ACL.", "Phase-based knee strength at home, shared from my personal experience. Not medical advice.", "Укрепление колена дома по фазам на основе моего личного опыта. Не является медицинской рекомендацией."],
  ["online", "ONLINE TRAINING", "ОНЛАЙН-ТРЕНИРОВКИ", "Train 1-on-1 with Maryna by video call.", "Тренируйтесь 1-на-1 с Мариной по видеосвязи.", "Personal training sessions and coaching consultations, booked online.", "Персональные тренировки и консультации с онлайн-записью."],
] as const;

const SESSIONS = [
  {
    slug: "online-personal-training-60",
    type: "session" as const,
    titleEn: "1-on-1 Online Training — 60 min",
    titleRu: "Персональная онлайн-тренировка — 60 мин",
    descEn: "A live video session with Maryna: boxing, MMA, kickboxing or strength — with real-time corrections.",
    descRu: "Живая тренировка с Мариной по видеосвязи: бокс, ММА, кикбоксинг или силовая — с поправками в реальном времени.",
    featuresEn: "Live video call\nPersonal technique corrections\nWorkout plan for the week\nAny level",
    featuresRu: "Живой видеозвонок\nЛичные поправки техники\nПлан тренировок на неделю\nЛюбой уровень",
    priceCents: 3900,
    durationMin: 60,
  },
  {
    slug: "coaching-consultation-60",
    type: "consultation" as const,
    titleEn: "Coaching Consultation — 60 min",
    titleRu: "Консультация с тренером — 60 мин",
    descEn: "We review your goals, current training and nutrition, and build a clear action plan together.",
    descRu: "Разбираем цели, текущие тренировки и питание и вместе составляем чёткий план действий.",
    featuresEn: "Goal and level review\nTraining plan advice\nAnswers to all your questions\nCall recording",
    featuresRu: "Разбор целей и уровня\nРекомендации по плану\nОтветы на все вопросы\nЗапись звонка",
    priceCents: 4900,
    durationMin: 60,
  },
  {
    slug: "weight-cut-consultation-45",
    type: "consultation" as const,
    titleEn: "Weight Cut Consultation — 45 min",
    titleRu: "Консультация по сгонке веса — 45 мин",
    descEn: "A safe weight management plan for your division and weigh-in date.",
    descRu: "Безопасный план работы с весом под вашу категорию и дату взвешивания.",
    featuresEn: "Weight plan for fight week\nWater and sodium strategy\nRehydration after weigh-in",
    featuresRu: "План веса на неделю боя\nСтратегия воды и соли\nВосстановление после взвешивания",
    priceCents: 3500,
    durationMin: 45,
  },
];

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || !password) {
    console.log("• ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account");
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  const [u] = await db.select().from(users).where(eq(users.email, email));
  if (u) await db.update(users).set({ role: "admin", passwordHash: hash }).where(eq(users.id, u.id));
  else await db.insert(users).values({ email, passwordHash: hash, name: "Maryna", role: "admin" });
  console.log(`• Admin account ready: ${email}`);
}

async function seedContent() {
  if ((await db.select().from(categories).limit(1)).length) {
    console.log("• Content already exists — skipping content seed");
    return;
  }
  const catIds: Record<string, number> = {};
  for (const [i, c] of CATEGORIES.entries()) {
    const [row] = await db
      .insert(categories)
      .values({
        slug: c[0],
        titleEn: c[1],
        titleRu: c[2],
        subtitleEn: c[3],
        subtitleRu: c[4],
        descEn: c[5],
        descRu: c[6],
        kind: c[0] === "online" ? "service" : "training",
        sortOrder: i,
      })
      .returning();
    catIds[c[0]] = row.id;
  }

  const allPrograms = [...boxingPrograms, ...otherPrograms];
  const programIds: Record<string, number> = {};
  for (const [pi, p] of allPrograms.entries()) {
    const [prog] = await db
      .insert(programs)
      .values({
        slug: p.slug,
        categoryId: catIds[p.category],
        titleEn: p.titleEn,
        titleRu: p.titleRu,
        subtitleEn: p.subtitleEn,
        subtitleRu: p.subtitleRu,
        descEn: p.descEn,
        descRu: p.descRu,
        level: p.level,
        equipmentEn: p.equipmentEn,
        equipmentRu: p.equipmentRu,
        weeks: p.weeks,
        isFree: !!p.isFree,
        featured: !!p.featured,
        sortOrder: pi,
      })
      .returning();
    programIds[p.slug] = prog.id;
    for (const [wi, w] of p.workouts.entries()) {
      const [wo] = await db
        .insert(workouts)
        .values({
          programId: prog.id,
          titleEn: w.titleEn,
          titleRu: w.titleRu,
          descEn: w.descEn,
          descRu: w.descRu,
          minutes: w.minutes,
          rounds: w.rounds ?? 0,
          roundSec: w.roundSec ?? 180,
          restSec: w.restSec ?? 60,
          isPreview: !!w.isPreview,
          sortOrder: wi,
        })
        .returning();
      for (const [ei, e] of w.exercises.entries()) {
        await db.insert(exercises).values({ ...e, workoutId: wo.id, sortOrder: ei });
      }
    }
    if (p.priceCents) {
      const [prod] = await db
        .insert(products)
        .values({
          slug: p.slug,
          type: "program",
          titleEn: p.titleEn,
          titleRu: p.titleRu,
          descEn: p.subtitleEn,
          descRu: p.subtitleRu,
          featuresEn: `${p.workouts.length} workouts\nLifetime access\nTrack your progress`,
          featuresRu: `${p.workouts.length} тренировок\nДоступ навсегда\nОтслеживание прогресса`,
          priceCents: p.priceCents,
          featured: !!p.featured,
          sortOrder: pi,
        })
        .returning();
      await db.insert(productPrograms).values({ productId: prod.id, programId: prog.id });
    }
  }

  // Bundle with all boxing programs
  const [bundle] = await db
    .insert(products)
    .values({
      slug: "boxing-complete",
      type: "bundle",
      titleEn: "Boxing at Home — Complete",
      titleRu: "Бокс дома — полный курс",
      descEn: "All seven boxing programs in one bundle.",
      descRu: "Все семь программ по боксу в одном комплекте.",
      featuresEn: "7 boxing programs\nLifetime access\nBest value",
      featuresRu: "7 программ по боксу\nДоступ навсегда\nСамая выгодная цена",
      priceCents: 9900,
      featured: true,
      sortOrder: -1,
    })
    .returning();
  for (const p of boxingPrograms) await db.insert(productPrograms).values({ productId: bundle.id, programId: programIds[p.slug] });

  for (const [i, s] of SESSIONS.entries()) await db.insert(products).values({ ...s, featured: i === 0, sortOrder: 100 + i });

  // Achievements — unverified claims stay "pending" until the owner approves them in Admin.
  const ach: [string, string, "approved" | "pending", string][] = [
    ["UFC veteran (2015–2024)", "Ветеран UFC (2015–2024)", "approved", "UFC athlete profile."],
    ["10+ years in professional MMA", "10+ лет в профессиональном ММА", "approved", "Pro MMA debut 2013. Note: the UFC tenure itself was 2015–2024 (9 years), so '10+ years UFC experience' would be inaccurate."],
    ["2× UFC Performance of the Night", "2× бонус UFC «Выступление вечера»", "approved", "Calderwood (2015), Agapova (2022)."],
    ["Boxing & kickboxing background", "Бэкграунд в боксе и кикбоксинге", "approved", ""],
    ["Represented Ukraine internationally", "Представляла Украину на международной арене", "approved", ""],
    ["Master of Sport — Boxing", "Мастер спорта по боксу", "pending", "Please confirm with a certificate before publishing."],
    ["Master of Sport — Kickboxing", "Мастер спорта по кикбоксингу", "pending", "Please confirm with a certificate before publishing."],
    ["Ukrainian national boxing team", "Сборная Украины по боксу", "pending", "Please confirm before publishing."],
    ["Order of Princess Olga", "Орден княгини Ольги", "pending", "Confirm the exact official award, degree and decree before publishing."],
  ];
  for (const [i, a] of ach.entries()) await db.insert(achievements).values({ textEn: a[0], textRu: a[1], status: a[2], note: a[3], sortOrder: i });

  const faq: [string, string, string, string][] = [
    ["I'm a beginner. Is this for me?", "Я новичок. Мне подойдёт?", "Yes. Every category has beginner-friendly programs, and each exercise includes technique cues. Start with Boxing Fundamentals or the free starter workout.", "Да. В каждом направлении есть программы для новичков, а у каждого упражнения — подсказки по технике. Начните с «Основ бокса» или бесплатной стартовой тренировки."],
    ["Do I need equipment?", "Нужен ли инвентарь?", "Most boxing, MMA and conditioning workouts need no equipment. Strength programs list exactly what you need (a kettlebell, dumbbells or bands).", "Большинство тренировок по боксу, ММА и кондиции не требуют инвентаря. В силовых программах указано, что понадобится (гиря, гантели или петли)."],
    ["How long do I have access?", "Сколько действует доступ?", "Programs you buy are yours for life, including future updates to those programs.", "Купленные программы остаются у вас навсегда, включая будущие обновления этих программ."],
    ["How do online sessions work?", "Как проходят онлайн-занятия?", "Choose a session, pick a time in your own time zone and pay. You'll receive a confirmation email and the video call link before the session.", "Выберите формат, удобное время в вашем часовом поясе и оплатите. Вы получите письмо с подтверждением и ссылку на видеозвонок перед занятием."],
    ["How can I pay?", "Как можно оплатить?", "By card, Apple Pay or Google Pay through secure checkout, or by the alternative methods shown at checkout (for example Zelle or PayPal).", "Картой, Apple Pay или Google Pay через защищённую оплату, или альтернативными способами, указанными при оформлении (например, Zelle или PayPal)."],
    ["Can I train with an injury?", "Можно ли тренироваться с травмой?", "Please get clearance from your doctor first. The ACL program shares my personal experience and is not medical advice.", "Сначала получите разрешение врача. Программа по ACL основана на моём личном опыте и не является медицинской рекомендацией."],
    ["Which languages are available?", "На каких языках доступны тренировки?", "The whole platform is available in English and Russian. Switch the language at any time in the menu.", "Вся платформа доступна на английском и русском. Язык можно переключить в меню в любой момент."],
  ];
  for (const [i, f] of faq.entries()) await db.insert(faqs).values({ qEn: f[0], qRu: f[1], aEn: f[2], aRu: f[3], sortOrder: i });

  const arts: [string, string, string, string][] = [
    ["how-mma-fighters-prepare", "training", "How an MMA fighter prepares", "Как готовится боец ММА"],
    ["water-loading-weight-cut", "weight-cut", "Water-loading weight cut", "Сгонка веса на воде"],
    ["acl-recovery-phases", "acl", "ACL recovery at home: phase by phase", "Восстановление ACL дома: по фазам"],
  ];
  for (const [i, [slug, file, tEn, tRu]] of arts.entries()) {
    await db.insert(articles).values({
      slug,
      titleEn: tEn,
      titleRu: tRu,
      excerptEn: read(`${file}.en.excerpt.txt`),
      excerptRu: read(`${file}.ru.excerpt.txt`),
      bodyEn: read(`${file}.en.md`),
      bodyRu: read(`${file}.ru.md`),
      categoryId: file === "acl" ? catIds.acl : file === "training" ? catIds.mma : null,
      sortOrder: i,
    });
  }

  for (const l of legal) await db.insert(legalPages).values(l);

  // Default weekly availability (coach time zone): Mon–Fri 10:00–18:00, Sat 10:00–13:00
  for (let wd = 1; wd <= 5; wd++) await db.insert(availability).values({ weekday: wd, startMin: 600, endMin: 1080 });
  await db.insert(availability).values({ weekday: 6, startMin: 600, endMin: 780 });

  const bioEn = `Maryna Moroz, known as the **"Iron Lady,"** is a Ukrainian professional mixed martial artist and UFC veteran with more than a decade of professional experience.

With a strong background in boxing, kickboxing and MMA, Maryna has represented Ukraine on the international stage and built her career around strength, discipline, technical skill and determination — including two Performance of the Night bonuses inside the UFC Octagon.

After two ACL reconstructions, Maryna began sharing her personal journey of training and building strength at home.

Today, she shares the exercises, techniques and training principles developed through years of professional combat sports.

**TRAIN WITH EXPERIENCE. TRAIN WITH DISCIPLINE. TRAIN WITH MARYNA.**`;
  const bioRu = `Марина Мороз, известная как **«Железная леди»**, — украинская профессиональная спортсменка в смешанных единоборствах и ветеран UFC с более чем десятилетним профессиональным опытом.

С сильной базой в боксе, кикбоксинге и ММА Марина представляла Украину на международной арене и построила карьеру на силе, дисциплине, технике и характере — включая два бонуса «Выступление вечера» в октагоне UFC.

После двух реконструкций передней крестообразной связки Марина начала делиться своим личным опытом тренировок и восстановления силы дома.

Сегодня она делится упражнениями, техникой и принципами тренировок, выработанными за годы профессионального спорта.

**ТРЕНИРУЙСЯ С ОПЫТОМ. ТРЕНИРУЙСЯ С ДИСЦИПЛИНОЙ. ТРЕНИРУЙСЯ С МАРИНОЙ.**`;
  await db.insert(settings).values({ key: "about", value: { photoId: null, bioEn, bioRu } }).onConflictDoNothing();

  console.log(`• Seeded ${CATEGORIES.length} categories, ${allPrograms.length} programs, products, FAQ, articles and legal drafts`);
}

(async () => {
  await seedAdmin();
  await seedContent();
  console.log("✓ Seed complete");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
