import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center py-32">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4" style={{ color: "#2bb32a" }}>404</h1>
        <h2 className="text-2xl font-bold mb-2" style={{ color: "#111827" }}>Page Not Found</h2>
        <p className="mb-6" style={{ color: "#6b7280" }}>The page you're looking for doesn't exist or has been moved.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
          style={{ background: "#2bb32a" }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
