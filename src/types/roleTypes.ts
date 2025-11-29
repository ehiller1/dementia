/**
 * Role Types
 * 
 * Locked enum for user roles. Prevents role drift ("Executive 2", "Executive 6").
 * 
 * Policy: role ∈ {executive, manager, analyst}
 */

export enum UserRole {
  EXECUTIVE = "executive",
  MANAGER = "manager",
  ANALYST = "analyst"
}

export function normalizeRole(input: string | undefined): UserRole {
  if (!input) return UserRole.EXECUTIVE;
  
  const normalized = input.toLowerCase().trim();
  
  // Map common variations
  if (normalized.includes("exec") || normalized.includes("c-level") || normalized.includes("vp")) {
    return UserRole.EXECUTIVE;
  }
  if (normalized.includes("manager") || normalized.includes("director")) {
    return UserRole.MANAGER;
  }
  if (normalized.includes("analyst") || normalized.includes("specialist")) {
    return UserRole.ANALYST;
  }
  
  // Default to executive
  return UserRole.EXECUTIVE;
}

export function getRoleDisplay(role: UserRole): string {
  switch (role) {
    case UserRole.EXECUTIVE:
      return "Executive";
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.ANALYST:
      return "Analyst";
  }
}

/**
 * Validate and log if model suggests invalid role
 */
export function validateRole(input: string): { valid: boolean; role: UserRole; warning?: string } {
  const normalized = normalizeRole(input);
  const isExact = Object.values(UserRole).includes(input as UserRole);
  
  if (!isExact) {
    return {
      valid: false,
      role: normalized,
      warning: `Invalid role "${input}" normalized to "${normalized}"`
    };
  }
  
  return { valid: true, role: normalized };
}
