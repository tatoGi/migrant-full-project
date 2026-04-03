import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">გვერდი ვერ მოიძებნა</p>
        <Link href="/" className="text-primary underline hover:text-primary/90">
          მთავარ გვერდზე დაბრუნება
        </Link>
      </div>
    </div>
  );
}
