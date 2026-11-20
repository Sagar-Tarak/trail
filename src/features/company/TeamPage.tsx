import { useTimeZoneStore } from "@/store/useTimeZoneStore";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Popconfirm,
  Select,
  Table,
  Tooltip,
} from "antd";
import { PageShell } from "@/components/page";
import { useAuthStore } from "@/store/useAuthStore";
import {
  getData,
  postData,
  postAction,
  type Data,
  type AccountSession,
} from "./api";
import { formatTimestamp } from "./time";
import { Details, QueryState } from "./shared";
export function TeamPage() {
  const timeZone = useTimeZoneStore((state) => state.timeZone);
  const user = useAuthStore((s) => s.user);
  const canManage = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  const [busy, setBusy] = useState<"create" | "sign-out" | null>(null);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Data>();
  const [form] = Form.useForm();
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: ({ signal }) =>
      getData<AccountSession[]>("/auth/sessions", undefined, signal),
  });
  async function signOutAll() {
    if (busy) return;
    setBusy("sign-out");
    setError("");
    try {
      await postAction("/auth/log-out-all");
      useAuthStore.getState().clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign out devices");
    } finally {
      setBusy(null);
    }
  }
  async function create(values: Data) {
    if (busy) return;
    setBusy("create");
    setError("");
    setCreated(undefined);
    try {
      setCreated(await postData("/user/invite-user", values));
      form.resetFields();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create user");
    } finally {
      setBusy(null);
    }
  }
  return (
    <PageShell
      title="Team & account"
      subtitle="Create users in your company and review your active account sessions."
    >
      {error && <Alert type="error" showIcon message={error} />}
      <Card title="Your account">
        <Details
          data={
            user
              ? {
                  name: user.name,
                  email: user.email,
                  username: user.user_name,
                  role: user.role,
                }
              : undefined
          }
        />
      </Card>
      {canManage ? (
        <Card title="Create team member">
          <p className="mb-4 text-gray-500">
            Creates a company account with an initial password. The backend does
            not send an invitation email.
          </p>
          {created && (
            <Alert
              type="success"
              message="Team member created"
              description={String(created.email ?? created.name ?? "")}
              className="mb-4"
            />
          )}
          <Form
            form={form}
            layout="vertical"
            onFinish={create}
            disabled={!!busy}
            initialValues={{ role: "MEMBER" }}
          >
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Form.Item
                name="name"
                label="Name"
                normalize={(value: string) => value.trimStart()}
                rules={[{ required: true, whitespace: true, max: 100 }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="user_name"
                label="Username"
                normalize={(value: string) => value.trim()}
                rules={[{ required: true, whitespace: true, max: 100 }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                normalize={(value: string) => value.trim()}
                rules={[{ required: true, type: "email", max: 100 }]}
              >
                <Input />
              </Form.Item>
              <Form.Item name="role" label="Role" rules={[{ required: true }]}>
                <Select
                  options={["ADMIN", "MANAGER", "MEMBER", "GUEST"].map(
                    (value) => ({ value, label: value }),
                  )}
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Initial password"
                rules={[{ required: true, min: 8, max: 200 }]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm password"
                dependencies={["password"]}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, v) {
                      return v === getFieldValue("password")
                        ? Promise.resolve()
                        : Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password autoComplete="new-password" />
              </Form.Item>
            </div>
            <Button
              type="primary"
              htmlType="submit"
              loading={busy === "create"}
              disabled={!!busy}
            >
              Create member
            </Button>
          </Form>
        </Card>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Only company administrators can create team members."
        />
      )}
      <Card
        title="Your active sessions"
        extra={
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => sessions.refetch()}
              loading={sessions.isFetching}
              disabled={!!busy}
            >
              Refresh
            </Button>
            <Popconfirm
              title="Sign out all devices, including this one?"
              onConfirm={signOutAll}
              disabled={!!busy}
            >
              <Button danger loading={busy === "sign-out"} disabled={!!busy}>
                Sign out all devices
              </Button>
            </Popconfirm>
          </div>
        }
      >
        <QueryState
          loading={sessions.isPending}
          error={sessions.error}
          retry={() => sessions.refetch()}
        />
        <Table
          rowKey="tokenId"
          dataSource={sessions.data}
          pagination={{ hideOnSinglePage: true, pageSize: 10 }}
          scroll={{ x: 900 }}
          columns={[
            {
              title: "Device",
              width: 240,
              dataIndex: "userAgent",
              render: (value: string | null) => (
                <Tooltip title={value}>
                  <span>{sessionDevice(value)}</span>
                </Tooltip>
              ),
            },
            {
              title: "IP address",
              width: 160,
              dataIndex: "ipAddress",
              render: (value: string | null) => value || "Not reported",
            },
            {
              title: "Last used",
              width: 200,
              dataIndex: "lastUsed",
              render: (v: string) => formatTimestamp(v, timeZone),
            },
            {
              title: "Expires",
              width: 200,
              dataIndex: "expiresAt",
              render: (v: string) => formatTimestamp(v, timeZone),
            },
            {
              title: "Current",
              width: 140,
              dataIndex: "isCurrent",
              render: (v: boolean) => (v ? "This session" : "Other device"),
            },
          ]}
        />
      </Card>
    </PageShell>
  );
}

function sessionDevice(agent: string | null) {
  if (!agent) return "Not reported";
  const browser = /Edg\//.test(agent)
    ? "Edge"
    : /Chrome\//.test(agent)
      ? "Chrome"
      : /Firefox\//.test(agent)
        ? "Firefox"
        : /Safari\//.test(agent)
          ? "Safari"
          : "Application";
  const device = /iPhone|iPad/.test(agent)
    ? "iOS"
    : /Android/.test(agent)
      ? "Android"
      : /Macintosh|Mac OS/.test(agent)
        ? "macOS"
        : /Windows/.test(agent)
          ? "Windows"
          : /Linux/.test(agent)
            ? "Linux"
            : "Unknown device";
  return `${browser} · ${device}`;
}
