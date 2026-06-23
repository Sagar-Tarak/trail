import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PageSuspense } from "./PageSuspense";
import { ErrorPage } from "@/pages/errors/ErrorPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { PlaceholderPage } from "@/pages/placeholder/PlaceholderPage";
import { ROUTES } from "./routes";

// ---------------------------------------------------------------------------
// Lazy page bundles — each splits into its own chunk at the route boundary
// ---------------------------------------------------------------------------
const DashboardPage  = lazy(() => import("@/pages/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const ActivitiesPage = lazy(() => import("@/features/activities/page").then((m) => ({ default: m.ActivitiesPage })));
const UsersPage      = lazy(() => import("@/features/users/page").then((m) => ({ default: m.UsersPage })));
const LoginPage      = lazy(() => import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })));

// ---------------------------------------------------------------------------
// Route tree
//
//   /auth/*    unauthenticated shell — redirects to dashboard if already logged in
//   /          authenticated shell  — redirects to /auth/login if not logged in
//     ...app routes
//     *        404
// ---------------------------------------------------------------------------
export const router = createBrowserRouter([
  // -- Unauthenticated -------------------------------------------------------
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: ROUTES.LOGIN,
        element: <PageSuspense><LoginPage /></PageSuspense>,
      },
    ],
  },

  // -- Authenticated ---------------------------------------------------------
  {
    path: "/",
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <RootLayout />,
        children: [
          {
            index: true,
            element: <PageSuspense><DashboardPage /></PageSuspense>,
          },
          {
            path: ROUTES.ACTIVITIES,
            element: <PageSuspense><ActivitiesPage /></PageSuspense>,
          },
          {
            path: ROUTES.USERS,
            element: <PageSuspense><UsersPage /></PageSuspense>,
          },
          {
            path: ROUTES.RECORDS,
            element: <PlaceholderPage title="Records" />,
          },
          {
            path: ROUTES.ERRORS,
            element: <PlaceholderPage title="Errors" />,
          },
          {
            path: ROUTES.SOFTWARE,
            element: <PlaceholderPage title="Software" />,
          },
          {
            path: "*",
            element: <NotFoundPage />,
          },
        ],
      },
    ],
  },
]);
