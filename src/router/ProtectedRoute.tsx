import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Spin } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import { apiCheckToken } from "@/lib/auth/auth.api";
export function ProtectedRoute() {
  const token = useAuthStore((s) => s.tokens?.accessToken);
  const location = useLocation();
  const session = useQuery({
    queryKey: ["session", token],
    queryFn: apiCheckToken,
    enabled: !!token,
    retry: false,
    staleTime: 60_000,
  });
  if (!token)
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  if (session.isPending)
    return (
      <div className="p-12 text-center">
        <Spin tip="Checking session" />
      </div>
    );
  if (session.isError)
    return (
      <div className="p-12">
        <Alert
          type="error"
          message="Could not verify your session"
          description={session.error.message}
        />
        <Button onClick={() => session.refetch()}>Retry</Button>
        <Button onClick={() => useAuthStore.getState().clear()}>
          Return to sign in
        </Button>
      </div>
    );
  return <Outlet />;
}
