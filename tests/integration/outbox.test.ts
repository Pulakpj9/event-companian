import { createEventsService } from '../../src/modules/events/service.js';
import { createRequestActor } from '../../src/modules/identity/routes.js';
import { consumePublicDocumentChange } from '../../src/modules/discovery/consumer.js';
import { createHmac } from 'node:crypto';
import { acceptPaymentObservation } from '../../src/modules/commerce/provider-inbox/store.js';
import { createWorkerMetrics } from '../../src/platform/metrics.js';
import { Money } from '../../src/shared/values/money.js';
import { approveFixedFee, draftFixedFee, previewFixedFee } from '../../src/modules/commerce/fixed-fee-store.js';
import { projectPublicDocument, searchPublicDocuments } from '../../src/modules/discovery/public-search.js';
import { claimJob, completeProbe, failJob } from '../../src/platform/jobs.js';
import { createApp } from '../../src/platform/http.js';
import { createIdentityService } from '../../src/modules/identity/service.js';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { sql } from 'kysely';
import { createDatabase } from '../../src/platform/database.js';
import { migrateDatabase } from '../../src/platform/migrations.js';
import { enqueueProbe, processNextProbe } from '../../src/platform/probe.js';

let db: ReturnType<typeof createDatabase> | undefined;

beforeAll(async () => {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error('Set TEST_DATABASE_URL to a fresh, disposable PostgreSQL database.');
  db = createDatabase(url, 4);
});

afterAll(async () => {
  await db?.destroy();
});

it('migrates a fresh database and treats an immediate rerun as a no-op', async () => {
  const database = db!;
  expect(await migrateDatabase(database)).toHaveLength(8);
  expect(await migrateDatabase(database)).toEqual([]);
});

it('rolls back the diagnostic write if the outbox insert fails', async () => {
  const database = db!;
  const existing = await enqueueProbe(database);
  const collision = randomUUID();
  await database.updateTable('platform_outbox').set({ id: collision }).where('id', '=', existing).execute();
  await expect(enqueueProbe(database, collision)).rejects.toMatchObject({ code: '23505' });
  expect(await database.selectFrom('foundation_probe').select('id').where('id', '=', collision).executeTakeFirst())
    .toBeUndefined();
  expect(await processNextProbe(database)).toBe(true);
});

it('applies a diagnostic event exactly once across concurrent worker claims', async () => {
  const database = db!;
  const id = await enqueueProbe(database);
  const claims = await Promise.all([processNextProbe(database), processNextProbe(database)]);
  expect(claims.filter(Boolean)).toHaveLength(1);
  expect(await processNextProbe(database)).toBe(false);
  const result = await sql<{ same_commit: boolean }>`
    SELECT p.processed_at IS NOT NULL AND p.processed_at = o.processed_at AS same_commit
    FROM foundation_probe p JOIN platform_outbox o ON p.id = o.probe_id WHERE p.id = ${id}
  `.execute(database);
  expect(result.rows).toEqual([{ same_commit: true }]);
});

it('uses one identity across clients and enforces team permissions, invite replay and next-request revocation', async () => {
  const database = db!;
  const app = await createApp(async () => {}, false, {
    service: createIdentityService(database),
    b2b: new Set(['business']),
    async verifyToken(token) {
      const [subject, clientId] = token.split('.');
      if (!subject || !clientId) throw new Error('Invalid token');
      return { issuer: 'https://issuer.example.test', subject, clientId, verifiedEmail: `${subject}@example.test` };
    },
  });
  const headers = (person: string, client = 'business') => ({ authorization: `Bearer ${person}.${client}` });
  const root = '/api/v1';
  try {
    const personal = await app.inject({ url: root + '/me', headers: headers('owner', 'personal') });
    expect(personal.statusCode).toBe(200);
    const business = await app.inject({ url: root + '/me', headers: headers('owner') });
    expect(business.json()).toEqual(personal.json());
    expect((await app.inject({ url: root + '/organisations', headers: headers('owner', 'personal') })).statusCode).toBe(403);

    const created = await app.inject({ method: 'POST', url: root + '/organisations', headers: headers('owner'), payload: { name: 'Pilot' } });
    expect(created.statusCode).toBe(201);
    const orgId = created.json().id;
    const org = root + '/organisations/' + orgId;
    expect((await app.inject({ url: org + '/members', headers: headers('outside') })).statusCode).toBe(404);
    const invitation = await app.inject({
      method: 'POST', url: org + '/invitations', headers: headers('owner'),
      payload: { email: 'member@example.test', roles: ['admin'], permissions: [] },
    });
    expect(invitation.statusCode).toBe(201);
    const { token } = invitation.json();
    expect(invitation.headers['cache-control']).toBe('no-store');
    const secondInvite = await app.inject({
      method: 'POST', url: org + '/invitations', headers: headers('owner'),
      payload: { email: 'member@example.test', roles: ['admin'], permissions: [] },
    });
    expect(secondInvite.statusCode).toBe(201);
    const accept = (person: string, invitationToken = token) => app.inject({
      method: 'POST', url: root + '/invitations/accept', headers: headers(person), payload: { token: invitationToken },
    });
    expect((await accept('outside')).statusCode).toBe(404);
    const race = await Promise.all([accept('member'), accept('member')]);
    expect(race.map(response => response.statusCode).sort()).toEqual([200, 404]);

    const team = await app.inject({ url: org + '/members', headers: headers('member') });
    expect(team.statusCode).toBe(200);
    const member = team.json().items.find((item: { owner: boolean }) => !item.owner);
    expect((await app.inject({
      method: 'DELETE', url: org + '/members/' + personal.json().userId, headers: headers('member'),
    })).statusCode).toBe(403);
    const access = await app.inject({
      method: 'PUT', url: org + '/members/' + member.userId + '/access', headers: headers('owner'),
      payload: { roles: ['check_in_staff'], permissions: ['marketplace.view'] },
    });
    expect(access.statusCode).toBe(204);
    expect((await app.inject({ url: org + '/members', headers: headers('member') })).statusCode).toBe(403);
    const workspaces = await app.inject({ url: root + '/organisations', headers: headers('member') });
    expect(workspaces.json().items).toEqual([expect.objectContaining({
      id: orgId, permissions: ['events.view', 'events.check_in', 'marketplace.view'],
    })]);
    expect((await app.inject({
      method: 'DELETE', url: org + '/members/' + member.userId, headers: headers('owner'),
    })).statusCode).toBe(204);
    expect((await app.inject({ url: org + '/members', headers: headers('member') })).statusCode).toBe(404);
    expect((await app.inject({ url: root + '/me', headers: headers('member', 'personal') })).json()).toEqual({ userId: member.userId });
    expect((await accept('member', secondInvite.json().token)).statusCode).toBe(404);
    const audit = await database.selectFrom('organisation_access_audit').select('action').where('organisation_id', '=', orgId).execute();
    expect(audit.map(row => row.action).sort()).toEqual([
      'organisation.created', 'team.access_changed', 'team.invited', 'team.invited', 'team.joined', 'team.removed',
    ]);
  } finally {
    await app.close();
  }
});

it('recovers an expired claim and fences the previous worker', async () => {
  const database = db!;
  const id = await enqueueProbe(database);
  const type = 'foundation.probe.requested.v1';
  const original = await claimJob(database, type);
  expect(original?.id).toBe(id);
  expect(await claimJob(database, type)).toBeUndefined();
  await database.updateTable('platform_outbox').set({ lease_expires_at: sql<Date>`clock_timestamp() - interval '1 second'` })
    .where('id', '=', id).execute();
  expect(await completeProbe(database, original!)).toBe(false);
  const recovered = await claimJob(database, type);
  expect(recovered).toMatchObject({ id, attempt: 2 });
  expect(recovered?.token).not.toBe(original?.token);
  expect(await failJob(database, original!)).toBe('stale');
  expect(await completeProbe(database, recovered!)).toBe(true);
});

it('backs off a failed attempt, then dead-letters repeated failure and expired final attempts', async () => {
  const database = db!;
  const type = 'foundation.probe.requested.v1';
  for (const failure of ['processing_failed', 'lease_expired']) {
    const id = await enqueueProbe(database);
    for (let attempt = 1; attempt <= 5; attempt++) {
      const lease = await claimJob(database, type);
      expect(lease).toMatchObject({ id, attempt });
      if (attempt === 5 && failure === 'lease_expired') {
        await database.updateTable('platform_outbox').set({ lease_expires_at: sql<Date>`clock_timestamp() - interval '1 second'` })
          .where('id', '=', id).execute();
        break;
      }
      expect(await failJob(database, lease!)).toBe(attempt === 5 ? 'dead' : 'retry');
      expect(await claimJob(database, type)).toBeUndefined();
      await database.updateTable('platform_outbox').set({ available_at: sql<Date>`clock_timestamp() - interval '1 second'` })
        .where('id', '=', id).execute();
    }
    expect(await claimJob(database, type)).toBeUndefined();
    const terminal = await database.selectFrom('platform_outbox').select(['attempts', 'dead_at', 'processed_at', 'last_failure'])
      .where('id', '=', id).executeTakeFirstOrThrow();
    expect(terminal).toMatchObject({ attempts: 5, dead_at: expect.any(Date), processed_at: null, last_failure: failure });
  }
});

it('searches public text and titles and keeps withdrawn revisions out of results', async () => {
  const database = db!;
  const event = { kind: 'event', id: randomUUID(), revision: 1 } as const;
  const listing = { kind: 'listing', id: randomUUID(), revision: 1 } as const;
  const document = { title: 'Companion Expo', summary: 'Trade fair for exhibitors' };
  await projectPublicDocument(database, event, document);
  await projectPublicDocument(database, listing, document);
  expect(await searchPublicDocuments(database, 'exhibitors', 'event')).toEqual([
    { kind: 'event', id: event.id, ...document },
  ]);
  expect(await searchPublicDocuments(database, 'Companion Exop', 'listing')).toHaveLength(1);
  await projectPublicDocument(database, { ...event, revision: 2 }, null);
  await projectPublicDocument(database, event, document);
  await projectPublicDocument(database, { ...event, revision: 2 }, document);
  expect(await searchPublicDocuments(database, 'exhibitors', 'event')).toEqual([]);
  await projectPublicDocument(database, { ...event, revision: 3 }, document);
  expect(await searchPublicDocuments(database, 'exhibitors', 'event')).toHaveLength(1);
});

it('persists exact fixed fees and enforces separate, non-overlapping approvals', async () => {
  const database = db!;
  const transactionKind = 'ticket' as const;
  const effectiveFrom = Date.now() + 3_600_000;
  const rule = {
    id: randomUUID(), version: 1, transactionKind, effectiveFrom, effectiveUntil: effectiveFrom + 1000,
    priority: 1, fee: Money.of(9007199254740993n, 'INR'),
  };
  const other = { ...rule, id: randomUUID() };
  const adjacent = { ...rule, id: randomUUID(), effectiveFrom: rule.effectiveUntil, effectiveUntil: null };
  const input = { transactionKind, currency: 'INR', at: effectiveFrom };
  const author = 'companion_test_fee_author';
  const checker = 'companion_test_fee_checker';
  const nobody = 'companion_test_fee_outsider';

  await sql`
    CREATE ROLE companion_test_fee_author NOLOGIN;
    CREATE ROLE companion_test_fee_checker NOLOGIN;
    CREATE ROLE companion_test_fee_outsider NOLOGIN;
    GRANT EXECUTE ON FUNCTION public.draft_fixed_fee(uuid, integer, text, text, bigint, integer, bigint, bigint)
      TO companion_test_fee_author;
    GRANT EXECUTE ON FUNCTION public.approve_fixed_fee(uuid, integer)
      TO companion_test_fee_author, companion_test_fee_checker;
  `.execute(database);

  const asActor = <T>(name: string, action: (conn: typeof database) => Promise<T>) =>
    database.connection().execute(async conn => {
      // The disposable CI database uses a superuser. Exercise database ACLs under restricted sessions.
      await sql`SET SESSION AUTHORIZATION ${sql.id(name)}`.execute(conn);
      try { return await action(conn); }
      finally { await sql`RESET SESSION AUTHORIZATION`.execute(conn); }
    });
  try {
    await expect(asActor(nobody, conn => draftFixedFee(conn, rule))).rejects.toMatchObject({ code: '42501' });
    await asActor(author, async conn => {
      await draftFixedFee(conn, rule);
      await draftFixedFee(conn, other);
      await draftFixedFee(conn, adjacent);
      await expect(approveFixedFee(conn, rule)).rejects.toMatchObject({ code: '42501' });
    });
    expect(await previewFixedFee(database, input)).toEqual({ status: 'missing' });
    expect(await previewFixedFee(database, input, rule)).toMatchObject({
      status: 'resolved', snapshot: { ruleId: rule.id, amountMinor: '9007199254740993' },
    });
    const race = await Promise.allSettled([rule, other].map(key => asActor(checker, conn => approveFixedFee(conn, key))));
    expect(race.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(race.find(result => result.status === 'rejected')).toMatchObject({ reason: { code: '23P01' } });
    const winner = race[0]?.status === 'fulfilled' ? rule : other;
    expect(await asActor(checker, conn => approveFixedFee(conn, winner))).toBe(false);
    expect(await previewFixedFee(database, input)).toMatchObject({ status: 'resolved', snapshot: { ruleId: winner.id } });
    expect(await asActor(checker, conn => approveFixedFee(conn, adjacent))).toBe(true);
    const audit = await database.selectFrom('commercial_fixed_fee_versions').select(['drafted_by', 'approved_by', 'approved_at'])
      .where('rule_id', '=', winner.id).executeTakeFirstOrThrow();
    expect(audit).toEqual({ drafted_by: author, approved_by: checker, approved_at: expect.any(Date) });
  } finally {
    await sql`
      DROP OWNED BY companion_test_fee_author, companion_test_fee_checker, companion_test_fee_outsider;
      DROP ROLE companion_test_fee_author, companion_test_fee_checker, companion_test_fee_outsider;
    `.execute(database);
  }
});

it('exports live diagnostic queue states and worker outcomes', async () => {
  const database = db!;
  const metrics = createWorkerMetrics(database);
  const id = await enqueueProbe(database);
  await database.updateTable('platform_outbox').set({ available_at: sql<Date>`clock_timestamp() - interval '1 second'` })
    .where('id', '=', id).execute();
  await metrics.collect();
  const before = await metrics.registry.metrics();
  expect(before).toContain('companion_worker_queue_jobs{state="ready"} 1');
  expect(before).toContain('companion_worker_queue_jobs{state="dead"} 2');
  expect(await processNextProbe(database, metrics.observe)).toBe(true);
  await metrics.collect();
  const after = await metrics.registry.metrics();
  expect(after).toContain('companion_worker_queue_jobs{state="ready"} 0');
  expect(after).toContain('companion_worker_jobs_total{outcome="completed"} 1');
});

it('commits Razorpay intake once under concurrent deliveries and reports stored delivery conflicts', async () => {
  const database = db!;
  const accountId = 'acc_integration';
  const secret = 'test-integration';
  const app = await createApp(async () => {}, false, undefined, undefined, {
    config: { accountId, secrets: [secret] }, accept: event => acceptPaymentObservation(database, event),
  });
  const send = (amount: number, eventId: string) => {
    const body = JSON.stringify({
      account_id: accountId, event: 'payment.authorized', entity: 'event', created_at: 1700000000,
      payload: { payment: { entity: { id: 'pay_fixture', entity: 'payment', status: 'authorized', amount, currency: 'INR' } } },
    });
    return app.inject({ method: 'POST', url: '/api/v1/payment-webhooks/razorpay', payload: body, headers: {
      'content-type': 'application/json', 'x-razorpay-event-id': eventId,
      'x-razorpay-signature': createHmac('sha256', secret).update(body).digest('hex'),
    } });
  };
  try {
    const responses = await Promise.all([send(5000, 'evt_first'), send(5000, 'evt_first')]);
    expect(responses.map(response => response.statusCode)).toEqual([204, 204]);
    expect((await send(5000, 'evt_same_body')).statusCode).toBe(204);
    expect((await send(6000, 'evt_first')).statusCode).toBe(409);
    expect(await database.selectFrom('razorpay_payment_inbox').selectAll().where('account_id', '=', accountId).execute())
      .toEqual([expect.objectContaining({ event_id: 'evt_first', amount_minor: '5000', order_id: null })]);
  } finally { await app.close(); }
});

it('commits a discovery receipt and public projection together and safely handles replay', async () => {
  const database = db!;
  const event = {
    type: 'discovery.public_document_changed.v1', eventId: randomUUID(), kind: 'event',
    documentId: randomUUID(), revision: 1, document: { title: 'Consumer Summit', summary: 'projectionreceipt' },
  } as const;
  expect((await Promise.all([consumePublicDocumentChange(database, event), consumePublicDocumentChange(database, event)])).sort())
    .toEqual(['applied', 'duplicate']);
  expect(await consumePublicDocumentChange(database, { ...event, revision: 2 })).toBe('conflict');

  const app = await createApp(async () => {}, false, undefined, undefined, undefined, {
    search: (query, kind) => searchPublicDocuments(database, query, kind),
  });
  try {
    const find = () => app.inject('/api/v1/search?q=projectionreceipt&kind=event');
    expect((await find()).json()).toEqual({ items: [{ id: event.documentId, kind: 'event', ...event.document }] });
    const withdrawal = { ...event, eventId: randomUUID(), revision: 2, document: null };
    expect(await consumePublicDocumentChange(database, withdrawal)).toBe('applied');
    expect(await consumePublicDocumentChange(database, { ...event, eventId: randomUUID() })).toBe('applied');
    expect((await find()).json()).toEqual({ items: [] });

    const invalid = { ...event, eventId: randomUUID(), revision: 3, document: { title: ' ', summary: '' } };
    await expect(consumePublicDocumentChange(database, invalid)).rejects.toThrow(RangeError);
    expect(await database.selectFrom('discovery_event_inbox').select('event_id').where('event_id', '=', invalid.eventId).executeTakeFirst())
      .toBeUndefined();
  } finally { await app.close(); }
});

it('enforces event access and commits publishing, withdrawal and their discovery effects', async () => {
  const database = db!;
  const identity = {
    service: createIdentityService(database),
    b2b: new Set(['business']),
    async verifyToken(token: string) {
      return { issuer: 'https://event-issuer.example.test', subject: token.split('.')[0]!, clientId: token.split('.')[1]! };
    },
  };
  const claims = (subject: string) => ({ issuer: 'https://event-issuer.example.test', subject, clientId: 'business' });
  const owner = await identity.service.principal(claims('organiser'));
  const other = await identity.service.principal(claims('outsider'));
  const workspace = await identity.service.createOrganisation(owner, 'Publishing fixture');
  await identity.service.createOrganisation(other, 'Other fixture');
  const actor = createRequestActor(identity);
  const app = await createApp(async () => {}, false, identity, undefined, undefined, {
    search: (query, kind) => searchPublicDocuments(database, query, kind),
  }, {
    service: createEventsService(database, identity.service),
    businessActor: async (request, reply) => (await actor(request, reply, true)).userId,
  });
  const base = '/api/v1';
  const auth = (person = 'organiser', client = 'business') => ({ authorization: `Bearer ${person}.${client}` });
  const draft = {
    title: 'Harvest Forum', summary: 'harvestpublication', timeZone: 'Asia/Kolkata',
    startsAt: '2030-11-21T10:00:00+05:30', endsAt: '2030-11-22T17:00:00+05:30',
  };
  const create = (payload: typeof draft) => app.inject({
    method: 'POST', url: base + '/organisations/' + workspace.id + '/events', headers: auth(), payload,
  });
  const search = () => app.inject(base + '/search?q=harvestpublication&kind=event');
  try {
    expect((await create({ ...draft, startsAt: '2030-11-21T10:00:00Z' })).statusCode).toBe(400);
    const created = await create(draft);
    expect(created.statusCode).toBe(201);
    expect(created.json()).toMatchObject({ status: 'draft', revision: 1, startsAt: '2030-11-21T04:30:00.000Z' });
    const id = created.json().id;
    const url = base + '/events/' + id;
    expect((await app.inject({ url, headers: auth('outsider') })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: url + '/publish', headers: auth('organiser', 'personal') })).statusCode).toBe(403);
    expect((await search()).json()).toEqual({ items: [] });
    const edit = (revision: number) => app.inject({
      method: 'PATCH', url, headers: auth(), payload: { revision, title: 'Harvest Trade Forum' },
    });
    expect((await edit(1)).json()).toMatchObject({ revision: 2, title: 'Harvest Trade Forum' });
    expect((await edit(1)).statusCode).toBe(409);
    const publish = () => app.inject({ method: 'POST', url: url + '/publish', headers: auth() });
    await sql`ALTER TABLE public_search_documents ADD CONSTRAINT fixture_projection_failure CHECK (title <> 'Harvest Trade Forum')`.execute(database);
    try {
      expect((await publish()).statusCode).toBe(500);
      expect((await app.inject({ url, headers: auth() })).json()).toMatchObject({ revision: 2, status: 'draft' });
      expect((await search()).json()).toEqual({ items: [] });
    } finally {
      await sql`ALTER TABLE public_search_documents DROP CONSTRAINT fixture_projection_failure`.execute(database);
    }
    const concurrent = await Promise.all([publish(), publish()]);
    expect(concurrent.map(response => response.json().revision)).toEqual([3, 3]);
    expect((await search()).json()).toEqual({ items: [{ id, kind: 'event', title: 'Harvest Trade Forum', summary: draft.summary }] });
    expect((await edit(3)).statusCode).toBe(409);
    const withdraw = await app.inject({ method: 'POST', url: url + '/unpublish', headers: auth() });
    expect(withdraw.json()).toMatchObject({ revision: 4, status: 'draft' });
    expect((await search()).json()).toEqual({ items: [] });
    const revisions = await database.selectFrom('event_revisions').select('action').where('event_id', '=', id)
      .orderBy('revision').execute();
    expect(revisions.map(row => row.action)).toEqual(['created', 'edited', 'published', 'unpublished']);
  } finally { await app.close(); }
});
