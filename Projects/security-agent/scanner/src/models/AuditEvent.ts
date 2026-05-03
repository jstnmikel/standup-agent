export type AuditEventType =
  | 'scan_started'
  | 'scan_completed'
  | 'scan_tool_error'
  | 'commit_blocked'
  | 'commit_scan_bypassed'
  | 'suppression_added'
  | 'suppression_removed'
  | 'suppression_invalidated_by_policy'
  | 'allowlist_entry_added'
  | 'allowlist_entry_removed'
  | 'config_changed'
  | 'admin_policy_loaded'
  | 'admin_policy_conflict'
  | 'rules_updated'
  | 'self_update_completed'
  | 'self_update_failed'
  | 'scan_history_deleted'
  | 'onboarding_completed';

export interface AuditEvent {
  timestamp: string;
  event_type: AuditEventType;
  scanner_version: string;
  prev_hash: string;
  [key: string]: unknown;
}

export interface AuditEventInput {
  event_type: AuditEventType;
  timestamp?: string;
  scanner_version?: string;
  prev_hash?: string;
  [key: string]: unknown;
}
