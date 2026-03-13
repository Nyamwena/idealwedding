export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export enum UserRole {
  COUPLE = 'couple',
  VENDOR = 'vendor',
  PLANNER = 'planner',
  ADMIN = 'admin',
}
