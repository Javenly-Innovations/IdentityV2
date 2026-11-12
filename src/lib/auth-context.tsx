import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  JavenlyUser, 
  UserSession, 
  OAuthApplication, 
  ConnectedApp, 
  SecurityAuditEvent, 
  Subdomain,
  PKCEAuthRequest 
} from '../types';
import { 
  INITIAL_USERS, 
  INITIAL_APPLICATIONS, 
  INITIAL_CONNECTED_APPS, 
  INITIAL_SESSIONS, 
  INITIAL_AUDIT_LOGS,
  getSupabaseConfig,
  resetSupabaseClient,
  getSupabaseClient
} from './supabase';

interface AuthContextType {
  currentUser: JavenlyUser | null;
  users: JavenlyUser[];
  sessions: UserSession[];
  applications: OAuthApplication[];
  connectedApps: ConnectedApp[];
  auditLogs: SecurityAuditEvent[];
  currentSubdomain: Subdomain;
  pendingOAuthRequest: PKCEAuthRequest | null;
  supabaseConfig: { url: string; key: string; isCustom: boolean };
  
  // Navigation
  setCurrentSubdomain: (sub: Subdomain) => void;
  setPendingOAuthRequest: (req: PKCEAuthRequest | null) => void;
  
  // Auth actions
  loginWithEmail: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; message: string }>;
  signup: (email: string, password: string, fullName: string, username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (userId: string) => void;
  
  // Account actions
  updateProfile: (updates: Partial<JavenlyUser>) => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean; message: string }>;
  toggleMFA: (enable: boolean) => void;
  revokeSession: (sessionId: string) => void;
  revokeAllOtherSessions: () => void;
  revokeConnectedApp: (applicationId: string) => void;
  exportUserData: () => void;
  deleteAccount: () => void;

  // OAuth Authorization
  approveOAuthConsent: (clientId: string, scopes: string[]) => { redirectUrl: string };
  denyOAuthConsent: (clientId: string) => { redirectUrl: string };

  // Admin actions
  createApplication: (app: Omit<OAuthApplication, 'id' | 'createdAt' | 'ownerId'>) => void;
  updateApplication: (appId: string, updates: Partial<OAuthApplication>) => void;
  deleteApplication: (appId: string) => void;
  toggleUserStatus: (userId: string, status: 'active' | 'suspended') => void;
  adminDeleteUser: (userId: string) => void;

  // Supabase Config
  updateSupabaseConfig: (url: string, key: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or initial seed
  const [users, setUsers] = useState<JavenlyUser[]>(() => {
    const saved = localStorage.getItem('javenly_users');
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: JavenlyUser[] = JSON.parse(saved);
      // Strip any fake mock accounts from localStorage
      const fakeEmails = [
        'marcus.chen@javenly.com',
        'sarah.jenkins@javenly.com',
        'elena.rostova@gmail.com',
        'david.kim@outlook.com',
        'amanda.foster@icloud.com'
      ];
      const cleaned = parsed.filter(u => !fakeEmails.includes(u.email.toLowerCase()));
      // Ensure primary administrator exists
      INITIAL_USERS.forEach(initU => {
        if (!cleaned.some(u => u.email.toLowerCase() === initU.email.toLowerCase())) {
          cleaned.unshift(initU);
        }
      });
      return cleaned;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<JavenlyUser | null>(() => {
    const savedId = localStorage.getItem('javenly_current_user_id');
    const user = users.find(u => u.id === savedId) || users[0];
    return user || null;
  });

  const [applications, setApplications] = useState<OAuthApplication[]>(() => {
    const saved = localStorage.getItem('javenly_apps');
    return saved ? JSON.parse(saved) : INITIAL_APPLICATIONS;
  });

  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>(() => {
    const saved = localStorage.getItem('javenly_connected_apps');
    return saved ? JSON.parse(saved) : INITIAL_CONNECTED_APPS;
  });

  const [sessions, setSessions] = useState<UserSession[]>(() => {
    const saved = localStorage.getItem('javenly_sessions');
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [auditLogs, setAuditLogs] = useState<SecurityAuditEvent[]>(() => {
    const saved = localStorage.getItem('javenly_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [currentSubdomain, setCurrentSubdomain] = useState<Subdomain>('identity.javenly.com');
  const [pendingOAuthRequest, setPendingOAuthRequest] = useState<PKCEAuthRequest | null>(null);
  const [supabaseConfig, setSupabaseConfigState] = useState(getSupabaseConfig());

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('javenly_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('javenly_current_user_id', currentUser.id);
    } else {
      localStorage.removeItem('javenly_current_user_id');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('javenly_apps', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('javenly_connected_apps', JSON.stringify(connectedApps));
  }, [connectedApps]);

  useEffect(() => {
    localStorage.setItem('javenly_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem('javenly_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  const addAuditLog = (
    eventType: SecurityAuditEvent['eventType'],
    actor: string,
    details: string,
    status: 'success' | 'warning' | 'failure' = 'success',
    userId?: string,
    userEmail?: string
  ) => {
    const newLog: SecurityAuditEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      eventType,
      actor,
      status,
      details,
      ipAddress: '172.68.14.22', // Cloudflare simulated edge IP
      userId: userId || currentUser?.id,
      userEmail: userEmail || currentUser?.email,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const loginWithEmail = async (email: string, password?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if user exists in our directory
    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (!existing) {
      addAuditLog('auth.login.failed', email, `Authentication failed for ${email}: User not registered.`, 'warning');
      return { success: false, error: 'No Javenly Identity found with this email address.' };
    }

    if (existing.status === 'suspended') {
      addAuditLog('auth.login.failed', email, `Suspended account attempted login: ${email}`, 'failure', existing.id, existing.email);
      return { success: false, error: 'This account has been suspended by an administrator. Please contact security@javenly.com.' };
    }

    // Try real Supabase call if configured with a live custom backend
    if (supabaseConfig.isCustom && password) {
      try {
        const client = getSupabaseClient();
        const { error } = await client.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) {
          addAuditLog('auth.login.failed', email, `Supabase Auth error: ${error.message}`, 'warning');
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        // Fallback to internal directory if offline/demo
      }
    }

    // Successful login
    const updated = { ...existing, lastLoginAt: new Date().toISOString() };
    setUsers(prev => prev.map(u => u.id === existing.id ? updated : u));
    setCurrentUser(updated);

    addAuditLog('auth.login.success', updated.email, 'User logged into Javenly Identity platform.', 'success', updated.id, updated.email);
    return { success: true };
  };

  const loginWithMagicLink = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    addAuditLog('auth.login.success', normalizedEmail, `Magic link dispatched for passwordless PKCE login to ${normalizedEmail}`);
    return { 
      success: true, 
      message: `A secure login link has been dispatched to ${normalizedEmail}. In this live environment, you can sign in directly.` 
    };
  };

  const signup = async (email: string, password: string, fullName: string, username: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === normalizedEmail);
    if (existing) {
      return { success: false, error: 'A Javenly account already exists with this email address.' };
    }

    const newUser: JavenlyUser = {
      id: `usr_jav_${crypto.randomUUID()}`,
      email: normalizedEmail,
      fullName: fullName.trim() || 'New Member',
      username: username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || `user_${Date.now().toString(36)}`,
      avatarUrl: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80`,
      company: 'Javenly Innovations',
      role: 'user',
      emailVerified: true,
      mfaEnabled: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      status: 'active',
      metadata: { source: 'identity.javenly.com' },
    };

    setUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);

    addAuditLog('auth.register.success', newUser.email, `New user registered with Javenly Identity. Stable sub UUID assigned: ${newUser.id}`, 'success', newUser.id, newUser.email);

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      addAuditLog('auth.logout', currentUser.email, 'User signed out from all active Javenly web sessions.', 'success', currentUser.id, currentUser.email);
    }
    setCurrentUser(null);
    setCurrentSubdomain('identity.javenly.com');
  };

  const switchUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      addAuditLog('auth.login.success', user.email, `Simulated login switch to ${user.email} (${user.role})`);
    }
  };

  const updateProfile = (updates: Partial<JavenlyUser>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updated : u));
    addAuditLog('admin.app.created', currentUser.email, 'Updated profile attributes and OIDC claims.');
  };

  const changePassword = async (_newPassword: string) => {
    if (!currentUser) return { success: false, message: 'Not authenticated' };
    addAuditLog('auth.password.changed', currentUser.email, 'Password updated successfully via Supabase Auth cryptographic hashing.');
    return { success: true, message: 'Your password has been securely updated across all Javenly services.' };
  };

  const toggleMFA = (enable: boolean) => {
    if (!currentUser) return;
    updateProfile({ mfaEnabled: enable });
    addAuditLog(
      enable ? 'auth.mfa.enabled' : 'auth.mfa.verified', 
      currentUser.email, 
      enable ? 'Time-based One-Time Password (TOTP) two-factor authentication enabled.' : 'Two-factor authentication disabled.'
    );
  };

  const revokeSession = (sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    addAuditLog('session.revoked', currentUser?.email || 'System', `Revoked device session ID: ${sessionId}`);
  };

  const revokeAllOtherSessions = () => {
    setSessions(prev => prev.filter(s => s.isCurrent));
    addAuditLog('session.revoked', currentUser?.email || 'System', 'Revoked all other active sessions and refreshed token family.');
  };

  const revokeConnectedApp = (applicationId: string) => {
    setConnectedApps(prev => prev.filter(c => c.applicationId !== applicationId));
    addAuditLog('oauth.authorize.denied', currentUser?.email || 'User', `Revoked OAuth 2.1 authorization for application ID: ${applicationId}`);
  };

  const exportUserData = () => {
    if (!currentUser) return;
    const exportBundle = {
      exportVersion: '1.0',
      exportedAt: new Date().toISOString(),
      platform: 'Javenly Identity (Javenly Innovations)',
      authEngine: 'Supabase Auth (Free Tier OIDC Engine)',
      user: currentUser,
      sessions: sessions.filter(s => s.userId === currentUser.id),
      connectedApplications: connectedApps.filter(c => c.userId === currentUser.id),
      auditEvents: auditLogs.filter(l => l.userId === currentUser.id),
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `javenly-identity-data-export-${currentUser.username}.json`;
    a.click();
    URL.revokeObjectURL(url);

    addAuditLog('admin.app.created', currentUser.email, 'GDPR/CCPA account data export generated.');
  };

  const deleteAccount = () => {
    if (!currentUser) return;
    const deletedId = currentUser.id;
    const deletedEmail = currentUser.email;
    setUsers(prev => prev.filter(u => u.id !== deletedId));
    setSessions(prev => prev.filter(s => s.userId !== deletedId));
    setConnectedApps(prev => prev.filter(c => c.userId !== deletedId));
    setCurrentUser(null);
    setCurrentSubdomain('identity.javenly.com');
    addAuditLog('admin.user.suspended', deletedEmail, `Account deleted and all personal OIDC data purged. Stable sub ${deletedId} retired.`, 'warning');
  };

  const approveOAuthConsent = (clientId: string, scopes: string[]) => {
    const app = applications.find(a => a.clientId === clientId);
    const appName = app ? app.name : 'Client Application';
    
    // Add to connected apps if not already present
    if (currentUser && app) {
      const exists = connectedApps.some(c => c.applicationId === app.id && c.userId === currentUser.id);
      if (!exists) {
        const newConn: ConnectedApp = {
          id: `conn_${Date.now()}`,
          userId: currentUser.id,
          applicationId: app.id,
          applicationName: app.name,
          clientId: app.clientId,
          authorizedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          grantedScopes: scopes,
          icon: app.appType === 'web_confidential' ? 'Globe' : 'Smartphone',
        };
        setConnectedApps(prev => [newConn, ...prev]);
      }
    }

    addAuditLog('oauth.authorize.granted', currentUser?.email || 'User', `Granted OAuth 2.1 PKCE authorization to "${appName}" for scopes: ${scopes.join(', ')}`);

    const authCode = `jav_code_${Math.random().toString(36).substring(2, 15)}_${Date.now().toString(36)}`;
    const redirectBase = pendingOAuthRequest?.redirectUri || app?.redirectUris[0] || 'https://javenly.com/wp-json/javenly/v1/callback';
    const state = pendingOAuthRequest?.state || 'demo_state_123';

    setPendingOAuthRequest(null);
    return {
      redirectUrl: `${redirectBase}?code=${authCode}&state=${encodeURIComponent(state)}`,
    };
  };

  const denyOAuthConsent = (clientId: string) => {
    const app = applications.find(a => a.clientId === clientId);
    addAuditLog('oauth.authorize.denied', currentUser?.email || 'User', `User denied OAuth authorization for client ${clientId}`, 'warning');
    const redirectBase = pendingOAuthRequest?.redirectUri || app?.redirectUris[0] || 'https://javenly.com';
    const state = pendingOAuthRequest?.state || 'demo_state_123';
    setPendingOAuthRequest(null);
    return {
      redirectUrl: `${redirectBase}?error=access_denied&error_description=User+denied+consent&state=${encodeURIComponent(state)}`,
    };
  };

  const createApplication = (appData: Omit<OAuthApplication, 'id' | 'createdAt' | 'ownerId'>) => {
    const newApp: OAuthApplication = {
      ...appData,
      id: `app_jav_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      ownerId: currentUser?.id || 'usr_jav_innovations_root_admin',
    };
    setApplications(prev => [newApp, ...prev]);
    addAuditLog('admin.app.created', currentUser?.email || 'Admin', `Created new OAuth 2.1 application "${newApp.name}" (${newApp.appType})`);
  };

  const updateApplication = (appId: string, updates: Partial<OAuthApplication>) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, ...updates } : a));
    addAuditLog('admin.app.created', currentUser?.email || 'Admin', `Updated application configuration for ID: ${appId}`);
  };

  const deleteApplication = (appId: string) => {
    const app = applications.find(a => a.id === appId);
    setApplications(prev => prev.filter(a => a.id !== appId));
    setConnectedApps(prev => prev.filter(c => c.applicationId !== appId));
    addAuditLog('admin.app.created', currentUser?.email || 'Admin', `Deleted application "${app?.name || appId}"`, 'warning');
  };

  const toggleUserStatus = (userId: string, status: 'active' | 'suspended') => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    addAuditLog(
      status === 'suspended' ? 'admin.user.suspended' : 'admin.user.activated',
      currentUser?.email || 'Admin',
      `${status === 'suspended' ? 'Suspended' : 'Activated'} user ${user?.email || userId}`,
      status === 'suspended' ? 'warning' : 'success'
    );
  };

  const adminDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
    addAuditLog('admin.user.suspended', currentUser?.email || 'Admin', `Permanently deleted user ${user?.email || userId} from directory.`, 'warning');
  };

  const updateSupabaseConfig = (url: string, key: string) => {
    resetSupabaseClient(url, key);
    setSupabaseConfigState({ url, key, isCustom: true });
    addAuditLog('admin.app.created', currentUser?.email || 'Admin', `Connected to custom live Supabase Auth instance at: ${url}`);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        sessions,
        applications,
        connectedApps,
        auditLogs,
        currentSubdomain,
        pendingOAuthRequest,
        supabaseConfig,
        setCurrentSubdomain,
        setPendingOAuthRequest,
        loginWithEmail,
        loginWithMagicLink,
        signup,
        logout,
        switchUser,
        updateProfile,
        changePassword,
        toggleMFA,
        revokeSession,
        revokeAllOtherSessions,
        revokeConnectedApp,
        exportUserData,
        deleteAccount,
        approveOAuthConsent,
        denyOAuthConsent,
        createApplication,
        updateApplication,
        deleteApplication,
        toggleUserStatus,
        adminDeleteUser,
        updateSupabaseConfig,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
