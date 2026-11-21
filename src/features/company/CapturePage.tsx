import { ContextMessageSettings } from "./ContextMessageSettings";
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
  const [readingCa, setReadingCa] = useState(false);
  const sslEnabled = Form.useWatch("ssl", form) ?? true;
  const sslTrust = Form.useWatch("sslTrust", form) ?? "system";
  const editedEndpoint = Form.useWatch(
    (values) =>
      JSON.stringify([
        values.host,
        values.port,
        values.database,
        values.username,
        values.password || "",
      ]),
    form,
  );
  const [error, setError] = useState("");
  const [result, setResult] = useState<Data>();
  const [connectionResult, setConnectionResult] = useState<Data>();
  const [done, setDone] = useState("");
  const [appRoles, setAppRoles] = useState("");
  const [availableTables, setAvailableTables] = useState<string[]>();
  const selectedTables: string[] = Form.useWatch("tables", form) ?? [];
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
      setDone(name.startsWith("ssl/") ? "ssl" : name);
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
          ? [
              "host",
              "port",
              "database",
              "username",
              "password",
              "ssl",
              "sslCa",
              "sslTrust",
            ]
          : undefined,
      );
      const { tables, sslCa, sslTrust: trust, ...credentials } = v;
      await action(name, {
        ...credentials,
        ...(trust === "legacy"
          ? {}
          : { sslCa: credentials.ssl && trust === "custom" ? sslCa : null }),
        ...(name === "setup"
          ? {
              autoStart: false,
              tablesToCapture: tables,
            }
          : {}),
      });
    } catch {
      /* Form displays validation errors. */
    }
  }
  const savedSlot = status.data?.slots[0];
  const savedConnection = savedSlot?.connection;
  const unchangedEndpoint =
    editedEndpoint ===
    JSON.stringify([
      savedConnection?.host,
      savedConnection?.port,
      savedConnection?.database,
      savedConnection?.username,
      "",
    ]);
  async function saveSslSettings() {
    if (!savedSlot || !unchangedEndpoint) return;
    try {
      const values = await form.validateFields(["ssl", "sslCa", "sslTrust"]);
      await action(`ssl/${encodeURIComponent(savedSlot.id)}`, {
        ssl: true,
        ...(values.sslTrust === "legacy"
          ? {}
          : { sslCa: values.sslTrust === "custom" ? values.sslCa : null }),
      });
    } catch {
      /* The form shows validation errors. */
    }
  }
  async function readCaFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 65536) {
      form.setFields([
        { name: "sslCa", errors: ["Choose a PEM CA bundle up to 64 KiB"] },
      ]);
      return;
    }
    setReadingCa(true);
    try {
      const contents = await file.text();
      form.setFieldValue("sslCa", contents);
      form.setFields([{ name: "sslCa", errors: [] }]);
      setAvailableTables(undefined);
      setConnectionResult(undefined);
      setDone("");
      setResult(undefined);
    } catch {
      form.setFields([
        { name: "sslCa", errors: ["The certificate file could not be read"] },
      ]);
    } finally {
      setReadingCa(false);
    }
  }
  const savedScope =
    status.data?.slots[0]?.captureScope?.selectedTables ??
    status.data?.slots[0]?.tablesConfigured;
  const savedTables = Array.isArray(savedScope)
    ? savedScope.filter(
        (table): table is string =>
          typeof table === "string" &&
          table !== "triotrail.outbox" &&
          /^[A-Za-z_][A-Za-z0-9_-]{0,62}\.[A-Za-z_][A-Za-z0-9_-]{0,62}$/.test(
            table,
          ),
      )
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
    ssl: "SSL trust settings saved and the saved database connection tested. Running capture uses the new trust on its next connection.",
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
                manageReplicaIdentity: true,
                port: 5432,
                ssl: true,
                sslTrust: "system",
                sslCa: "",
                tables: savedTables,
              }}
              disabled={!!busy || readingCa}
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
                    "sslCa",
                    "sslTrust",
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
                        Verifies the database certificate and hostname. Use the
                        certificate’s DNS hostname when connecting.
                      </p>
                    </div>
                    <Form.Item name="ssl" valuePropName="checked">
                      <Switch aria-label="Use SSL" />
                    </Form.Item>
                  </div>
                  {sslEnabled && (
                    <div className="capture-ca">
                      <Form.Item name="sslTrust" label="Certificate trust">
                        <Radio.Group
                          options={[
                            {
                              value: "system",
                              label: "System trusted certificates",
                            },
                            { value: "custom", label: "Custom CA certificate" },
                            ...(savedConnection?.sslTrust === "legacy"
                              ? [
                                  {
                                    value: "legacy",
                                    label: "Existing server-managed CA",
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </Form.Item>
                      {sslTrust === "legacy" && (
                        <Alert
                          type="info"
                          showIcon
                          message="This connection uses the existing server-managed trust. Select Custom CA certificate to save trust specifically for this connection."
                        />
                      )}
                      {sslTrust === "custom" && (
                        <>
                          <Form.Item
                            label="Upload CA certificate"
                            extra="Read locally into the field below. PEM CA bundles only, up to 64 KiB. Do not upload a private key."
                          >
                            <input
                              type="file"
                              aria-label="Upload CA certificate"
                              accept=".pem,.crt,.cer,text/plain,application/x-pem-file"
                              onChange={(event) => {
                                void readCaFile(event.target.files?.[0]);
                                event.target.value = "";
                              }}
                            />
                          </Form.Item>
                          <Form.Item
                            name="sslCa"
                            label="Trusted CA certificate (PEM)"
                            rules={[
                              {
                                required: true,
                                whitespace: true,
                                message:
                                  "Upload or paste the trusted CA certificate",
                              },
                              { max: 65536 },
                              {
                                validator: (_, value) =>
                                  typeof value === "string" &&
                                  value.includes(
                                    "-----BEGIN CERTIFICATE-----",
                                  ) &&
                                  !/-----BEGIN[^\n]*PRIVATE KEY-----/.test(
                                    value,
                                  )
                                    ? Promise.resolve()
                                    : Promise.reject(
                                        new Error(
                                          "Provide PEM CA certificates, not private keys or file paths",
                                        ),
                                      ),
                              },
                            ]}
                            extra="Saved only for this connection. The backend validates the bundle and the database certificate; verification is never disabled."
                          >
                            <Input.TextArea
                              aria-label="Trusted CA certificate (PEM)"
                              rows={6}
                              spellCheck={false}
                              placeholder="-----BEGIN CERTIFICATE-----"
                            />
                          </Form.Item>
                        </>
                      )}
                      {savedSlot && (
                        <>
                          <Button
                            disabled={!!busy || readingCa || !unchangedEndpoint}
                            loading={busy.startsWith("ssl/")}
                            onClick={() => void saveSslSettings()}
                          >
                            Save SSL settings
                          </Button>
                          <p className="capture-hint">
                            Tests and updates the saved connection’s SSL trust
                            without reinstalling capture. Save other connection
                            changes using Configure capture. Re-entered
                            passwords are not used by this SSL-only action.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
                <Alert
                  type="info"
                  showIcon
                  message="Full-history capture requires REPLICA IDENTITY FULL"
                  description="FULL records previous non-key values and increases WAL volume. Setup applies it to selected tables and partitions before publishing. If it cannot be verified, Trail capture is blocked. Older WAL and TRUNCATE cannot recover missing previous values."
                />
                <Form.Item
                  name="manageReplicaIdentity"
                  label="Allow setup to apply FULL to selected tables"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <div className="capture-footer">
                  <span className="capture-hint">
                    Testing checks access and loads table names.
                  </span>
                  <Button
                    onClick={() => databaseAction("test-connection")}
                    loading={busy === "test-connection"}
                    disabled={!!busy || readingCa}
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
                  <Alert
                    type="info"
                    showIcon
                    message="Only reviewed tables enter capture"
                    description="Select business tables explicitly. New tables require review and another configuration save; sessions, GPS and notification tables are not added automatically. The attribution outbox is managed separately."
                  />
                  <div className="capture-table-label">
                    <label htmlFor="tables">Tables to capture</label>
                    <span>{`${selectedTables.length} selected`}</span>
                  </div>
                  <Form.Item
                    name="tables"
                    normalize={(values: string[]) => [
                      ...new Set(
                        values.map((table) => table.trim()).filter(Boolean),
                      ),
                    ]}
                    rules={[
                      {
                        validator: (_, values: string[] | undefined) => {
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
                </div>
                <div className="capture-footer">
                  <span className="capture-hint">
                    Next: install and verify capture before going live.
                  </span>
                  <Popconfirm
                    title="Configure replication on this database?"
                    description="Applies FULL when allowed and saves the reviewed table list. Running capture is paused; the existing slot and checkpoint are preserved. Verify and activate afterward."
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
        <CaptureHealthPanel />
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
              {status.data?.slots.map((slot) => (
                <Card
                  key={slot.id}
                  size="small"
                  title={`Previous values · ${slot.slotName}`}
                >
                  <Alert
                    showIcon
                    type={slot.fullHistory?.ready ? "info" : "warning"}
                    message={
                      slot.fullHistory
                        ? slot.fullHistory.ready
                          ? `FULL verified on ${slot.fullHistory.tableCount} tables`
                          : `${slot.fullHistory.blockedCount} tables blocked`
                        : "Full-history policy has not been checked"
                    }
                    description={
                      slot.fullHistory
                        ? `Checked ${formatTimestamp(slot.fullHistory.checkedAt, timeZone)}. Activation and reconnect always recheck. This does not repair older WAL or resolve continuity incidents.`
                        : "Verify table identity before activation."
                    }
                  />
                  {canManage && (
                    <div style={{ display: "flex", gap: 8, marginBlock: 12 }}>
                      <Button
                        disabled={!!busy}
                        onClick={() =>
                          void action(`identity/${slot.id}`, { apply: false })
                        }
                      >
                        Check FULL identity
                      </Button>
                      <Popconfirm
                        title="Apply FULL to published tables and partitions?"
                        description="Increases WAL volume. Uses short DDL lock timeouts; no slot or checkpoint is reset."
                        onConfirm={() =>
                          action(`identity/${slot.id}`, { apply: true })
                        }
                      >
                        <Button disabled={!!busy}>Apply FULL and verify</Button>
                      </Popconfirm>
                    </div>
                  )}
                  {canManage && <ContextMessageSettings slotId={slot.id} />}
                  {!!slot.fullHistory?.tables.length && (
                    <Table
                      rowKey="table"
                      size="small"
                      dataSource={slot.fullHistory.tables}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 700 }}
                      columns={[
                        { title: "Blocked table", dataIndex: "table" },
                        { title: "Identity", dataIndex: "identity" },
                        { title: "Reason", dataIndex: "error" },
                        {
                          title: "DB administrator command",
                          dataIndex: "sql",
                          render: (value: string) => <code>{value}</code>,
                        },
                      ]}
                    />
                  )}
                  {slot.fullHistory && slot.fullHistory.blockedCount > 100 && (
                    <p>
                      First 100 blocked tables shown. Repair these and check
                      again for remaining failures.
                    </p>
                  )}
                </Card>
              ))}
              <Table<CaptureSlot>
                rowKey="id"
                pagination={false}
                dataSource={status.data?.slots}
                scroll={{ x: 1100 }}
                columns={[
                  { title: "Slot", width: 320, dataIndex: "slotName" },
                  {
                    title: "Reviewed scope",
                    width: 170,
                    render: (_, slot) =>
                      slot.captureScope?.policy === "EXPLICIT"
                        ? `${slot.captureScope.selectedTables.length} selected tables`
                        : "Legacy configuration: review table selection",
                  },
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
