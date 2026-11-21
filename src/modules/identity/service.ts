import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { sql } from 'kysely';
import type { Kysely, Transaction } from 'kysely';
import type { IdentityClaims } from './tokens.js';
import { grantedPermissions, isPrivileged } from './access.js';
import type { Access, Permission } from './access.js';
import type { PlatformDatabase } from '../../platform/database.js';

export class IdentityError extends Error {
  constructor(readonly status: 403 | 404 | 409, message: string) { super(message); }
}

const hash = (token: string) => createHash('sha256').update(token).digest('hex');

export function createIdentityService(db: Kysely<PlatformDatabase>) {
  function membership(database: Kysely<PlatformDatabase>, organisationId: string, userId: string) {
    return database.selectFrom('organisation_members').innerJoin('organisations', 'organisations.id', 'organisation_members.organisation_id')
      .select(['roles', 'permissions', 'owner_id']).where('organisation_id', '=', organisationId)
      .where('user_id', '=', userId).where('active', '=', true).executeTakeFirst();
  }

  async function audit(tx: Transaction<PlatformDatabase>, organisationId: string, actorId: string, action: string, targetUserId: string | null = null) {
    await tx.insertInto('organisation_access_audit').values({
      id: randomUUID(), organisation_id: organisationId, actor_id: actorId, action, target_user_id: targetUserId,
    }).execute();
  }

  async function lock(tx: Transaction<PlatformDatabase>, organisationId: string) {
    const org = await tx.selectFrom('organisations').select('id').where('id', '=', organisationId).forUpdate().executeTakeFirst();
    if (!org) throw new IdentityError(404, 'Organisation unavailable.');
  }

  async function manager(database: Kysely<PlatformDatabase>, organisationId: string, actorId: string) {
    const actor = await membership(database, organisationId, actorId);
    if (!actor) throw new IdentityError(404, 'Organisation unavailable.');
    const owner = actor.owner_id === actorId;
    if (!grantedPermissions(actor, owner).includes('team.manage')) throw new IdentityError(403, 'Team management access is required.');
    return { owner, ownerId: actor.owner_id };
  }

  function requireGrant(owner: boolean, access: Access) {
    if (!owner && isPrivileged(access)) throw new IdentityError(403, 'Only the owner can manage privileged access.');
  }

  return {
    async requireOrganisationPermission(tx: Transaction<PlatformDatabase>, organisationId: string, actorId: string, permission: Permission) {
      await lock(tx, organisationId);
      const actor = await membership(tx, organisationId, actorId);
      if (!actor) throw new IdentityError(404, 'Organisation unavailable.');
      if (!grantedPermissions(actor, actor.owner_id === actorId).includes(permission)) {
        throw new IdentityError(403, 'Organisation permission required.');
      }
    },
    async principal(claims: IdentityClaims) {
      const key = { issuer: claims.issuer, subject: claims.subject };
      const existing = () => db.selectFrom('identity_users').select('id')
        .where('issuer', '=', key.issuer).where('subject', '=', key.subject).executeTakeFirst();
      const user = await existing() ?? await db.insertInto('identity_users').values({ ...key, id: randomUUID() })
        .onConflict(conflict => conflict.columns(['issuer', 'subject']).doNothing()).returning('id').executeTakeFirst()
        ?? await existing();
      if (!user) throw new Error('Identity could not be provisioned.');
      return user.id;
    },
    async createOrganisation(actorId: string, name: string) {
      const id = randomUUID();
      return db.transaction().execute(async tx => {
        await tx.insertInto('organisations').values({ id, name, owner_id: actorId }).execute();
        await tx.insertInto('organisation_members').values({
          organisation_id: id, user_id: actorId, active: true, roles: [], permissions: [], revoked_at: null,
        }).execute();
        await audit(tx, id, actorId, 'organisation.created');
        return { id, name };
      });
    },
    async organisations(actorId: string, after?: string) {
      let query = db.selectFrom('organisation_members').innerJoin('organisations', 'organisations.id', 'organisation_members.organisation_id')
        .select(['organisations.id', 'name', 'owner_id', 'roles', 'permissions'])
        .where('user_id', '=', actorId).where('active', '=', true);
      if (after) query = query.where('organisations.id', '>', after);
      const rows = await query.orderBy('organisations.id').limit(51).execute();
      const items = rows.slice(0, 50).map(row => ({
        id: row.id, name: row.name, owner: row.owner_id === actorId,
        permissions: grantedPermissions(row, row.owner_id === actorId),
      }));
      return { items, nextCursor: rows.length > 50 ? items.at(-1)!.id : null };
    },
    async listTeam(organisationId: string, actorId: string, after?: string) {
      return db.transaction().execute(async tx => {
        await lock(tx, organisationId);
        const { ownerId } = await manager(tx, organisationId, actorId);
        let query = tx.selectFrom('organisation_members').select(['user_id', 'roles', 'permissions', 'active'])
          .where('organisation_id', '=', organisationId);
        if (after) query = query.where('user_id', '>', after);
        const rows = await query.orderBy('user_id').limit(51).execute();
        const items = rows.slice(0, 50).map(row => ({
          userId: row.user_id, roles: row.roles, permissions: row.permissions, active: row.active,
          owner: row.user_id === ownerId, effectivePermissions: row.active ? grantedPermissions(row, row.user_id === ownerId) : [],
        }));
        return { items, nextCursor: rows.length > 50 ? items.at(-1)!.userId : null };
      });
    },
    async invite(organisationId: string, actorId: string, email: string, access: Access) {
      return db.transaction().execute(async tx => {
        await lock(tx, organisationId);
        const { owner } = await manager(tx, organisationId, actorId);
        requireGrant(owner, access);
        const token = randomBytes(32).toString('base64url');
        const row = await tx.insertInto('organisation_invitations').values({
          ...access, token_hash: hash(token), organisation_id: organisationId,
          inviter_id: actorId, email, expires_at: sql<Date>`clock_timestamp() + interval '48 hours'`, accepted_at: null,
        }).returning('expires_at').executeTakeFirstOrThrow();
        await audit(tx, organisationId, actorId, 'team.invited');
        return { token, expiresAt: row.expires_at.toISOString() };
      });
    },
    async accept(actorId: string, verifiedEmail: string | undefined, token: string) {
      if (!verifiedEmail) throw new IdentityError(403, 'Verified email is required.');
      const tokenHash = hash(token);
      return db.transaction().execute(async tx => {
        const reference = await tx.selectFrom('organisation_invitations').select('organisation_id')
          .where('token_hash', '=', tokenHash).executeTakeFirst();
        if (!reference) throw new IdentityError(404, 'Invitation unavailable.');
        const id = reference.organisation_id;
        await lock(tx, id);
        const invite = await tx.selectFrom('organisation_invitations').selectAll()
          .where('token_hash', '=', tokenHash).where('email', '=', verifiedEmail)
          .where('accepted_at', 'is', null).where('expires_at', '>', sql<Date>`clock_timestamp()`).executeTakeFirst();
        if (!invite) throw new IdentityError(404, 'Invitation unavailable.');
        const inviter = await manager(tx, id, invite.inviter_id);
        requireGrant(inviter.owner, invite);
        if (await membership(tx, id, actorId)) throw new IdentityError(409, 'Already an active member.');
        const prior = await tx.selectFrom('organisation_members').select('user_id')
          .where('organisation_id', '=', id).where('user_id', '=', actorId)
          .where('revoked_at', '>=', sql<Date>`(select issued_at from organisation_invitations where token_hash = ${tokenHash})`).executeTakeFirst();
        if (prior) throw new IdentityError(404, 'Invitation unavailable.');
        const access = { roles: invite.roles, permissions: invite.permissions, active: true, revoked_at: null };
        await tx.insertInto('organisation_members').values({ ...access, organisation_id: id, user_id: actorId })
          .onConflict(conflict => conflict.columns(['organisation_id', 'user_id']).doUpdateSet(access)).execute();
        await tx.updateTable('organisation_invitations').set({ accepted_at: sql<Date>`clock_timestamp()` })
          .where('token_hash', '=', tokenHash).execute();
        await audit(tx, id, actorId, 'team.joined', actorId);
        return { id };
      });
    },
    async changeAccess(organisationId: string, actorId: string, targetId: string, access: Access | null) {
      await db.transaction().execute(async tx => {
        await lock(tx, organisationId);
        const actor = await manager(tx, organisationId, actorId);
        if (actorId === targetId || actor.ownerId === targetId) throw new IdentityError(403, 'Owner and self access are protected.');
        const target = await membership(tx, organisationId, targetId);
        if (!target) throw new IdentityError(404, 'Team member unavailable.');
        requireGrant(actor.owner, target);
        if (access) requireGrant(actor.owner, access);
        await tx.updateTable('organisation_members')
          .set(access ?? { active: false, roles: [], permissions: [], revoked_at: sql<Date>`clock_timestamp()` })
          .where('organisation_id', '=', organisationId).where('user_id', '=', targetId).execute();
        await tx.deleteFrom('organisation_invitations').where('organisation_id', '=', organisationId)
          .where('inviter_id', '=', targetId).where('accepted_at', 'is', null).execute();
        await audit(tx, organisationId, actorId, access ? 'team.access_changed' : 'team.removed', targetId);
      });
    },
  };
}
