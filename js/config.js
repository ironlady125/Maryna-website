/*
 * ===================================================================
 *  НАСТРОЙКИ САЙТА / SITE SETTINGS
 *  Меняйте здесь цены, контакты, способы оплаты и услуги.
 *  Тексты каждой услуги заданы на двух языках: ru и en.
 * ===================================================================
 */
window.SITE_CONFIG = {
  // Контакты. Пустая строка "" — канал скрывается.
  contacts: {
    email: "",            // "coach@marynamoroz.com"
    telegram: "",         // ник без @
    whatsapp: "",         // только цифры: 15551234567
    instagram: "",        // ник без @
  },

  // Необязательно: адрес формы (Formspree и т.п.) — заявки будут приходить на почту.
  formEndpoint: "",

  currency: "$",

  /*
   * СПОСОБЫ ОПЛАТЫ
   * enabled: false — способ полностью скрывается.
   * Если способ включён, но реквизиты пустые, клиент увидит его в списке
   * и получит подсказку «реквизиты пришлю лично».
   */
  payments: {
    // Банковская карта (Visa / Mastercard / Amex) + Apple Pay + Google Pay.
    // Работает через Stripe Payment Link — укажите paymentLink у каждой услуги ниже.
    card: { enabled: true },
    // PayPal.me: ник из ссылки paypal.me/ВАШ_НИК
    paypal: { enabled: true, username: "" },
    // Zelle: email или телефон, привязанный к Zelle, и имя получателя
    zelle: { enabled: true, recipient: "", name: "" },
    // Venmo: ник без @
    venmo: { enabled: true, username: "" },
    // Cash App: $cashtag без знака $
    cashapp: { enabled: true, cashtag: "" },
    // Wise: email аккаунта Wise
    wise: { enabled: true, email: "" },
    // Monobank: ссылка на банку, например https://send.monobank.ua/jar/XXXX
    monobank: { enabled: true, jarLink: "" },
    // Криптовалюта
    crypto: { enabled: true, network: "USDT (TRC-20)", address: "" },
  },

  /*
   * УСЛУГИ
   * category: training | consult | video | acl
   * paymentLink — ссылка Stripe Payment Link для оплаты картой / Apple Pay / Google Pay.
   */
  products: [
    // ---------- Тренировки ----------
    {
      id: "online-training", category: "training", price: 39, paymentLink: "",
      ru: {
        title: "Онлайн-тренировка", unit: "60 минут · видеосвязь",
        description: "Тренировка в прямом эфире: ударная техника, бой с тенью, мешок, ОФП — с моими поправками в реальном времени.",
        features: ["Техника ударов руками и ногами", "Комбинации и работа ног", "Кондиционные блоки", "Для любого уровня"],
      },
      en: {
        title: "Live Online Session", unit: "60 min · video call",
        description: "A live session: striking technique, shadowboxing, bag work and conditioning — with my corrections in real time.",
        features: ["Punching and kicking technique", "Combinations and footwork", "Conditioning blocks", "All levels welcome"],
      },
    },
    {
      id: "pack-8", category: "training", price: 249, paymentLink: "",
      ru: {
        title: "Пакет «Железная форма»", unit: "8 тренировок · 4 недели", tag: "Выгодно",
        description: "Месяц системной работы: 8 онлайн-тренировок, план питания и связь со мной между занятиями.",
        features: ["8 персональных онлайн-тренировок", "План на 4 недели", "Рекомендации по питанию", "Связь в чате"],
      },
      en: {
        title: "“Iron Shape” Pack", unit: "8 sessions · 4 weeks", tag: "Best value",
        description: "A month of structured work: 8 live sessions, a nutrition plan and chat support between sessions.",
        features: ["8 personal live sessions", "4-week plan", "Nutrition guidance", "Chat support"],
      },
    },
    {
      id: "fight-camp", category: "training", price: 99, paymentLink: "",
      ru: {
        title: "Программа «Fight Camp»", unit: "8 недель · программа",
        description: "Полная программа подготовки к бою: периодизация, сила, выносливость, техника, восстановление.",
        features: ["Расписание на каждый день", "Силовая и функциональная", "Технические и спарринговые блоки", "Пик формы ко дню боя"],
      },
      en: {
        title: "“Fight Camp” Program", unit: "8 weeks · program",
        description: "A complete fight preparation program: periodization, strength, conditioning, technique and recovery.",
        features: ["Day-by-day schedule", "Strength & conditioning", "Technical and sparring blocks", "Peak on fight day"],
      },
    },

    // ---------- Консультации ----------
    {
      id: "consult", category: "consult", price: 49, paymentLink: "",
      ru: {
        title: "Консультация 1-на-1", unit: "60 минут · Zoom", tag: "Хит",
        description: "Личный видеозвонок: разберём цель, форму, ошибки и составим план действий.",
        features: ["Разбор целей и уровня", "Ответы на любые вопросы о ММА", "Персональные рекомендации", "Запись звонка"],
      },
      en: {
        title: "1-on-1 Consultation", unit: "60 min · Zoom", tag: "Popular",
        description: "A personal video call: we review your goals, current shape and mistakes, and build an action plan.",
        features: ["Goals and level review", "Ask me anything about MMA", "Personal recommendations", "Call recording"],
      },
    },
    {
      id: "weight-consult", category: "consult", price: 35, paymentLink: "",
      ru: {
        title: "Консультация по сгонке веса", unit: "45 минут · Zoom",
        description: "Рассчитаем безопасную сгонку под ваш вес, категорию и дату взвешивания.",
        features: ["Расчёт сгонки", "Протокол воды и соли", "План восстановления после весов", "Ответы на вопросы"],
      },
      en: {
        title: "Weight Cut Consultation", unit: "45 min · Zoom",
        description: "We calculate a safe cut for your weight, division and weigh-in date.",
        features: ["Cut calculation", "Water & sodium protocol", "Post weigh-in rehydration plan", "Q&A"],
      },
    },
    {
      id: "weight-cut", category: "consult", price: 119, paymentLink: "",
      ru: {
        title: "Сопровождение сгонки веса", unit: "2 недели до взвешивания", tag: "Для бойцов",
        description: "Индивидуальный протокол «загрузки водой», питание и ежедневный контроль до весов и после.",
        features: ["Индивидуальный протокол", "Ежедневная связь", "Контроль самочувствия", "Восстановление к бою"],
      },
      en: {
        title: "Full Weight Cut Coaching", unit: "2 weeks to weigh-in", tag: "For fighters",
        description: "A personal water-loading protocol, nutrition and daily check-ins through weigh-in and rehydration.",
        features: ["Personal protocol", "Daily check-ins", "Wellbeing monitoring", "Rehydration for fight day"],
      },
    },
    {
      id: "video-review", category: "consult", price: 29, paymentLink: "",
      ru: {
        title: "Разбор боя / спарринга", unit: "видео-анализ",
        description: "Пришлите видео — я разберу ошибки и сильные стороны и дам план работы.",
        features: ["Разбор по раундам", "Ошибки в защите и атаке", "Тактические советы", "Ответ за 3 дня"],
      },
      en: {
        title: "Fight / Sparring Breakdown", unit: "video analysis",
        description: "Send me your footage — I’ll break down mistakes and strengths and give you a plan.",
        features: ["Round-by-round review", "Defense and offense errors", "Tactical advice", "Reply within 3 days"],
      },
    },

    // ---------- Видеотренировки ----------
    {
      id: "video-pack", category: "video", price: 29, paymentLink: "",
      ru: {
        title: "Набор видеотренировок «Ударка»", unit: "12 видео · доступ навсегда", tag: "Новинка",
        description: "Записанные тренировки, которые можно делать дома в любое время: стойка, удары, комбинации, защита.",
        features: ["12 видеоуроков", "Тренировки по 20–40 минут", "Без инвентаря или с мешком", "Доступ навсегда"],
      },
      en: {
        title: "“Striking” Video Pack", unit: "12 videos · lifetime access", tag: "New",
        description: "Recorded workouts you can do at home any time: stance, strikes, combinations, defense.",
        features: ["12 video lessons", "20–40 minute workouts", "No equipment or with a bag", "Lifetime access"],
      },
    },
    {
      id: "video-conditioning", category: "video", price: 19, paymentLink: "",
      ru: {
        title: "Видеокурс «Кардио бойца»", unit: "8 видео · доступ навсегда",
        description: "Кондиционные тренировки в формате раундов 5×5 — выносливость, как у бойца UFC.",
        features: ["8 тренировок-раундов", "Дома, без зала", "Сжигание жира", "Для всех уровней"],
      },
      en: {
        title: "“Fighter Cardio” Course", unit: "8 videos · lifetime access",
        description: "Round-based conditioning workouts — build a gas tank like a UFC fighter.",
        features: ["8 round-based workouts", "At home, no gym", "Fat burning", "All levels"],
      },
    },

    // ---------- Восстановление ACL ----------
    {
      id: "acl-session", category: "acl", price: 45, paymentLink: "",
      ru: {
        title: "Видеосессия с физиотерапевтом", unit: "45 минут · ACL",
        description: "Онлайн-осмотр движений, оценка этапа восстановления после травмы или операции ACL и упражнения на дом.",
        features: ["Оценка фазы восстановления", "Проверка техники упражнений", "Индивидуальная программа", "Ответы на вопросы"],
      },
      en: {
        title: "Physio Video Session", unit: "45 min · ACL",
        description: "Online movement assessment, ACL injury or surgery recovery stage check and a home exercise plan.",
        features: ["Recovery phase assessment", "Exercise technique check", "Personal program", "Q&A"],
      },
    },
    {
      id: "acl-course", category: "acl", price: 59, paymentLink: "",
      ru: {
        title: "Видеокурс «ACL дома»", unit: "4 фазы · 30+ видео",
        description: "Пошаговая видео-программа восстановления колена дома: от первых дней до возвращения к бегу и тренировкам.",
        features: ["Упражнения для каждой фазы", "Критерии перехода между фазами", "Минимум инвентаря", "Доступ навсегда"],
      },
      en: {
        title: "“ACL at Home” Video Course", unit: "4 phases · 30+ videos",
        description: "A step-by-step home video program for knee recovery: from the first days to running and training again.",
        features: ["Exercises for every phase", "Progression criteria", "Minimal equipment", "Lifetime access"],
      },
    },
    {
      id: "acl-pack", category: "acl", price: 299, paymentLink: "",
      ru: {
        title: "Сопровождение ACL с физиотерапевтом", unit: "8 видеосессий · 8 недель", tag: "Полный курс",
        description: "Восемь онлайн-сессий с физиотерапевтом, программа на каждую неделю и мои тренировки на этапе возвращения в спорт.",
        features: ["8 сессий с физиотерапевтом", "Еженедельная программа", "Контроль прогресса", "Возвращение в спорт"],
      },
      en: {
        title: "ACL Rehab Coaching with Physio", unit: "8 video sessions · 8 weeks", tag: "Full program",
        description: "Eight online sessions with a physiotherapist, a weekly program, and my training for the return-to-sport stage.",
        features: ["8 physio sessions", "Weekly program", "Progress tracking", "Return to sport"],
      },
    },
  ],
};
