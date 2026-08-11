/**
 * Centralized role checking for Supabase user roles.
 * Supported roles in Supabase user_role_enum:
 * - Admin/Management: super_admin, regional_admin, business_admin, moderator, support, admin, owner
 * - Regular Users: user, viewer
 */

export const ADMIN_ROLES = [
  "ADMIN",
  "SUPER_ADMIN",
  "REGIONAL_ADMIN",
  "BUSINESS_ADMIN",
  "MODERATOR",
  "SUPPORT",
  "OWNER",
];

export function isAdminRole(role?: string | null): boolean {
  if (!role) return false;
  return ADMIN_ROLES.includes(role.trim().toUpperCase());
}
