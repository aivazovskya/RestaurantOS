export interface VerifiedUserPayload {
  userId: string;
  role: string;
  organizationId?: string;
  branchIds: string[];
  courierId?: string;
  fullName?: string;
  email?: string;
}

export interface CredentialProvider {
  verify(identifier: string, secret: string): Promise<VerifiedUserPayload>;
}
