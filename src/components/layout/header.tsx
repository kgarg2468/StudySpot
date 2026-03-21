import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-md border-b border-border">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          StudySpot
        </Link>
      </div>
    </header>
  );
}
