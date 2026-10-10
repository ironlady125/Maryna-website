import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <div className="display text-[8rem] leading-none text-accent">404</div>
        <p className="mt-4 text-lg text-muted">Page not found · Страница не найдена</p>
        <Link href="/" className="btn-primary mt-8">Home · Главная</Link>
      </div>
    </div>
  );
}
