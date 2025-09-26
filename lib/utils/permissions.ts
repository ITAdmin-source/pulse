import { UserRole } from "@/db/schema";

export type UserPermission =
  | 'system_admin'
  | 'poll_owner'
  | 'poll_manager'
  | 'view_analytics'
  | 'approve_statements'
  | 'edit_poll_settings'
  | 'manage_poll_roles';

export function hasPermission(
  userRoles: UserRole[],
  permission: UserPermission,
  pollId?: string
): boolean {
  // System admin has all permissions
  const isSystemAdmin = userRoles.some(role => role.role === 'system_admin');
  if (isSystemAdmin) return true;

  // Poll-specific permissions
  if (pollId) {
    const pollRoles = userRoles.filter(role => role.pollId === pollId);

    switch (permission) {
      case 'poll_owner':
        return pollRoles.some(role => role.role === 'poll_owner');

      case 'poll_manager':
        return pollRoles.some(role =>
          role.role === 'poll_owner' || role.role === 'poll_manager'
        );

      case 'view_analytics':
      case 'approve_statements':
      case 'edit_poll_settings':
        return pollRoles.some(role =>
          role.role === 'poll_owner' || role.role === 'poll_manager'
        );

      case 'manage_poll_roles':
        return pollRoles.some(role => role.role === 'poll_owner');

      default:
        return false;
    }
  }

  return false;
}

export function canUserAccessPoll(
  userRoles: UserRole[],
  pollId: string,
  pollStatus: 'draft' | 'published' | 'closed'
): boolean {
  // Published polls are public
  if (pollStatus === 'published') return true;

  // Draft and closed polls require management permissions
  return hasPermission(userRoles, 'poll_manager', pollId);
}