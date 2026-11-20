import type { AuditEvent } from "./api";
import { eventActionLabel } from "./eventFormat.ts";

/** The backend validates this application-declared reference; never infer it from row order. */
export function activitySummary(
  event: Pick<AuditEvent, "event_type" | "resource_identifier"> &
    Partial<AuditEvent>,
) {
  const operation =
    event.source === "DIRECT_DB" ? null : event.business_operation;
  if (event.source !== "DIRECT_DB" && event.business_batch) {
    return `${event.business_batch.primaryResources.length} main documents · ${eventActionLabel(event.event_type)}`;
  }
  if (operation) {
    const resource = operation.primaryResource;
    const documentType = activityTableLabel(resource.table);
    const action = eventActionLabel(event.event_type);
    const change =
      event.resource_identifier === resource.table
        ? action
        : `Related change · ${action}`;
    return `${documentType} ${resource.displayId || resource.id} · ${change}`;
  }
  return (
    event.event_description ||
    `${eventActionLabel(event.event_type)} on ${event.resource_identifier || "a company record"}`
  );
}

/** Display labels preserve the original table name through the caller's tooltip. */
export function activityTableLabel(table: string): string {
  const labels: Record<string, string> = {
    "public.purchase_indents": "Purchase Indent",
    "public.purchase_indent_details": "Purchase Indent Lines",
    "public.code_sequences": "Code Sequences",
    "public.purchase_orders": "Purchase Order",
    "public.goods_receipt_notes": "GRN",
    "public.purchase_enquiries": "Purchase Enquiry",
    "public.purchase_quotations": "Purchase Quotation",
    "public.purchase_comparative_statements": "Comparative Statement",
  };
  return (
    labels[table] ??
    table
      .split(".")
      .at(-1)!
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase())
  );
}

export function businessOperationLabel(action: string): string {
  const [module, operation, step] = action.split(".");
  const documents: Record<string, string> = {
    purchase_indent: "Purchase Indent",
    purchase_order: "Purchase Order",
    grn: "GRN",
    purchase_enquiry: "Purchase Enquiry",
    purchase_quotation: "Purchase Quotation",
    purchase_comparative_statement: "Comparative Statement",
  };
  const name = documents[module];
  if (!name) return action;
  if (operation === "approval") {
    const labels: Record<string, string> = {
      submit_for_approval: `Submit ${name} for approval`,
      approve: `Record ${name} approval`,
      reject: `Reject ${name} approval`,
      send_back: `Send back ${name} approval`,
      recall: `Recall ${name} approval`,
      delegate: `Delegate ${name} approval`,
    };
    return labels[step] ?? action;
  }
  if (operation === "inspection")
    return (
      (
        {
          save_draft: "Save GRN inspection draft",
          approve: "Approve GRN inspection",
          reject: "Reject GRN inspection",
        } as Record<string, string>
      )[step] ?? action
    );
  if (operation === "generate_purchase_orders")
    return `Generate Purchase Orders from ${name}`;
  if (operation === "generate_from_comparative_statement")
    return "Generate Purchase Orders from Comparative Statement";
  if (operation === "record_email_queue")
    return `Record ${name} email queueing`;
  const verbs: Record<string, string> = {
    create: "Create",
    update: "Update",
    remove: "Delete",
    revise: "Revise",
    reopen: "Reopen",
    close: "Close",
    amend: "Amend",
    cancel: "Cancel",
    short_close: "Short close",
    approve: "Approve",
  };
  return verbs[operation] ? `${verbs[operation]} ${name}` : action;
}
