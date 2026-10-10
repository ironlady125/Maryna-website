import { cookies } from "next/headers";

export const ADMIN_LANG = "mm_admin_lang";

const en = {
  dashboard: "Dashboard", settings: "Settings & Brand", media: "Media Library", categories: "Categories", programs: "Programs",
  products: "Products & Prices", orders: "Orders", bookings: "Bookings & Schedule", users: "Users", reviews: "Reviews",
  achievements: "Achievements", articles: "Articles", faqs: "FAQ", legal: "Legal pages", emails: "Emails", translations: "Translations",
  viewSite: "View site", logout: "Log out", save: "Save", saved: "Saved ✓", add: "Add", new: "New", edit: "Edit", delete: "Delete",
  confirmDelete: "Delete permanently?", back: "Back", title: "Title", subtitle: "Subtitle", description: "Description", slug: "URL slug",
  published: "Published", featured: "Featured", sortHint: "Drag rows to reorder", missing: "missing", cover: "Cover image",
  choose: "Choose", remove: "Remove", upload: "Upload files", dropHere: "Drop photos or videos here, or click to choose",
  uploading: "Uploading…", status: "Status", actions: "Actions", search: "Search", none: "Nothing here yet.", price: "Price",
  level: "Level", equipment: "Equipment", weeks: "Weeks", free: "Free for everyone", preview: "Free preview", workouts: "Workouts",
  exercises: "Exercises", minutes: "Minutes", rounds: "Timer rounds (0 = no timer)", roundSec: "Round (sec)", restSec: "Rest (sec)",
  video: "Video", thumb: "Thumbnail", cues: "Technique cues (one per line)", dose: "Sets / rounds", category: "Category",
  trailer: "Trailer video", open: "Open", markPaid: "Mark paid", cancel: "Cancel", approve: "Approve", reject: "Reject",
  pending: "Pending", approved: "Approved", total: "Total", revenue: "Revenue", customers: "Customers", todo: "To do",
  translationMissing: "Missing translations", legalDraft: "Legal pages awaiting review", stripeOff: "Stripe is not configured — card payments run in test mode",
  contactsEmpty: "Add your contact details", unverifiedMedia: "Media with unverified rights (hidden on the site)",
  pendingAchievements: "Achievements awaiting your confirmation", pendingReviews: "Reviews awaiting moderation",
  pendingManual: "Manual payments to confirm", upcoming: "Upcoming sessions", language: "Admin language",
};
export type AdminDict = typeof en;

const ru: AdminDict = {
  dashboard: "Обзор", settings: "Настройки и бренд", media: "Медиатека", categories: "Категории", programs: "Программы",
  products: "Товары и цены", orders: "Заказы", bookings: "Записи и расписание", users: "Пользователи", reviews: "Отзывы",
  achievements: "Достижения", articles: "Статьи", faqs: "Вопросы и ответы", legal: "Юр. страницы", emails: "Письма", translations: "Переводы",
  viewSite: "Открыть сайт", logout: "Выйти", save: "Сохранить", saved: "Сохранено ✓", add: "Добавить", new: "Создать", edit: "Изменить", delete: "Удалить",
  confirmDelete: "Удалить безвозвратно?", back: "Назад", title: "Название", subtitle: "Подзаголовок", description: "Описание", slug: "Адрес (slug)",
  published: "Опубликовано", featured: "На главной", sortHint: "Перетаскивайте строки, чтобы изменить порядок", missing: "нет перевода", cover: "Обложка",
  choose: "Выбрать", remove: "Убрать", upload: "Загрузить файлы", dropHere: "Перетащите фото или видео сюда или нажмите, чтобы выбрать",
  uploading: "Загрузка…", status: "Статус", actions: "Действия", search: "Поиск", none: "Пока пусто.", price: "Цена",
  level: "Уровень", equipment: "Инвентарь", weeks: "Недель", free: "Бесплатно для всех", preview: "Бесплатный урок", workouts: "Тренировки",
  exercises: "Упражнения", minutes: "Минут", rounds: "Раундов таймера (0 — без таймера)", roundSec: "Раунд (сек)", restSec: "Отдых (сек)",
  video: "Видео", thumb: "Превью", cues: "Подсказки по технике (по одной в строке)", dose: "Подходы / раунды", category: "Категория",
  trailer: "Видео-трейлер", open: "Открыть", markPaid: "Отметить оплаченным", cancel: "Отменить", approve: "Одобрить", reject: "Отклонить",
  pending: "На проверке", approved: "Одобрено", total: "Всего", revenue: "Выручка", customers: "Клиенты", todo: "Нужно сделать",
  translationMissing: "Недостающие переводы", legalDraft: "Юр. страницы ждут проверки юристом", stripeOff: "Stripe не подключён — оплата картой работает в тестовом режиме",
  contactsEmpty: "Добавьте свои контакты", unverifiedMedia: "Медиа без подтверждённых прав (скрыты на сайте)",
  pendingAchievements: "Достижения ждут вашего подтверждения", pendingReviews: "Отзывы ждут модерации",
  pendingManual: "Ручные оплаты для подтверждения", upcoming: "Ближайшие занятия", language: "Язык админки",
};

export async function adminDict() {
  const l = (await cookies()).get(ADMIN_LANG)?.value === "ru" ? "ru" : "en";
  return { a: l === "ru" ? ru : en, lang: l as "en" | "ru" };
}
