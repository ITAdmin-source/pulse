import { describe, it, expect } from 'vitest'
import { hasPermission, canUserAccessPoll, UserPermission } from '@/lib/utils/permissions'
import { UserRole } from '@/db/schema'

// Helper function to create mock user roles
function createMockUserRole(
  role: 'system_admin' | 'poll_owner' | 'poll_manager',
  pollId?: string
): UserRole {
  return {
    id: `role-${role}-${pollId || 'system'}`,
    userId: 'user-123',
    role,
    pollId: pollId || null,
    assignedAt: new Date(),
    assignedBy: 'admin-user',
  } as UserRole
}

describe('Permissions Utilities', () => {
  describe('hasPermission', () => {
    const TEST_POLL_ID = 'poll-123'

    describe('system admin permissions', () => {
      const systemAdminRoles = [createMockUserRole('system_admin')]

      it('should grant all permissions to system admin', () => {
        const permissions: UserPermission[] = [
          'system_admin',
          'poll_owner',
          'poll_manager',
          'view_analytics',
          'approve_statements',
          'edit_poll_settings',
          'manage_poll_roles',
        ]

        permissions.forEach(permission => {
          expect(hasPermission(systemAdminRoles, permission, TEST_POLL_ID)).toBe(true)
        })
      })

      it('should grant permissions without poll ID', () => {
        expect(hasPermission(systemAdminRoles, 'system_admin')).toBe(true)
        expect(hasPermission(systemAdminRoles, 'poll_owner')).toBe(true)
      })
    })

    describe('poll owner permissions', () => {
      const pollOwnerRoles = [createMockUserRole('poll_owner', TEST_POLL_ID)]

      it('should grant poll owner permission', () => {
        expect(hasPermission(pollOwnerRoles, 'poll_owner', TEST_POLL_ID)).toBe(true)
      })

      it('should grant poll manager permission (owner inherits manager)', () => {
        expect(hasPermission(pollOwnerRoles, 'poll_manager', TEST_POLL_ID)).toBe(true)
      })

      it('should grant analytics permission', () => {
        expect(hasPermission(pollOwnerRoles, 'view_analytics', TEST_POLL_ID)).toBe(true)
      })

      it('should grant statement approval permission', () => {
        expect(hasPermission(pollOwnerRoles, 'approve_statements', TEST_POLL_ID)).toBe(true)
      })

      it('should grant poll settings edit permission', () => {
        expect(hasPermission(pollOwnerRoles, 'edit_poll_settings', TEST_POLL_ID)).toBe(true)
      })

      it('should grant role management permission', () => {
        expect(hasPermission(pollOwnerRoles, 'manage_poll_roles', TEST_POLL_ID)).toBe(true)
      })

      it('should deny permissions for different poll', () => {
        const differentPollId = 'poll-456'
        expect(hasPermission(pollOwnerRoles, 'poll_owner', differentPollId)).toBe(false)
        expect(hasPermission(pollOwnerRoles, 'poll_manager', differentPollId)).toBe(false)
      })

      it('should deny system admin permission', () => {
        expect(hasPermission(pollOwnerRoles, 'system_admin', TEST_POLL_ID)).toBe(false)
      })

      it('should deny permissions without poll ID', () => {
        expect(hasPermission(pollOwnerRoles, 'poll_owner')).toBe(false)
        expect(hasPermission(pollOwnerRoles, 'poll_manager')).toBe(false)
      })
    })

    describe('poll manager permissions', () => {
      const pollManagerRoles = [createMockUserRole('poll_manager', TEST_POLL_ID)]

      it('should grant poll manager permission', () => {
        expect(hasPermission(pollManagerRoles, 'poll_manager', TEST_POLL_ID)).toBe(true)
      })

      it('should grant analytics permission', () => {
        expect(hasPermission(pollManagerRoles, 'view_analytics', TEST_POLL_ID)).toBe(true)
      })

      it('should grant statement approval permission', () => {
        expect(hasPermission(pollManagerRoles, 'approve_statements', TEST_POLL_ID)).toBe(true)
      })

      it('should grant poll settings edit permission', () => {
        expect(hasPermission(pollManagerRoles, 'edit_poll_settings', TEST_POLL_ID)).toBe(true)
      })

      it('should deny poll owner permission', () => {
        expect(hasPermission(pollManagerRoles, 'poll_owner', TEST_POLL_ID)).toBe(false)
      })

      it('should deny role management permission', () => {
        expect(hasPermission(pollManagerRoles, 'manage_poll_roles', TEST_POLL_ID)).toBe(false)
      })

      it('should deny system admin permission', () => {
        expect(hasPermission(pollManagerRoles, 'system_admin', TEST_POLL_ID)).toBe(false)
      })
    })

    describe('multiple roles', () => {
      it('should work with multiple poll roles', () => {
        const multipleRoles = [
          createMockUserRole('poll_manager', 'poll-1'),
          createMockUserRole('poll_owner', 'poll-2'),
          createMockUserRole('poll_manager', 'poll-3'),
        ]

        expect(hasPermission(multipleRoles, 'poll_manager', 'poll-1')).toBe(true)
        expect(hasPermission(multipleRoles, 'poll_owner', 'poll-2')).toBe(true)
        expect(hasPermission(multipleRoles, 'poll_manager', 'poll-3')).toBe(true)

        expect(hasPermission(multipleRoles, 'poll_owner', 'poll-1')).toBe(false)
        expect(hasPermission(multipleRoles, 'poll_manager', 'poll-4')).toBe(false)
      })

      it('should work with system admin + poll roles', () => {
        const mixedRoles = [
          createMockUserRole('system_admin'),
          createMockUserRole('poll_owner', TEST_POLL_ID),
        ]

        // System admin should override everything
        expect(hasPermission(mixedRoles, 'system_admin')).toBe(true)
        expect(hasPermission(mixedRoles, 'poll_owner', 'any-poll')).toBe(true)
        expect(hasPermission(mixedRoles, 'manage_poll_roles', 'any-poll')).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should handle empty roles array', () => {
        expect(hasPermission([], 'poll_owner', TEST_POLL_ID)).toBe(false)
        expect(hasPermission([], 'system_admin')).toBe(false)
      })

      it('should handle roles without poll ID when poll ID is required', () => {
        const systemRoles = [createMockUserRole('system_admin')]
        expect(hasPermission(systemRoles, 'poll_owner', TEST_POLL_ID)).toBe(true) // System admin
      })

      it('should handle invalid permission types', () => {
        const roles = [createMockUserRole('poll_owner', TEST_POLL_ID)]
        expect(hasPermission(roles, 'invalid_permission' as UserPermission, TEST_POLL_ID)).toBe(false)
      })

      it('should handle null poll ID', () => {
        const roles = [createMockUserRole('poll_owner', TEST_POLL_ID)]
        expect(hasPermission(roles, 'poll_owner', undefined)).toBe(false)
      })

      it('should handle role with null poll ID', () => {
        const rolesWithNullPoll = [
          { ...createMockUserRole('poll_owner', TEST_POLL_ID), pollId: null }
        ]
        expect(hasPermission(rolesWithNullPoll, 'poll_owner', TEST_POLL_ID)).toBe(false)
      })
    })

    describe('permission inheritance', () => {
      it('should verify poll owner inherits manager permissions', () => {
        const ownerRoles = [createMockUserRole('poll_owner', TEST_POLL_ID)]
        const managerPermissions: UserPermission[] = [
          'view_analytics',
          'approve_statements',
          'edit_poll_settings',
        ]

        managerPermissions.forEach(permission => {
          expect(hasPermission(ownerRoles, permission, TEST_POLL_ID)).toBe(true)
        })
      })

      it('should verify manager does not inherit owner-only permissions', () => {
        const managerRoles = [createMockUserRole('poll_manager', TEST_POLL_ID)]
        const ownerOnlyPermissions: UserPermission[] = [
          'manage_poll_roles',
        ]

        ownerOnlyPermissions.forEach(permission => {
          expect(hasPermission(managerRoles, permission, TEST_POLL_ID)).toBe(false)
        })
      })
    })
  })

  describe('canUserAccessPoll', () => {
    const TEST_POLL_ID = 'poll-123'

    describe('published polls', () => {
      it('should allow access to published polls for any user', () => {
        expect(canUserAccessPoll([], TEST_POLL_ID, 'published')).toBe(true)
      })

      it('should allow access to published polls even with roles', () => {
        const roles = [createMockUserRole('poll_manager', 'different-poll')]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'published')).toBe(true)
      })
    })

    describe('draft polls', () => {
      it('should deny access to draft polls for users without permissions', () => {
        expect(canUserAccessPoll([], TEST_POLL_ID, 'draft')).toBe(false)
      })

      it('should allow access to draft polls for poll managers', () => {
        const roles = [createMockUserRole('poll_manager', TEST_POLL_ID)]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'draft')).toBe(true)
      })

      it('should allow access to draft polls for poll owners', () => {
        const roles = [createMockUserRole('poll_owner', TEST_POLL_ID)]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'draft')).toBe(true)
      })

      it('should allow access to draft polls for system admins', () => {
        const roles = [createMockUserRole('system_admin')]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'draft')).toBe(true)
      })

      it('should deny access to draft polls for wrong poll roles', () => {
        const roles = [createMockUserRole('poll_manager', 'different-poll')]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'draft')).toBe(false)
      })
    })

    describe('closed polls', () => {
      it('should deny access to closed polls for users without permissions', () => {
        expect(canUserAccessPoll([], TEST_POLL_ID, 'closed')).toBe(false)
      })

      it('should allow access to closed polls for poll managers', () => {
        const roles = [createMockUserRole('poll_manager', TEST_POLL_ID)]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'closed')).toBe(true)
      })

      it('should allow access to closed polls for poll owners', () => {
        const roles = [createMockUserRole('poll_owner', TEST_POLL_ID)]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'closed')).toBe(true)
      })

      it('should allow access to closed polls for system admins', () => {
        const roles = [createMockUserRole('system_admin')]
        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'closed')).toBe(true)
      })
    })

    describe('edge cases', () => {
      it('should handle empty roles for all poll statuses', () => {
        expect(canUserAccessPoll([], TEST_POLL_ID, 'published')).toBe(true)
        expect(canUserAccessPoll([], TEST_POLL_ID, 'draft')).toBe(false)
        expect(canUserAccessPoll([], TEST_POLL_ID, 'closed')).toBe(false)
      })

      it('should handle multiple roles with mixed permissions', () => {
        const roles = [
          createMockUserRole('poll_manager', 'other-poll'),
          createMockUserRole('poll_owner', TEST_POLL_ID),
        ]

        expect(canUserAccessPoll(roles, TEST_POLL_ID, 'draft')).toBe(true)
        expect(canUserAccessPoll(roles, 'other-poll', 'draft')).toBe(true)
        expect(canUserAccessPoll(roles, 'unrelated-poll', 'draft')).toBe(false)
      })

      it('should handle system admin with poll-specific roles', () => {
        const roles = [
          createMockUserRole('system_admin'),
          createMockUserRole('poll_owner', TEST_POLL_ID),
        ]

        expect(canUserAccessPoll(roles, 'any-poll', 'draft')).toBe(true)
        expect(canUserAccessPoll(roles, 'any-poll', 'closed')).toBe(true)
      })
    })

    describe('poll status validation', () => {
      it('should work with all valid poll statuses', () => {
        const systemAdminRoles = [createMockUserRole('system_admin')]

        const statuses: ('draft' | 'published' | 'closed')[] = ['draft', 'published', 'closed']
        statuses.forEach(status => {
          expect(canUserAccessPoll(systemAdminRoles, TEST_POLL_ID, status)).toBe(true)
        })
      })
    })
  })

  describe('UserPermission type coverage', () => {
    it('should handle all defined permission types', () => {
      const allPermissions: UserPermission[] = [
        'system_admin',
        'poll_owner',
        'poll_manager',
        'view_analytics',
        'approve_statements',
        'edit_poll_settings',
        'manage_poll_roles',
      ]

      const systemAdminRoles = [createMockUserRole('system_admin')]

      allPermissions.forEach(permission => {
        // System admin should have all permissions
        expect(hasPermission(systemAdminRoles, permission, 'test-poll')).toBe(true)
      })
    })
  })
})