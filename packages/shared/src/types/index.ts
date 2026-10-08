// Shared plain TypeScript types (no Zod or Prisma dependencies)

/** The user object returned in auth responses (register, login, me). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: Date | string;
}

/** The standard auth response shape returned by register and login. */
export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
