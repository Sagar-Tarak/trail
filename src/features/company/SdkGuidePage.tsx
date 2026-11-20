import { useState } from "react";
import { Alert, Button, Collapse, Table, Tabs, Tag, Typography } from "antd";
import { Link, Navigate, useLocation } from "react-router-dom";
import { CodeOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { PageShell } from "@/components/page";
import { useAuthStore } from "@/store/useAuthStore";
import {
  sdkBuild,
  sdkFrameworks,
  sdkInstall,
  sdkJobs,
  sdkPrisma,
  sdkTransaction,
} from "./sdkGuide";
import "./sdk-guide.css";

function CodeExample({ title, code }: { title: string; code: string }) {
  return (
    <div className="sdk-code">
      <div className="sdk-code-header">
        <span>{title}</span>
        <Typography.Text copyable={{ text: code }}>Copy</Typography.Text>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}
function GuideSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="sdk-section" id={`sdk-step-${number}`}>
      <header>
        <span>{number}</span>
        <h2>{title}</h2>
      </header>
      <div className="sdk-section-body">{children}</div>
    </section>
  );
}
export function SdkGuidePage() {
  const [framework, setFramework] = useState("express");
  return (
    <div className="sdk-guide">
      <PageShell
        title="Install the Trio Trail SDK"
        subtitle="A developer’s guide to connecting application users, transactions and background jobs to your audit trail."
        actions={
          <Link to="/software">
            <Button>
              Database setup <ArrowRightOutlined />
            </Button>
          </Link>
        }
      >
        <div className="sdk-intro">
          <div className="sdk-intro-icon">
            <CodeOutlined />
          </div>
          <div>
            <Tag color="blue">SDK 0.0.0 · unpublished</Tag>
            <h2>Know who made every application change</h2>
            <p>
              The SDK attaches actor context to writes in your company’s
              PostgreSQL database. Trio Trail’s capture service reads those
              changes and links them to the audit timeline.
            </p>
          </div>
        </div>
        <nav className="sdk-navigation" aria-label="SDK installation steps">
          {[
            "Prepare",
            "Install",
            "Wrap Prisma",
            "Add actors",
            "Background jobs",
            "Verify",
          ].map((title, i) => (
            <a key={title} href={`#sdk-step-${i + 1}`}>
              <span>{i + 1}</span>
              {title}
            </a>
          ))}
        </nav>
        <GuideSection number={1} title="Prepare your application and database">
          <p>
            Install this SDK in the Node.js backend that writes your business
            data. The current integration uses Prisma Client 5 or later and
            PostgreSQL through <code>pg</code> 8 or later. It does not run in
            the browser or automatically integrate with other ORMs.
          </p>
          <ul>
            <li>
              Keep your application’s Prisma CLI and generated client on
              matching versions. Start with an existing, working Prisma
              connection.
            </li>
            <li>
              In <Link to="/software">Database setup</Link>, test the
              connection, choose tables and configure capture.
            </li>
            <li>
              Install the outbox using the application’s actual database role
              under Application database roles. This grants the role access to
              write attribution.
            </li>
            <li>
              The application and capture configuration must point to the same
              source database. Ask your database administrator to confirm
              replication and network access.
            </li>
          </ul>
          <Alert
            type="info"
            showIcon
            message="No API key is required for normal SDK attribution"
            description="The current SDK writes to triotrail.outbox inside the business transaction. Capture still needs to be configured, verified and activated separately. Installing the package alone does not start streaming."
          />
        </GuideSection>
        <GuideSection number={2} title="Install the versioned SDK package">
          <p>
            Generate the SDK package or get its archive from your Trio Trail
            administrator and place it in your application’s{" "}
            <code>vendor/</code> folder. The command below uses version 0.0.0;
            use the exact filename supplied to you. Public npm availability is
            not assumed.
          </p>
          <CodeExample
            title="Application backend · terminal"
            code={sdkInstall}
          />
          <p>
            For npm, use{" "}
            <code>npm install ./vendor/triotrail-sdk-0.0.0.tgz pg</code> and{" "}
            <code>npx prisma generate</code>. Commit the package reference and
            lockfile, and make the archive available to your deployment build.
          </p>
          <Collapse
            items={[
              {
                key: "build",
                label:
                  "For administrators: build a release from this repository",
                children: (
                  <CodeExample
                    title="Repository workspace · terminal"
                    code={sdkBuild}
                  />
                ),
              },
            ]}
          />
        </GuideSection>
        <GuideSection number={3} title="Wrap your shared Prisma client">
          <p>
            Wrap the client once where your application creates it, then use
            that exported instance in every service that writes data. If your
            existing Prisma client needs an adapter or other options, keep that
            initialization and pass the resulting client to the wrapper.
          </p>
          <CodeExample title="Application backend · db.ts" code={sdkPrisma} />
          <p>
            Missing actor context does not block application writes. The trail
            records that context was not provided and does not invent a user.
            The legacy <code>strictActor</code> setting does not change this
            behaviour. Write through a caller-owned callback transaction for
            actor attribution. Root calls and native array batches remain
            captured without an SDK actor declaration; the wrapper does not open
            hidden transactions. Audit metadata errors are isolated and logged;
            business and connection errors still propagate.
          </p>
        </GuideSection>
        <GuideSection number={4} title="Attach the authenticated actor">
          <p>
            Choose your framework. Adapt the user field to your authentication
            system; always take the identity from trusted authentication. Your
            application’s user ID becomes the external actor ID in Trio Trail.
          </p>
          <Tabs
            activeKey={framework}
            onChange={setFramework}
            items={Object.entries(sdkFrameworks).map(([key, example]) => ({
              key,
              label: example.label,
              children: (
                <CodeExample
                  title={`${example.label} · application bootstrap`}
                  code={example.code}
                />
              ),
            }))}
          />
          <Table
            size="small"
            rowKey="field"
            pagination={false}
            scroll={{ x: 480 }}
            dataSource={[
              {
                field: "actorId",
                meaning:
                  "Required: your authenticated user or service identifier.",
              },
              {
                field: "actorType",
                meaning:
                  "user, service, cron, api_key or system. Defaults to user.",
              },
              {
                field: "requestId",
                meaning: "Optional request/trace ID for correlating changes.",
              },
              {
                field: "reason",
                meaning:
                  "Optional business operation, such as createOrder; displayed as the operation name.",
              },
              {
                field: "context",
                meaning:
                  "Optional metadata. Avoid passwords, access tokens and other secrets.",
              },
            ]}
            columns={[
              { title: "Actor field", dataIndex: "field" },
              { title: "What to provide", dataIndex: "meaning" },
            ]}
          />
          <Collapse
            items={[
              {
                key: "transaction",
                label: "Group multiple writes as one business transaction",
                children: (
                  <div className="sdk-stack">
                    <p>
                      Use the wrapped client’s transaction and write through its
                      transaction client. The SDK records actor attribution in
                      the same transaction as your business changes. The example
                      assumes Order and OrderItem models; replace them with your
                      own schema and trusted user/request variables.
                    </p>
                    <CodeExample
                      title="Application service · example"
                      code={sdkTransaction}
                    />
                  </div>
                ),
              },
            ]}
          />
        </GuideSection>
        <GuideSection number={5} title="Include scheduled jobs and workers">
          <p>
            HTTP middleware does not cover background work. Wrap each scheduled
            job or queue callback so its writes have a stable service identity.
          </p>
          <CodeExample title="Application backend · jobs.ts" code={sdkJobs} />
          <p>
            Use the wrapped Prisma client inside each callback. For custom
            workflows you can use <code>withActor</code> directly with a stable{" "}
            <code>actorId</code> and <code>actorType: "service"</code>.
          </p>
        </GuideSection>
        <GuideSection number={6} title="Verify your first attributed change">
          <ol>
            <li>
              Restart your application with the SDK integration and installed
              outbox.
            </li>
            <li>
              In Database setup, select Verify outbox, then Activate capture.
              Check that capture reports an active status without errors.
            </li>
            <li>
              Sign in to your source application as a known test user. Create,
              update and delete a disposable test record in a selected table.
              Note its ID and the time of each action.
            </li>
            <li>
              Open Activity timeline and filter by table and time. Check the
              actor ID, operation and exact timestamp against your source
              application.
            </li>
            <li>
              Open See changes to compare values, then follow the record’s
              history. A multi-write transaction should have related events in
              its transaction view.
            </li>
          </ol>
          <div className="sdk-actions">
            <Link to="/software">
              <Button>Verify database setup</Button>
            </Link>
            <Link to="/timeline">
              <Button type="primary">
                Open activity timeline <ArrowRightOutlined />
              </Button>
            </Link>
          </div>
          <p className="sdk-note">
            This guide is documentation, not an installation check. A displayed
            example or completed package install does not confirm that your
            application’s writes are being captured.
          </p>
        </GuideSection>
        <section className="sdk-troubleshooting">
          <h2>Troubleshooting</h2>
          <Collapse
            items={[
              {
                key: "function",
                label: "triotrail.actor does not exist",
                children: (
                  <p>
                    Install the outbox on the same source database used by your
                    application. Check the application DATABASE_URL and the
                    company capture connection.
                  </p>
                ),
              },
              {
                key: "permissions",
                label: "Permission denied for triotrail or outbox",
                children: (
                  <p>
                    Ask your administrator to include the application’s database
                    role in Application database roles and run Install outbox.
                    The role needs the installer’s schema, function, outbox and
                    sequence grants.
                  </p>
                ),
              },
              {
                key: "actor",
                label: "Actor is unknown or a change is marked DIRECT_DB",
                children: (
                  <p>
                    Check that authentication runs before actor extraction, that
                    all write services use the wrapped client, and that
                    background callbacks have their own context. Missing outbox
                    attribution can mark a change DIRECT_DB; this alone does not
                    prove that a human used a SQL console.
                  </p>
                ),
              },
              {
                key: "empty",
                label: "No events appear in the timeline",
                children: (
                  <p>
                    Check the selected table, publication, outbox verification,
                    active capture status and backend errors. Make a new change
                    after activation and confirm the date range and time zone.
                    The SDK does not backfill old writes.
                  </p>
                ),
              },
              {
                key: "diff",
                label: "Before values are incomplete",
                children: (
                  <p>
                    Ask your database administrator to review the table’s
                    replica identity. UPDATE events may have only partial
                    previous values without REPLICA IDENTITY FULL. Use the
                    comparison-quality flag shown in event details.
                  </p>
                ),
              },
              {
                key: "ssl",
                label: "The database requires certificate-based SSL",
                children: (
                  <p>
                    The company form controls SSL on/off. Trio Trail validates
                    the database server certificate. For a private CA, your
                    administrator can configure the backend’s trusted CA bundle
                    using TRIO_CUSTOMER_CA_PEM. Client certificates for mutual
                    TLS require separate support. SDK installation does not
                    change your application’s own database TLS settings.
                  </p>
                ),
              },
            ]}
          />
        </section>
      </PageShell>
    </div>
  );
}
export function PublicSdkGuidePage() {
  const authenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();
  if (authenticated)
    return (
      <Navigate to={`/sdk-setup${location.search}${location.hash}`} replace />
    );
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white p-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <Link to="/getting-started" className="font-semibold text-indigo-700">
            Trio Trail · Developer guide
          </Link>
          <Link to="/auth/login">
            <Button>Sign in</Button>
          </Link>
        </div>
      </header>
      <main className="p-4 sm:p-8">
        <SdkGuidePage />
      </main>
    </div>
  );
}
