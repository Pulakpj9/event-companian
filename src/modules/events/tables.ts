import type { Generated } from 'kysely';

export interface EventTables {
  events: {
    id: string;
    organisation_id: string;
    title: string;
    summary: string;
    starts_at: Date;
    ends_at: Date;
    time_zone: string;
    status: 'draft' | 'published';
    revision: number;
  };
  event_revisions: {
    organisation_id: string;
    event_id: string;
    revision: number;
    actor_id: string;
    action: 'created' | 'edited' | 'published' | 'unpublished';
    recorded_at: Generated<Date>;
  };
}
