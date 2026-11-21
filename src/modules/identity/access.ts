export const permissions = [
  'events.view', 'events.edit', 'events.manage', 'events.approve', 'events.check_in', 'events.export',
  'marketplace.view', 'marketplace.edit', 'marketplace.manage', 'marketplace.approve',
  'finance.view', 'finance.refunds.approve', 'team.manage',
] as const;
export type Permission = typeof permissions[number];

const presets = {
  admin: ['team.manage'],
  event_manager: ['events.view', 'events.edit', 'events.manage'],
  check_in_staff: ['events.view', 'events.check_in'],
  marketplace_manager: ['marketplace.view', 'marketplace.edit', 'marketplace.manage'],
  finance: ['finance.view'],
} satisfies Record<string, readonly Permission[]>;

export const roles = ['admin', 'event_manager', 'check_in_staff', 'marketplace_manager', 'finance'] as const;
export type Role = typeof roles[number];
export interface Access { roles: Role[]; permissions: Permission[] }

export function grantedPermissions(access: Access, owner: boolean): Permission[] {
  if (owner) return [...permissions];
  return [...new Set([...access.roles.flatMap(role => presets[role]), ...access.permissions])];
}

export function isPrivileged(access: Access): boolean {
  return access.roles.includes('admin') || access.permissions.some(permission =>
    permission === 'team.manage' || permission === 'events.export' || permission === 'finance.refunds.approve');
}
