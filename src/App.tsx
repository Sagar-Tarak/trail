import { useState } from "react";
import { AppLayout } from "./components/layout";
import { DashboardPage } from "./pages/dashboard";
import { ActivitiesPage } from "./features/activities/page";
import { UsersFeaturePage } from "./features/users/page";

type Route = "/" | "/activities" | "/users" | "/records" | "/errors" | "/software";

const ROUTE_META: Record<Route, { title: string; content: React.ReactNode }> = {
  "/": { title: "Dashboard", content: <DashboardPage /> },
  "/activities": { title: "Activities", content: <ActivitiesPage /> },
  "/users": { title: "Users", content: <UsersFeaturePage /> },
  "/records": { title: "Records", content: <PlaceholderPage title="Records" /> },
  "/errors": { title: "Errors", content: <PlaceholderPage title="Errors" /> },
  "/software": { title: "Software", content: <PlaceholderPage title="Software" /> },
};

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-24 text-center">
      <svg className="mb-4 h-12 w-12 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <p className="text-sm font-semibold text-gray-400">{title}</p>
      <p className="mt-1 text-xs text-gray-300">Use MasterTablePage with a config to build this page.</p>
    </div>
  );
}

function App() {
  const [route, setRoute] = useState<Route>("/");
  const meta = ROUTE_META[route] ?? ROUTE_META["/"];

  return (
    <AppLayout title={meta.title} onNavigate={(href) => setRoute(href as Route)}>
      {meta.content}
    </AppLayout>
  );
}

export default App;
