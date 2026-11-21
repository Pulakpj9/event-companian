import type { Generated } from 'kysely';
import type { Access } from './access.js';

export interface IdentityTables {
  identity_users: { id: string; issuer: string; subject: string };
  organisations: { id: string; name: string; owner_id: string };
  organisation_members: Access & { organisation_id: string; user_id: string; active: boolean; revoked_at: Date | null };
  organisation_invitations: Access & {
    token_hash: string; organisation_id: string; inviter_id: string;
    email: string; issued_at: Generated<Date>; expires_at: Date; accepted_at: Date | null;
  };
  organisation_access_audit: {
    id: string; organisation_id: string; actor_id: string; target_user_id: string | null;
    action: string; recorded_at: Generated<Date>;
  };
}
