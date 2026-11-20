/** Device labels describe the reported user agent, not a verified hardware identity. */
export function requestDetails(event: Record<string, unknown>) {
  const metadata = event.metadata as
    | { actor_context?: unknown; actor_context_status?: unknown }
    | undefined;
  const context = metadata?.actor_context;
  const values =
    context && typeof context === "object" && !Array.isArray(context)
      ? (context as Record<string, unknown>)
      : {};
  const text = (key: string, max = 1024) =>
    typeof values[key] === "string" && values[key]
      ? String(values[key]).slice(0, max)
      : undefined;
  const operationIssue = values.__triotrail_operation_error;
  const operationIssueMessage =
    operationIssue &&
    typeof operationIssue === "object" &&
    !Array.isArray(operationIssue) &&
    "message" in operationIssue &&
    typeof operationIssue.message === "string"
      ? operationIssue.message.slice(0, 512)
      : undefined;
  const issueValues =
    operationIssue && typeof operationIssue === "object"
      ? (operationIssue as Record<string, unknown>)
      : {};
  const issueText = (key: string) =>
    typeof issueValues[key] === "string"
      ? String(issueValues[key]).slice(0, 255)
      : undefined;
  const userAgent = text("userAgent");
  const browser = !userAgent
    ? undefined
    : /Edg\//.test(userAgent)
      ? "Edge"
      : /(?:Chrome|CriOS)\//.test(userAgent)
        ? "Chrome"
        : /(?:Firefox|FxiOS)\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "Other client";
  const platform = !userAgent
    ? undefined
    : /iPhone|iPad/.test(userAgent)
      ? "iOS"
      : /Android/.test(userAgent)
        ? "Android"
        : /Windows/.test(userAgent)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(userAgent)
            ? "macOS"
            : /Linux/.test(userAgent)
              ? "Linux"
              : "Platform not reported";
  return {
    operationIssue: operationIssueMessage,
    operationFailureStage: issueText("stage"),
    operationFailureCode: issueText("databaseCode") || issueText("code"),
    operationFailureId: issueText("operationId"),
    operationFailureTime: issueText("occurredAt"),
    contextStatus:
      metadata?.actor_context_status === "not_provided"
        ? "Context was not provided"
        : metadata?.actor_context_status === "provided"
          ? "Context provided"
          : undefined,
    ipAddress: text("ipAddress", 64),
    userAgent,
    device: userAgent ? `${browser} · ${platform}` : undefined,
    email: text("email", 255),
    username: text("username", 255),
    displayName: text("displayName", 255),
    method: text("method", 16),
    path: text("path", 2048),
    company: text("companyName", 255),
    ipSource: text("ipSource", 64),
  };
}
