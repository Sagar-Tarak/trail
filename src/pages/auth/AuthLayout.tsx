import { Outlet, Navigate } from "react-router-dom";
import {
  AuditOutlined,
  DatabaseOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "@/store/useAuthStore";
import { PageSuspense } from "@/router/PageSuspense";
import { ROUTES } from "@/router/routes";

export function AuthLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[0.9fr_1.1fr]">
      <section className="auth-hero relative flex flex-col justify-between overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-12 lg:sticky lg:top-0 lg:h-screen lg:p-14">
        <div
          className="pointer-events-none absolute -right-24 top-24 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold">
            T
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Trio Trail
          </span>
        </div>
        <div className="auth-intro relative my-10 max-w-md lg:my-16">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
            Your company, every change
          </p>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Every action has a story.
            <br />
            <span className="text-indigo-300">Follow the trail.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-slate-400">
            See who changed what, understand the context, and trace your
            company’s records from one place.
          </p>
          <div className="mt-9 hidden space-y-6 lg:block">
            {[
              {
                icon: <DatabaseOutlined />,
                title: "Connect your company",
                text: "Capture changes from your PostgreSQL database.",
              },
              {
                icon: <AuditOutlined />,
                title: "Investigate with context",
                text: "Follow records, compare values, and explore transactions.",
              },
              {
                icon: <TeamOutlined />,
                title: "Bring your team",
                text: "Create company accounts and manage your sessions.",
              },
            ].map(({ icon, title, text }) => (
              <div key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-lg text-indigo-300">
                  {icon}
                </span>
                <div>
                  <h3 className="text-sm font-medium">{title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="relative hidden text-xs text-slate-500 lg:block">
          Company activity. Connected and clear.
        </p>
      </section>
      <main className="flex min-w-0 items-center justify-center px-4 py-8 sm:px-8 lg:py-12">
        <PageSuspense>
          <Outlet />
        </PageSuspense>
      </main>
    </div>
  );
}
