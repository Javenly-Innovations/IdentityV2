export type Subdomain = 
  | 'identity.javenly.com'
  | 'account.javenly.com'
  | 'admin-identity.javenly.com'
  | 'api-identity.javenly.com'
  | 'sandbox.javenly.com'
  | 'docs.javenly.com';

export interface JavenlyUser {
  id: string; // Stable OIDC UUID 'sub'
  email: string;
  fullName: string;
  username: string;
  avatarUrl: string;
  bio?: string;
  jobTitle?: string;
  department?: string;
  company: string;
  role: 'super_admin' | 'admin' | 'developer' | 'user';
  emailVerified: boolean;
  mfaEnabled: boolean;
  createdAt: string;
  lastLoginAt: string;
  status: 'active' | 'suspended' | 'pending';
  metadata: Record<string, any>;
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  browser: string;
  device: string;
  location: string;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface OAuthApplication {
  id: string;
  clientId: string;
  clientSecret?: string; // Only for confidential web apps
  name: string;
  description: string;
  appType: 'spa' | 'web_confidential' | 'native_mobile' | 'm2m';
  logoUrl?: string;
  homepageUrl: string;
  redirectUris: string[];
  logoutUris: string[];
  allowedOrigins: string[];
  scopes: string[];
  status: 'active' | 'development' | 'suspended';
  createdAt: string;
  ownerId: string;
}

export interface ConnectedApp {
  id: string;
  userId: string;
  applicationId: string;
  applicationName: string;
  clientId: string;
  authorizedAt: string;
  lastUsedAt: string;
  grantedScopes: string[];
  icon: string;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  eventType: 
    | 'auth.login.success'
    | 'auth.login.failed'
    | 'auth.register.success'
    | 'auth.logout'
    | 'auth.mfa.enabled'
    | 'auth.mfa.verified'
    | 'auth.password.changed'
    | 'oauth.authorize.granted'
    | 'oauth.authorize.denied'
    | 'oauth.token.exchanged'
    | 'session.revoked'
    | 'admin.user.suspended'
    | 'admin.user.activated'
    | 'admin.app.created';
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  actor: string;
  status: 'success' | 'warning' | 'failure';
  details: string;
}

export interface PKCEAuthRequest {
  clientId: string;
  redirectUri: string;
  responseType: 'code';
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  appName?: string;
}
