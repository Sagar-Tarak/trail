import { CompanySetupTrail } from "./CompanySetupTrail";
import { useRef } from "react";
import { Alert, Button, Collapse, Descriptions, Select, Tag } from "antd";
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  BookOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { Link, Navigate, useLocation, useSearchParams } from "react-router-dom";
import { PageShell } from "@/components/page";
import { useAuthStore } from "@/store/useAuthStore";
import { setupGuide } from "./setupGuide";

export function SetupGuidePage() {
  const contentRef = useRef<HTMLElement>(null);
  const tenant = useAuthStore((state) => state.tenant);
  const [params, setParams] = useSearchParams();
  const stepParam = Number(params.get("step"));
  const current =
    Number.isInteger(stepParam) &&
    stepParam >= 1 &&
    stepParam <= setupGuide.length
      ? stepParam - 1
      : tenant
        ? 1
        : 0;
  const step = setupGuide[current];
  function selectStep(index: number) {
    setParams({ step: String(index + 1) });
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  return (
    <PageShell
      title="Company setup guide"
      subtitle="What to prepare, what to enter, and what to do next — from registration to your first audit trail."
      actions={
        <Link to={tenant ? "/software" : "/auth/sign-up"}>
          <Button type="primary">
            {tenant ? "Open database setup" : "Start company registration"}
          </Button>
        </Link>
      }
    >
      {tenant && params.get("welcome") === "1" && (
        <Alert
          type="success"
          showIcon
          message={`${tenant.company_name} is registered`}
          description="Your administrator account is ready. Next, collect the database details below and continue the setup with your database administrator."
        />
      )}
      {tenant && <CompanySetupTrail />}
      <div
        id="company-setup-instructions"
        className="scroll-mt-6 rounded-xl border border-indigo-100 bg-indigo-50/70 p-5"
      >
        <div className="flex gap-3">
          <BookOutlined className="mt-1 text-xl text-indigo-600" />
          <div>
            <h2 className="font-semibold text-slate-900">
              Start with your company details. Bring your database administrator
              for the connection.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              You can register with your name, work email, company name,
              industry, username and password. To capture activity, you will
              also need your PostgreSQL connection details and help from your
              application developer to identify who made each change.
            </p>
          </div>
        </div>
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside>
          <div className="xl:hidden">
            <label
              htmlFor="setup-step"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Choose a setup step
            </label>
            <Select
              id="setup-step"
              aria-label="Choose a setup step"
              value={current}
              onChange={selectStep}
              className="w-full"
              options={setupGuide.map((item, index) => ({
                value: index,
                label: `${index + 1}. ${item.title}`,
              }))}
            />
          </div>
          <nav
            aria-label="Company setup steps"
            className="hidden rounded-xl border border-slate-200 bg-white p-2 xl:block"
          >
            {setupGuide.map((item, index) => (
              <button
                key={item.title}
                onClick={() => selectStep(index)}
                aria-current={index === current ? "step" : undefined}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition ${index === current ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${index === current ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {index + 1}
                </span>
                <span className="pt-1 text-sm font-medium leading-snug">
                  {item.title}
                </span>
              </button>
            ))}
          </nav>
          <p className="mt-3 px-2 text-xs leading-relaxed text-slate-500">
            Select any step to preview the requirements. Use the action buttons
            to complete each step in its corresponding screen.
          </p>
          {tenant && (
            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">
                <CheckCircleOutlined /> Workspace registered
              </p>
              <p className="mt-1 break-words text-sm text-emerald-700">
                {tenant.company_name}
              </p>
              <p className="mt-1 text-xs text-emerald-700">{tenant.slug}</p>
            </div>
          )}
        </aside>
        <section
          ref={contentRef}
          aria-label={`Step ${current + 1}: ${step.title}`}
          className="min-w-0 scroll-mt-20 rounded-xl border border-slate-200 bg-white p-5 sm:p-7"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
            Step {current + 1} of {setupGuide.length}
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            {step.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {step.summary}
          </p>
          <p className="mt-4 text-sm text-slate-600">
            <strong className="text-slate-800">Who should help:</strong>{" "}
            {step.owner}
          </p>
          <h3 className="mb-3 mt-7 text-base font-semibold text-slate-800">
            Details to prepare
          </h3>
          <Descriptions
            bordered
            size="small"
            column={1}
            className="guide-fields [&_table]:table-fixed"
            styles={{
              label: {
                width: "32%",
                verticalAlign: "top",
                overflowWrap: "anywhere",
              },
              content: { overflowWrap: "anywhere" },
            }}
            items={step.fields.map((field) => ({
              key: field.name,
              label: (
                <span className="inline-block w-full break-words">
                  {field.name}
                </span>
              ),
              children: (
                <div className="space-y-2">
                  <Tag
                    style={{
                      maxWidth: "100%",
                      whiteSpace: "normal",
                      overflowWrap: "anywhere",
                    }}
                    color={
                      field.requirement.startsWith("Optional")
                        ? "default"
                        : "blue"
                    }
                  >
                    {field.requirement}
                  </Tag>
                  <p className="text-sm leading-relaxed text-slate-600">
                    {field.explanation}
                  </p>
                  {field.example && (
                    <p className="break-words text-xs text-slate-500">
                      Example:{" "}
                      <span className="font-mono text-slate-700">
                        {field.example}
                      </span>
                    </p>
                  )}
                </div>
              ),
            }))}
          />
          <h3 className="mb-3 mt-7 text-base font-semibold text-slate-800">
            What to do
          </h3>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-slate-600">
            {step.instructions.map((instruction) => (
              <li key={instruction} className="pl-1">
                {instruction}
              </li>
            ))}
          </ol>
          <div className="my-6 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
            <h3 className="text-sm font-semibold text-emerald-800">
              You are ready to continue when…
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              {step.outcome}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={current === 0 && tenant ? "/" : step.action.to}>
              <Button type="primary">
                {current === 0 && tenant
                  ? "View your company workspace"
                  : step.action.label}
              </Button>
            </Link>
            {current < setupGuide.length - 1 && (
              <Button onClick={() => selectStep(current + 1)}>
                Next step <ArrowRightOutlined />
              </Button>
            )}
            {current > 0 && (
              <Button onClick={() => selectStep(current - 1)}>
                <ArrowLeftOutlined /> Previous step
              </Button>
            )}
          </div>
        </section>
      </div>
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Need help moving forward?
        </h2>
        <Collapse
          items={[
            {
              key: "existing",
              label:
                "My company already has a workspace. Should I register again?",
              children: (
                <p>
                  Ask your company administrator to create your account under
                  Team & account. Sign in with those details so that you see the
                  existing company's trail.
                </p>
              ),
            },
            {
              key: "credentials",
              label:
                "I do not know the database host, password or permissions.",
              children: (
                <p>
                  Ask the person who manages your company's PostgreSQL database
                  or hosting account. Share the requirements in Step 2 with
                  them. Your Trio Trail sign-in password and your database
                  password are separate credentials.
                </p>
              ),
            },
            {
              key: "connection",
              label: "The connection test or setup fails.",
              children: (
                <p>
                  Read the result shown on Database. Check the host, port,
                  database name, login, SSL setting and network access from the
                  backend. Ask your database administrator to check replication
                  settings and the permissions needed for the setup operation.
                </p>
              ),
            },
            {
              key: "actors",
              label: "Changes appear, but I cannot identify the actor.",
              children: (
                <p>
                  Ask your application developer to check the SDK or outbox
                  integration. The actor identity must be recorded in the same
                  database transaction as the business change. Installing the
                  outbox alone does not supply application user identities.
                </p>
              ),
            },
            {
              key: "empty",
              label: "I cannot see any activity yet.",
              children: (
                <p>
                  Check capture status and errors on Database, confirm that the
                  selected table is included, and verify that a new authorised
                  change occurred while capture was active. In Activity
                  timeline, check the date range, selected filters and displayed
                  time zone.
                </p>
              ),
            },
          ]}
        />
      </section>
    </PageShell>
  );
}

export function PublicSetupGuidePage() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  if (authenticated)
    return <Navigate to={`/setup${location.search}${location.hash}`} replace />;
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link
            to="/getting-started"
            className="text-lg font-bold text-indigo-700"
          >
            Trio Trail
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth/login">
              <Button>Sign in</Button>
            </Link>
            <Link to="/auth/sign-up">
              <Button type="primary">Create workspace</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-8">
        <SetupGuidePage />
      </main>
    </div>
  );
}
