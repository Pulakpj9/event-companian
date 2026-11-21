import { randomUUID } from 'node:crypto';
import type { Kysely, Selectable, Transaction } from 'kysely';
import type { PlatformDatabase } from '../../platform/database.js';
import { parseZonedEventTime } from '../../shared/values/event-time.js';
import { consumePublicDocumentChange } from '../discovery/consumer.js';
import type { createIdentityService } from '../identity/service.js';
import type { EventTables } from './tables.js';

type Event = Selectable<EventTables['events']>;
type Draft = { title: string; summary: string; startsAt: string; endsAt: string; timeZone: string };

export class EventError extends Error {
  constructor(readonly status: 400 | 404 | 409, message: string) { super(message); }
}

function schedule(draft: Draft) {
  const title = draft.title.trim();
  if (!title || title.length > 300 || draft.summary.length > 2000) throw new EventError(400, 'Invalid event title or summary.');
  let startsAt: Date;
  let endsAt: Date;
  try {
    startsAt = new Date(parseZonedEventTime(draft.startsAt, draft.timeZone).instant);
    endsAt = new Date(parseZonedEventTime(draft.endsAt, draft.timeZone).instant);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    throw new EventError(400, 'Event times must match the specified time zone and offset.');
  }
  if (endsAt <= startsAt) throw new EventError(400, 'Event end must be after the start.');
  return { title, summary: draft.summary, starts_at: startsAt, ends_at: endsAt, time_zone: draft.timeZone };
}

function view(event: Event) {
  return {
    id: event.id, organisationId: event.organisation_id, title: event.title, summary: event.summary,
    startsAt: event.starts_at.toISOString(), endsAt: event.ends_at.toISOString(),
    timeZone: event.time_zone, status: event.status, revision: event.revision,
  };
}

export function createEventsService(
  db: Kysely<PlatformDatabase>,
  identity: Pick<ReturnType<typeof createIdentityService>, 'requireOrganisationPermission'>,
) {
  async function audit(tx: Transaction<PlatformDatabase>, event: Event, actor: string, action: EventTables['event_revisions']['action']) {
    await tx.insertInto('event_revisions').values({
      event_id: event.id, organisation_id: event.organisation_id, actor_id: actor, revision: event.revision, action,
    }).execute();
  }

  async function find(tx: Transaction<PlatformDatabase>, id: string) {
    const event = await tx.selectFrom('events').selectAll().where('id', '=', id).executeTakeFirst();
    if (!event) throw new EventError(404, 'Event unavailable.');
    return event;
  }

  async function update(tx: Transaction<PlatformDatabase>, existing: Event, changes: Partial<Event>) {
    return tx.updateTable('events').set({ ...changes, revision: existing.revision + 1 })
      .where('id', '=', existing.id).returningAll().executeTakeFirstOrThrow();
  }

  return {
    async create(organisationId: string, actor: string, draft: Draft) {
      const details = schedule(draft);
      return db.transaction().execute(async tx => {
        await identity.requireOrganisationPermission(tx, organisationId, actor, 'events.edit');
        const created = await tx.insertInto('events').values({
          ...details, id: randomUUID(), organisation_id: organisationId, status: 'draft', revision: 1,
        }).returningAll().executeTakeFirstOrThrow();
        await audit(tx, created, actor, 'created');
        return view(created);
      });
    },
    async get(id: string, actor: string) {
      return db.transaction().execute(async tx => {
        const initial = await find(tx, id);
        await identity.requireOrganisationPermission(tx, initial.organisation_id, actor, 'events.view');
        return view(await find(tx, id));
      });
    },
    async edit(id: string, actor: string, expectedRevision: number, draft: Partial<Draft>) {
      return db.transaction().execute(async tx => {
        const initial = await find(tx, id);
        await identity.requireOrganisationPermission(tx, initial.organisation_id, actor, 'events.edit');
        const event = await find(tx, id);
        if (event.revision !== expectedRevision || event.status !== 'draft') throw new EventError(409, 'Draft or revision conflict.');
        const title = draft.title?.trim() ?? event.title;
        if (!title) throw new EventError(400, 'Event title is required.');
        const scheduleChanged = draft.startsAt !== undefined || draft.endsAt !== undefined || draft.timeZone !== undefined;
        if (scheduleChanged && (draft.startsAt === undefined || draft.endsAt === undefined || draft.timeZone === undefined)) {
          throw new EventError(400, 'Provide both event times and the time zone when changing the schedule.');
        }
        const summary = draft.summary ?? event.summary;
        const details = draft.startsAt !== undefined && draft.endsAt !== undefined && draft.timeZone !== undefined
          ? schedule({ title, summary, startsAt: draft.startsAt, endsAt: draft.endsAt, timeZone: draft.timeZone })
          : { title, summary };
        const revised = await update(tx, event, details);
        await audit(tx, revised, actor, 'edited');
        return view(revised);
      });
    },
    async publish(id: string, actor: string, status: Event['status']) {
      return db.transaction().execute(async tx => {
        const initial = await find(tx, id);
        await identity.requireOrganisationPermission(tx, initial.organisation_id, actor, 'events.manage');
        const event = await find(tx, id);
        if (event.status === status) return view(event);
        const revised = await update(tx, event, { status });
        const isPublic = status === 'published';
        await audit(tx, revised, actor, isPublic ? 'published' : 'unpublished');
        const result = await consumePublicDocumentChange(tx, {
          type: 'discovery.public_document_changed.v1', eventId: randomUUID(), kind: 'event',
          documentId: id, revision: revised.revision, document: isPublic ? { title: revised.title, summary: revised.summary } : null,
        });
        if (result !== 'applied') throw new Error('Event discovery change could not be recorded.');
        return view(revised);
      });
    },
  };
}
