import { UserRole } from "@/db/schema";

export type UserPermission =
  | 'system_admin'
  | 'poll_creator'
  | 'poll_owner'
  | 'poll_manager'
  | 'view_analytics'
  | 'approve_statements'
  | 'edit_poll_settings'
  | 'manage_poll_roles'
  | 'create_poll';

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

/**
 * Check if user can create new polls
 * Requirements: System Admin OR Poll Creator OR Poll Manager (any poll)
 */
export function canCreatePoll(userRoles: UserRole[]): boolean {
  // System admins can always create polls
  if (userRoles.some(role => role.role === 'system_admin')) {
    return true;
  }

  // Users with poll_creator role can create polls
  if (userRoles.some(role => role.role === 'poll_creator')) {
    return true;
  }

  // Users who are managers of any poll can create polls
  if (userRoles.some(role => role.role === 'poll_manager')) {
    return true;
  }

  return false;
}

/**
 * Check if user is a system administrator
 */
export function isSystemAdmin(userRoles: UserRole[]): boolean {
  return userRoles.some(role => role.role === 'system_admin' && role.pollId === null);
}

/**
 * Check if user is a poll creator
 */
export function isPollCreator(userRoles: UserRole[]): boolean {
  return userRoles.some(role => role.role === 'poll_creator');
}

/**
 * Check if user can manage a specific poll
 */
export function canManagePoll(userRoles: UserRole[], pollId: string): boolean {
  // System admins can manage any poll
  if (isSystemAdmin(userRoles)) {
    return true;
  }

  // Check for owner or manager role for this specific poll
  return userRoles.some(
    role => role.pollId === pollId && (role.role === 'poll_owner' || role.role === 'poll_manager')
  );
}

/**
 * Check if user is owner of a specific poll
 */
export function isPollOwner(userRoles: UserRole[], pollId: string): boolean {
  // System admins have owner privileges on all polls
  if (isSystemAdmin(userRoles)) {
    return true;
  }

  return userRoles.some(
    role => role.pollId === pollId && role.role === 'poll_owner'
  );
}

/**
 * Check if user has any management roles (owns or manages any poll)
 */
export function hasAnyManagementRole(userRoles: UserRole[]): boolean {
  // System admins always have access
  if (isSystemAdmin(userRoles)) {
    return true;
  }

  // Check if user owns or manages any poll
  return userRoles.some(
    role => role.pollId !== null && (role.role === 'poll_owner' || role.role === 'poll_manager')
  );
}