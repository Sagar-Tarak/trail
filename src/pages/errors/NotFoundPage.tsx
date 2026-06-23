import { Link } from "react-router-dom";
import { ROUTES } from "@/router/routes";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gray-50 text-center">
      <p className="text-6xl font-bold text-gray-100">404</p>
      <p className="text-sm font-semibold text-gray-400">Page not found</p>
      <p className="text-xs text-gray-300">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to={ROUTES.DASHBOARD}
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
