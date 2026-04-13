import { adminClient } from "./supabase.ts";

export const logAudit = async (
  userId: string | null,
  action: string,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
) => {
  await adminClient.from("audit_logs").insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata ?? {},
    ip_address: ipAddress,
  });
};
