import { CaptureHealthPanel } from "./CaptureHealthPanel";
import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Switch,
  Radio,
  Tag,
  Table,
  Collapse,
} from "antd";
import {
  CheckCircleOutlined,
  DatabaseOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import "./capture.css";
import { CaptureTablePicker } from "./CaptureTablePicker";
import { PageShell } from "@/components/page";
import {
  getData,
  postData,
  type Data,
  type CaptureStatus,
  type CaptureSlot,
} from "./api";
import { formatTimestamp } from "./time";
import { Details, QueryState } from "./shared";

const captureSummaries = {
  checking: {
    title: "Checking capture status",
    description: "Loading your company's saved capture configuration.",
    color: "default",
    label: "Checking",
  },
  unavailable: {
    title: "Capture status unavailable",
    description: "Retry the status check before changing capture settings.",
    color: "default",
    label: "Unavailable",
  },
  error: {
    title: "Capture requires attention",
    description:
      "Review capture monitoring below before relying on incoming activity.",
    color: "red",
    label: "Needs attention",
  },
  lagging: {
    title: "Capture is running with a delay",
    description:
      "Review capture monitoring below before relying on incoming activity.",
    color: "orange",
    label: "Delayed",
  },
  active: {
    title: "Your database is capturing activity",
    description: "Open the timeline to follow incoming changes.",
    color: "green",
    label: "Active",
  },
  configured: {
    title: "Database configured",
    description:
      "Review installation and monitoring below before starting capture.",
    color: "blue",
    label: "Configured",
  },
  unconfigured: {
    title: "Let’s connect your database",
    description:
      "You’ll need your database connection details. Your database administrator can help.",
    color: "default",
    label: "Not connected",
  },
};
export function CapturePage() {
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const canManage = role === "ADMIN" || role === "SUPER_ADMIN";
  const [form] = Form.useForm();
  const hydratedSlot = useRef<string | undefined>(undefined);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<Data>();
  const [connectionResult, setConnectionResult] = useState<Data>();
  const [done, setDone] = useState("");
  const [appRoles, setAppRoles] = useState("");
  const [availableTables, setAvailableTables] = useState<string[]>();
  const selectedTables: string[] = Form.useWatch("tables", form) ?? [];
  const tableScope = Form.useWatch("tableScope", form) ?? "selected";
  const status = useQuery({
    queryKey: ["capture-status"],
    queryFn: ({ signal }) =>
      getData<CaptureStatus>("/auto-capture/status", undefined, signal),
  });
  useEffect(() => {
    if (!status.isSuccess) return;
    const slot = status.data.slots[0];
    if (!slot) {
      hydratedSlot.current = undefined;
      return;
    }
    if (!slot.connection || hydratedSlot.current === slot.id) return;
    form.setFieldsValue(
      Object.fromEntries(
        Object.entries(slot.connection).filter(
          ([field]) => !form.isFieldTouched(field),
        ),
      ),
    );
    hydratedSlot.current = slot.id;
  }, [form, status.data, status.isSuccess]);
  async function action(name: string, values: Data = {}) {
    setBusy(name);
    if (name === "test-connection") {
      setAvailableTables(undefined);
      setConnectionResult(undefined);
    }
    setError("");
    setResult(undefined);
    setDone("");
    try {
      const data = await postData(`/auto-capture/${name}`, values);
      if (name === "test-connection") {
        setAvailableTables(
          Array.isArray(data.availableTables)
            ? data.availableTables.filter(
                (table): table is string => typeof table === "string",
              )
            : [],
        );
        setConnectionResult(
          Object.fromEntries(
            Object.entries(data).filter(([key]) => key !== "availableTables"),
          ),
        );
      }
      setResult(
        Object.fromEntries(
          Object.entries(data).filter(([key]) => key !== "availableTables"),
        ),
      );
      setDone(name);
      if (name === "setup") {
        form.setFieldValue("password", "");
        setAvailableTables(undefined);
        setConnectionResult(undefined);
      }
      await status.refetch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      void queryClient.invalidateQueries({ queryKey: ["company-setup-trail"] });
      setBusy("");
    }
  }
  async function databaseAction(name: string) {
    try {
      const v = await form.validateFields(
        name === "test-connection"
          ? ["host", "port", "database", "username", "password", "ssl"]
          : undefined,
      );
      const { tables, tableScope: scope, ...credentials } = v;
      await action(name, {
        ...credentials,
        ...(name === "setup"
          ? {
              autoStart: false,
              ...(scope !== "all" ? { tablesToCapture: tables } : {}),
            }
          : {}),
      });
    } catch {
      /* Form displays validation errors. */
    }
  }
  const savedScope = status.data?.slots[0]?.tablesConfigured;
  const savedTables = Array.isArray(savedScope)
    ? savedScope.filter((table): table is string => typeof table === "string")
    : [];
  const configured = !!status.data?.configured;
  const streaming = status.data?.slots.some(
    (slot) => slot.status === "ACTIVE" || slot.status === "LAGGING",
  );
  const captureError = status.data?.slots.some(
    (slot) => slot.status === "ERROR",
  );
  const lagging = status.data?.slots.some((slot) => slot.status === "LAGGING");
  const summary =
    captureSummaries[
      status.isPending
        ? "checking"
        : status.isError
          ? "unavailable"
          : captureError
            ? "error"
            : lagging
              ? "lagging"
              : streaming
                ? "active"
                : configured
                  ? "configured"
                  : "unconfigured"
    ];
  const tested = availableTables !== undefined;
  const resultMessage = {
    setup: "Capture settings saved. Continue with outbox installation below.",
    "setup-outbox":
      "Outbox installed. Connect actor attribution in your application, then verify the installation.",
    "verify-outbox":
      "Outbox objects and publication verified. You can now activate capture and make an application change to check actor attribution.",
    activate:
      "Capture activated. Make a business change and check the activity timeline.",
    stop: "Capture stopped. You can resume it when you are ready.",
  }[done];
  return (
    <div className="capture-page">
      <PageShell
        title={
          canManage
            ? "Connect your company database"
            : "Database capture status"
        }
        subtitle="Connect PostgreSQL, choose your tables, then start following changes."
        actions={
          <Link to="/setup?step=2">
            <Button>
              Setup guide <ArrowRightOutlined />
            </Button>
          </Link>
        }
      >
        <section className="capture-summary" aria-label="Capture status">
          <div className="capture-summary-icon">
            <DatabaseOutlined />
          </div>
          <div className="capture-summary-copy">
            <strong>{summary.title}</strong>
            <p>{summary.description}</p>
          </div>
          <Tag color={summary.color}>{summary.label}</Tag>
        </section>
        <QueryState
          loading={status.isPending}
          error={status.error}
          retry={() => status.refetch()}
        />
        {error && <Alert type="error" showIcon message={error} />}
        {resultMessage && (
          <div className="capture-result">
            <Alert type="success" showIcon message={resultMessage} />
            {done === "activate" && (
              <Link to="/timeline">
                <Button>View company activity</Button>
              </Link>
            )}
            <Collapse
              items={[
                {
                  key: "result",
                  label: "View setup result",
                  children: <Details data={result} />,
                },
              ]}
            />
          </div>
        )}
        {!canManage && (
          <Alert
            type="info"
            showIcon
            message="Only company administrators can change database capture. You can review its status below."
          />
        )}
        {canManage && status.isSuccess && (
          <>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                port: 5432,
                ssl: true,
                tableScope:
                  configured && savedTables.length === 0 ? "all" : "selected",
                tables: savedTables,
              }}
              disabled={!!busy}
              className="capture-form"
              onValuesChange={(changed) => {
                if (
                  [
                    "host",
                    "port",
                    "database",
                    "username",
                    "password",
                    "ssl",
                  ].some((key) => key in changed)
                ) {
                  if (availableTables !== undefined)
                    form.setFieldValue("tables", []);
                  setAvailableTables(undefined);
                  setConnectionResult(undefined);
                  setDone("");
                  setResult(undefined);
                }
              }}
            >
              <Card
                className="capture-card"
                title={
                  <StepHeading
                    number={1}
                    title="Database connection"
                    description="Enter the connection details supplied by your administrator."
                    complete={tested || configured}
                  />
                }
              >
                <div className="capture-fields">
                  <Form.Item
                    name="host"
                    label="Host"
                    normalize={(value: string) => value.trim()}
                    rules={[{ required: true, whitespace: true, max: 255 }]}
                  >
                    <Input
                      placeholder="db.yourcompany.com"
                      autoComplete="off"
                    />
                  </Form.Item>
                  <Form.Item
                    name="port"
                    label="Port"
                    rules={[
                      { required: true, type: "integer", min: 1, max: 65535 },
                    ]}
                  >
                    <InputNumber
                      min={1}
                      max={65535}
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                  <Form.Item
                    name="database"
                    label="Database name"
                    normalize={(value: string) => value.trim()}
                    rules={[
                      { required: true, whitespace: true, max: 63 },
                      {
                        pattern: /^[A-Za-z_][A-Za-z0-9_]{0,62}$/,
                        message:
                          "Use letters, numbers and underscores, beginning with a letter or underscore.",
                      },
                    ]}
                  >
                    <Input
                      placeholder="company_operations"
                      autoComplete="off"
                    />
                  </Form.Item>
                  <Form.Item
                    name="username"
                    label="Database username"
                    normalize={(value: string) => value.trim()}
                    rules={[{ required: true, whitespace: true, max: 255 }]}
                  >
                    <Input placeholder="Database login" autoComplete="off" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Database password"
                    extra="Saved passwords are never displayed. Enter the database password again to test or save settings if your database requires one."
                    rules={[{ max: 255 }]}
                  >
                    <Input.Password
                      placeholder="Enter database password"
                      autoComplete="new-password"
                    />
                  </Form.Item>
                  <div className="capture-ssl">
                    <div>
                      <strong>Secure connection (SSL)</strong>
                      <p>
                        Validates the database certificate. Private CAs require
                        administrator setup.
                      </p>
                    </div>
                    <Form.Item name="ssl" valuePropName="checked">
                      <Switch aria-label="Use SSL" />
                    </Form.Item>
                  </div>
                </div>
                <div className="capture-footer">
                  <span className="capture-hint">
                    Testing checks access and loads table names.
                  </span>
                  <Button
                    onClick={() => databaseAction("test-connection")}
                    loading={busy === "test-connection"}
                    disabled={!!busy}
                  >
                    {tested ? "Test again" : "Test connection"}
                  </Button>
                </div>
                {tested && (
                  <div className="capture-connection-result">
                    <div className="capture-verified">
                      <CheckCircleOutlined />
                      <span>
                        Connection verified · {availableTables.length} tables
                        available
                      </span>
                    </div>
                    <Collapse
                      ghost
                      items={[
                        {
                          key: "connection",
                          label: "Connection details",
                          children: <Details data={connectionResult} />,
                        },
                      ]}
                    />
                  </div>
                )}
              </Card>
              <Card
                className="capture-card"
                title={
                  <StepHeading
                    number={2}
                    title="Choose tables to capture"
                    description="Select the business data you want to follow."
                    complete={configured}
                  />
                }
              >
                <div className="capture-table-section">
                  <Form.Item name="tableScope" className="capture-scope">
                    <Radio.Group aria-label="Capture scope">
                      <Radio value="selected">
                        <span className="capture-choice-title">
                          Specific tables
                        </span>
                        <span className="capture-choice-description">
                          Choose the tables your company needs.
                        </span>
                      </Radio>
                      <Radio value="all">
                        <span className="capture-choice-title">
                          All supported tables
                        </span>
                        <span className="capture-choice-description">
                          Capture every supported table.
                        </span>
                      </Radio>
                    </Radio.Group>
                  </Form.Item>
                  <div className="capture-table-label">
                    <label htmlFor="tables">Tables to capture</label>
                    <span>
                      {tableScope === "all"
                        ? "All tables"
                        : `${selectedTables.length} selected`}
                    </span>
                  </div>
                  <Form.Item
                    name="tables"
                    hidden={tableScope === "all"}
                    normalize={(values: string[]) => [
                      ...new Set(
                        values.map((table) => table.trim()).filter(Boolean),
                      ),
                    ]}
                    rules={[
                      {
                        validator: (_, values: string[] | undefined) => {
                          if (tableScope === "all") return Promise.resolve();
                          if (!values?.length)
                            return Promise.reject(
                              new Error("Select or enter at least one table"),
                            );
                          return values.every((table) =>
                            /^[A-Za-z_][A-Za-z0-9_-]{0,62}\.[A-Za-z_][A-Za-z0-9_-]{0,62}$/.test(
                              table,
                            ),
                          )
                            ? Promise.resolve()
                            : Promise.reject(
                                new Error("Use schema.table for each table"),
                              );
                        },
                      },
                    ]}
                  >
                    <CaptureTablePicker
                      savedTables={savedTables}
                      availableTables={availableTables}
                      disabled={!!busy}
                    />
                  </Form.Item>
                  {tableScope === "all" && (
                    <Alert
                      type="info"
                      showIcon
                      message="All supported tables will be captured"
                      description="Switch to Specific tables to review individual tables or exclude token storage."
                    />
                  )}
                </div>
                <div className="capture-footer">
                  <span className="capture-hint">
                    Next: install and verify capture before going live.
                  </span>
                  <Popconfirm
                    title="Configure replication on this database?"
                    description="Creates the replication slot and publication for capture."
                    onConfirm={() => databaseAction("setup")}
                  >
                    <Button
                      type="primary"
                      disabled={!!busy}
                      loading={busy === "setup"}
                    >
                      Configure capture <ArrowRightOutlined />
                    </Button>
                  </Popconfirm>
                </div>
              </Card>
            </Form>
            <Card
              className="capture-card"
              title={
                <StepHeading
                  number={3}
                  title="Install and activate"
                  description="Complete these steps after saving your capture settings."
                  complete={!!streaming}
                />
              }
            >
              {!configured && (
                <p className="capture-stage-note">
                  Connect your database and configure your tables above to
                  unlock these steps.
                </p>
              )}
              <p className="capture-stage-note">
                Your application developer also needs to connect actor
                attribution.{" "}
                <Link to="/sdk-setup" className="text-indigo-600 underline">
                  Open the SDK installation guide <ArrowRightOutlined />
                </Link>
              </p>
              <div className="capture-activation">
                <div className="capture-activation-row">
                  <div>
                    <strong>Install the outbox</strong>
                    <p>
                      Adds the objects needed to identify who made each change.
                    </p>
                    <label htmlFor="app-roles">
                      Application database roles <span>(optional)</span>
                    </label>
                    <Input
                      id="app-roles"
                      value={appRoles}
                      disabled={!!busy || !configured}
                      onChange={(event) => setAppRoles(event.target.value)}
                      placeholder="app_user, worker_user"
                    />
                  </div>
                  <Popconfirm
                    title="Install the outbox in your company database?"
                    onConfirm={() =>
                      action("setup-outbox", {
                        appRoles: appRoles
                          .split(",")
                          .map((role) => role.trim())
                          .filter(Boolean),
                      })
                    }
                  >
                    <Button
                      disabled={!!busy || !configured}
                      loading={busy === "setup-outbox"}
                    >
                      Install outbox
                    </Button>
                  </Popconfirm>
                </div>
                <div className="capture-activation-row">
                  <div>
                    <strong>Verify the installation</strong>
                    <p>
                      Confirm the outbox schema, function and publication are
                      installed. Make an application change afterward to check
                      actor attribution.
                    </p>
                  </div>
                  <Button
                    disabled={!!busy || !configured}
                    loading={busy === "verify-outbox"}
                    onClick={() => action("verify-outbox")}
                  >
                    Verify outbox
                  </Button>
                </div>
                <div className="capture-activation-row">
                  <div>
                    <strong>Start capturing changes</strong>
                    <p>
                      Activate streaming, then review your first event in the
                      timeline.
                    </p>
                  </div>
                  <Button
                    type="primary"
                    disabled={!!busy || !configured || !!streaming}
                    loading={busy === "activate"}
                    onClick={() => action("activate")}
                  >
                    {streaming ? "Capture active" : "Activate capture"}
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}
        {configured && <CaptureHealthPanel />}
        {configured && (
          <Card
            className="capture-card"
            title="Capture monitoring"
            extra={
              <Button
                onClick={() => status.refetch()}
                loading={status.isFetching}
              >
                Refresh status
              </Button>
            }
          >
            <div className="capture-monitoring">
              {status.data?.slots.some((slot) => slot.status === "ERROR") && (
                <Alert
                  type="error"
                  showIcon
                  message="Capture requires attention"
                  description="Review the slot status and last error before relying on captured activity."
                />
              )}
              <Table<CaptureSlot>
                rowKey="id"
                pagination={false}
                dataSource={status.data?.slots}
                scroll={{ x: 1100 }}
                columns={[
                  { title: "Slot", width: 320, dataIndex: "slotName" },
                  {
                    title: "Status",
                    width: 110,
                    dataIndex: "status",
                    render: (value: string) => (
                      <Tag
                        color={
                          value === "ACTIVE"
                            ? "green"
                            : value === "ERROR"
                              ? "red"
                              : "default"
                        }
                      >
                        {value}
                      </Tag>
                    ),
                  },
                  {
                    title: "Session events",
                    width: 120,
                    dataIndex: "eventsProcessed",
                  },
                  {
                    title: "Lag (seconds)",
                    width: 110,
                    dataIndex: "lagSeconds",
                  },
                  { title: "Errors", width: 90, dataIndex: "errorCount" },
                  {
                    title: "Last activity",
                    width: 220,
                    dataIndex: "lastActivity",
                    render: (value: string | null) =>
                      value ? formatTimestamp(value, timeZone) : "No activity",
                  },
                  {
                    title: "Last error",
                    dataIndex: "lastError",
                    render: (value: string | null) => value || "—",
                  },
                ]}
              />
              <Collapse
                items={[
                  {
                    key: "capture",
                    label: "Connection and processing details",
                    children: <Details data={status.data} />,
                  },
                ]}
              />
              {canManage && (
                <Popconfirm
                  title="Stop capture for this company?"
                  onConfirm={() => action("stop")}
                >
                  <Button danger disabled={!!busy} loading={busy === "stop"}>
                    Stop capture
                  </Button>
                </Popconfirm>
              )}
            </div>
          </Card>
        )}
      </PageShell>
    </div>
  );
}

function StepHeading({
  number,
  title,
  description,
  complete,
}: {
  number: number;
  title: string;
  description: string;
  complete: boolean;
}) {
  return (
    <div className="capture-step-heading">
      <span
        className={
          complete ? "capture-step-number complete" : "capture-step-number"
        }
      >
        {complete ? <CheckCircleOutlined /> : number}
      </span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
