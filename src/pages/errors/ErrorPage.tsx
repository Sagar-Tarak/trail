import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";

export function ErrorPage() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? `${error.status} — ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "An unexpected error occurred";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center">
      <p className="text-4xl font-bold text-gray-200">Oops</p>
      <p className="text-sm font-medium text-gray-500">{message}</p>
      <Link
        to="/"
        className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        Go home
      </Link>
    </div>
  );
}
