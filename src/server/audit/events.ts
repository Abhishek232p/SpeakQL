export const AUDIT_ACTIONS = {
  profileCreated: "profile.created",
  profileUpdated: "profile.updated",
} as const;

export function profileAuditAction(existed: boolean): string {
  return existed ? AUDIT_ACTIONS.profileUpdated : AUDIT_ACTIONS.profileCreated;
}

export type AuditEventInput = Readonly<{
  actorUserId: string | null;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, string | number | boolean>;
}>;
