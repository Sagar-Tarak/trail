import { Outlet, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { ROUTES } from "@/router/routes";

/**
 * Shell for unauthenticated pages (/auth/*).
 * If the user is already logged in, bounce them straight to the dashboard.
 */
export function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Outlet />
    </div>
  );
}
