import { apiClient } from "@/lib/api/client";
import { checkResponse, readResponseData } from "@/lib/api/responseData";
export type Data = Record<string, unknown>;
export interface BusinessDocument {
  table: string;
  id: string;
  displayId?: string;
  companyId?: string;
  companyName?: string;
}
export interface AuditEvent extends Data {
  id: string;
  source_company_id?: string | null;
  source_company_name?: string | null;
  event_timestamp: string;
  event_type: string;
  severity: string;
  received_at: string;
  outcome: "SUCCESS" | "FAILURE" | "PARTIAL";
  source:
    | "DB_CDC"
    | "DB_TRIGGER"
    | "APP_SDK"
    | "APP_DIRECT"
    | "IMPORT"
    | "DIRECT_DB";
  diff_quality: "EXACT" | "PARTIAL" | "UNKNOWN";
  risk_score: number;
  actor_external_id: string | null;
  actor_user_id?: string | null;
  actor_type: string | null;
  actor_role?: string | null;
  resource_identifier: string | null;
  event_description: string | null;
  transaction_group_id?: string | null;
  changed_fields: string[];
  operation_name?: string | null;
  business_operation?: {
    action: string;
    primaryResource: BusinessDocument;
  } | null;
  business_batch?: {
    action: string;
    primaryResources: BusinessDocument[];
  } | null;
  audit_event_details?: {
    field_path: string;
    old_value: string;
    new_value: string;
    data_type?: string | null;
    is_sensitive: boolean;
  }[];
  before_data: Data | null;
  after_data: Data | null;
}
export interface Cursor {
  cursorTs: string;
  cursorId: string;
}
export interface EventPage {
  events: AuditEvent[];
  nextCursor: Cursor | null;
}
export interface CaptureSlot extends Data {
  id: string;
  slotName: string;
  status: "INACTIVE" | "ACTIVE" | "LAGGING" | "ERROR" | "MAINTENANCE";
  lastActivity: string | null;
  eventsProcessed: string;
  errorCount: number;
  lastError: string | null;
  lagSeconds: number;
  publicationName: string;
  tablesConfigured: unknown;
  connection?: {
    host: string;
    port: number;
    database: string;
    username: string;
    ssl: boolean;
  };
}
export interface CaptureStatus extends Data {
  configured: boolean;
  slots: CaptureSlot[];
  sessionStats?: Data | null;
  metrics?: {
    recentEvents: number;
    processedEvents: number;
    processingRate: number;
  };
}
export interface AccountSession {
  tokenId: string;
  lastUsed: string;
  expiresAt: string;
  userAgent: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
}
export async function getData<T = Data>(
  url: string,
  params?: object,
  signal?: AbortSignal,
): Promise<T> {
  return readResponseData<T>(
    (await apiClient.get<unknown>(url, { params, signal })).data,
  );
}
export async function postData(
  url: string,
  values: object = {},
): Promise<Data> {
  return readResponseData<Data>(
    (await apiClient.post<unknown>(url, values)).data,
  );
}

export async function postAction(url: string) {
  checkResponse((await apiClient.post<unknown>(url, {})).data);
}
