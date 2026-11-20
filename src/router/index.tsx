/* eslint-disable react-refresh/only-export-components -- Router configuration includes lazy page components. */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from "@/components/layout/RootLayout";
import { AuthLayout } from "@/pages/auth/AuthLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { PageSuspense } from "./PageSuspense";
import { ErrorPage } from "@/pages/errors/ErrorPage";
import { NotFoundPage } from "@/pages/errors/NotFoundPage";
import { ROUTES } from "./routes";

// ---------------------------------------------------------------------------
// Lazy page bundles — each splits into its own chunk at the route boundary
// ---------------------------------------------------------------------------
const LoginPage = lazy(() =>
  import("@/pages/auth/LoginPage").then((m) => ({ default: m.LoginPage })),
);

const SignupPage = lazy(() =>
  import("@/pages/auth/SignupPage").then((module) => ({
    default: module.SignupPage,
  })),
);
const OverviewPage = lazy(() =>
  import("@/features/company/OverviewPage").then((module) => ({
    default: module.OverviewPage,
  })),
);
const AuditPage = lazy(() =>
  import("@/features/company/AuditPage").then((module) => ({
    default: module.AuditPage,
  })),
);
const ReportsPage = lazy(() =>
  import("@/features/company/ReportsPage").then((module) => ({
    default: module.ReportsPage,
  })),
);
const RecordsPage = lazy(() =>
  import("@/features/company/AuditPage").then((module) => ({
    default: module.RecordsPage,
  })),
);
const TeamPage = lazy(() =>
  import("@/features/company/TeamPage").then((module) => ({
    default: module.TeamPage,
  })),
);
const TransactionsPage = lazy(() =>
  import("@/features/company/TransactionsPage").then((module) => ({
    default: module.TransactionsPage,
  })),
);
const ActivityDetailsPage = lazy(() =>
  import("@/features/company/ActivityDetailsPage").then((module) => ({
    default: module.ActivityDetailsPage,
  })),
);
const TransactionDetailsPage = lazy(() =>
  import("@/features/company/ActivityDetailsPage").then((module) => ({
    default: module.TransactionDetailsPage,
  })),
);
const TimelinePage = lazy(() =>
  import("@/features/company/TimelinePage").then((module) => ({
    default: module.TimelinePage,
  })),
);
const SetupGuidePage = lazy(() =>
  import("@/features/company/SetupGuidePage").then((module) => ({
    default: module.SetupGuidePage,
  })),
);
const PublicSetupGuidePage = lazy(() =>
  import("@/features/company/SetupGuidePage").then((module) => ({
    default: module.PublicSetupGuidePage,
  })),
);
const SdkGuidePage = lazy(() =>
  import("@/features/company/SdkGuidePage").then((module) => ({
    default: module.SdkGuidePage,
  })),
);
const PublicSdkGuidePage = lazy(() =>
  import("@/features/company/SdkGuidePage").then((module) => ({
    default: module.PublicSdkGuidePage,
  })),
);
const CapturePage = lazy(() =>
  import("@/features/company/CapturePage").then((module) => ({
    default: module.CapturePage,
  })),
);

// ---------------------------------------------------------------------------
// Route tree
//
//   /auth/*    unauthenticated shell — redirects to dashboard if already logged in
//   /          authenticated shell  — redirects to /auth/login if not logged in
//     ...app routes
//     *        404
// ---------------------------------------------------------------------------
export const router = createBrowserRouter([
  {
    path: "/sdk-guide",
    errorElement: <ErrorPage />,
    element: (
      <PageSuspense>
        <PublicSdkGuidePage />
      </PageSuspense>
    ),
  },
  {
    path: "/getting-started",
    errorElement: <ErrorPage />,
    element: (
      <PageSuspense>
        <PublicSetupGuidePage />
      </PageSuspense>
    ),
  },
  // -- Unauthenticated -------------------------------------------------------
  {
    element: <AuthLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: "/auth/sign-up", element: <SignupPage /> },
      {
        path: ROUTES.LOGIN,
        element: (
          <PageSuspense>
            <LoginPage />
          </PageSuspense>
        ),
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
            element: (
              <PageSuspense>
                <OverviewPage />
              </PageSuspense>
            ),
          },
          {
            path: ROUTES.ACTIVITIES,
            element: (
              <PageSuspense>
                <AuditPage key="all" />
              </PageSuspense>
            ),
          },
          {
            path: ROUTES.USERS,
            element: (
              <PageSuspense>
                <TeamPage />
              </PageSuspense>
            ),
          },
          { path: ROUTES.SDK, element: <SdkGuidePage /> },
          { path: ROUTES.SETUP, element: <SetupGuidePage /> },
          { path: ROUTES.TIMELINE, element: <TimelinePage /> },
          { path: "/activities/:eventId", element: <ActivityDetailsPage /> },
          {
            path: "/transactions/:groupId",
            element: <TransactionDetailsPage />,
          },
          { path: ROUTES.REPORTS, element: <ReportsPage /> },
          { path: ROUTES.TRANSACTIONS, element: <TransactionsPage /> },
          {
            path: ROUTES.RECORDS,
            element: <RecordsPage />,
          },
          {
            path: ROUTES.ERRORS,
            element: <AuditPage key="errors" errorsOnly />,
          },
          {
            path: ROUTES.SOFTWARE,
            element: <CapturePage />,
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
