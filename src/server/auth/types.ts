export type AuthenticatedIdentity = Readonly<{ issuer: string; subject: string }>;

export type AuthProvider = {
  getIdentity(): Promise<AuthenticatedIdentity | null>;
};
