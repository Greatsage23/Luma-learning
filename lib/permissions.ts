import type { AppRole } from "@/lib/supabase";

export type Permission="account:manage"|"teacher:create"|"teacher:assign"|"student:manage"|"resource:upload"|"resource:approve"|"assessment:create"|"grade:manage"|"profile:read-own"|"profile:update-own"|"audit:read"|"learning:view";
const permissions:Record<AppRole,ReadonlySet<Permission>>={
  administrator:new Set(["account:manage","teacher:create","teacher:assign","student:manage","resource:upload","resource:approve","assessment:create","grade:manage","profile:read-own","profile:update-own","audit:read","learning:view"]),
  teacher:new Set(["resource:upload","assessment:create","grade:manage","profile:read-own","profile:update-own","learning:view"]),
  student:new Set(["profile:read-own","profile:update-own","learning:view"]),
};
export const hasPermission=(role:AppRole,permission:Permission)=>permissions[role].has(permission);
