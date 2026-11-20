import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Alert, Button, Form, Input, Select } from "antd";
import { useAuthStore } from "@/store/useAuthStore";
import type { SignupCredentials } from "@/lib/auth/auth.types";
export function SignupPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [form] = Form.useForm();
  async function submit(values: SignupCredentials) {
    setBusy(true);
    setError("");
    try {
      await useAuthStore.getState().signup(values);
      navigate("/setup?welcome=1&step=2", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="my-8 w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-bold">Create your company workspace</h1>
      <p className="mb-6 mt-2 text-gray-500">
        Register your company to start following its audit trail.
      </p>
      <div className="mb-6 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
        <p className="font-semibold">Step 1: Register your company</p>
        <p className="mt-1 leading-relaxed">
          Have your company name, industry and administrator details ready.
          After registration, we’ll guide you through connecting PostgreSQL and
          checking your first activity.
        </p>
        <Link
          to="/getting-started"
          className="mt-2 inline-block font-medium underline underline-offset-2"
        >
          See every setup step and the details you need
        </Link>
      </div>
      {error && (
        <Alert type="error" showIcon message={error} className="mb-4" />
      )}
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        disabled={busy}
        onValuesChange={(changed) => {
          if (
            changed.company_name !== undefined &&
            !form.isFieldTouched("slug")
          ) {
            form.setFieldValue(
              "slug",
              String(changed.company_name)
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                .slice(0, 100),
            );
          }
        }}
      >
        <div className="grid gap-x-4 sm:grid-cols-2">
          {[
            ["name", "Your name"],
            ["user_name", "Username"],
            ["company_name", "Company name"],
            ["slug", "Company slug"],
          ].map(([name, label]) => (
            <Form.Item
              key={name}
              name={name}
              label={label}
              extra={
                {
                  name: "The first company administrator's full name",
                  user_name:
                    "A username for signing in to this company account",
                  company_name: "The company whose activity you want to follow",
                  slug: "Company identifier, such as acme-logistics. Suggested automatically; you can edit it.",
                }[name]
              }
              rules={[
                { required: true, whitespace: true },
                ...(name === "slug"
                  ? [
                      {
                        pattern: /^[a-z0-9-]+$/,
                        message: "Use lowercase letters, numbers and dashes",
                      },
                    ]
                  : []),
                { max: 100 },
              ]}
            >
              <Input
                autoComplete={
                  name === "name"
                    ? "name"
                    : name === "user_name"
                      ? "username"
                      : "off"
                }
              />
            </Form.Item>
          ))}
        </div>
        <Form.Item
          name="industry"
          label="Industry"
          rules={[{ required: true }]}
        >
          <Select
            placeholder="Choose your company industry"
            options={[
              "MANUFACTURING",
              "LOGISTICS",
              "SUPPLYCHAINMANAGEMENT",
              "HEALTHCARE",
              "TECHNOLOGY",
              "AGRICULTURE",
              "TRANSPORTATION",
            ].map((value) => ({
              value,
              label:
                value === "SUPPLYCHAINMANAGEMENT"
                  ? "Supply chain management"
                  : value.charAt(0) + value.slice(1).toLowerCase(),
            }))}
          />
        </Form.Item>
        <Form.Item
          name="email"
          label="Work email"
          extra="Use your own work email for the administrator account"
          rules={[{ required: true, type: "email", max: 100 }]}
        >
          <Input autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          extra="Use 8–200 characters. This is your Trio Trail sign-in password."
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
        <Button
          type="primary"
          htmlType="submit"
          loading={busy}
          block
          size="large"
        >
          Create workspace
        </Button>
      </Form>
      <p className="mt-5 text-center text-sm text-gray-500">
        Already registered?{" "}
        <Link className="text-indigo-600" to="/auth/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
