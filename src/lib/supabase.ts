import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { JavenlyUser, OAuthApplication, ConnectedApp, UserSession, SecurityAuditEvent } from '../types';

// Default Supabase project credentials (can be overridden via localStorage or env)
const DEFAULT_SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://javenly-identity.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImphdmVubHktaWRlbnRpdHkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.demo_key_javenly_identity_free_tier';

export function getSupabaseConfig() {
  const customUrl = localStorage.getItem('javenly_supabase_url');
  const customKey = localStorage.getItem('javenly_supabase_anon_key');
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

  const activeUrl = customUrl || envUrl || DEFAULT_SUPABASE_URL;
  const activeKey = customKey || envKey || DEFAULT_SUPABASE_ANON_KEY;

  // It's a live custom Supabase backend if URL is not the demo sandbox
  const isCustom = Boolean(
    activeUrl &&
    activeKey &&
    !activeUrl.includes('javenly-identity.supabase.co') &&
    !activeKey.includes('demo_key_javenly_identity_free_tier')
  ) || Boolean(
    customUrl && 
    customKey && 
    !customUrl.includes('javenly-identity.supabase.co')
  );

  return {
    url: activeUrl,
    key: activeKey,
    isCustom,
  };
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  const config = getSupabaseConfig();
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(config.url, config.key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
    } catch {
      // Fallback
      supabaseInstance = createClient('https://example.supabase.co', 'dummy_key');
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient(url: string, key: string) {
  localStorage.setItem('javenly_supabase_url', url);
  localStorage.setItem('javenly_supabase_anon_key', key);
  supabaseInstance = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

// Initial Mock Seed Data for Javenly Innovations
export const INITIAL_USERS: JavenlyUser[] = [
  {
    id: 'usr_jav_innovations_root_admin',
    email: 'admin@javenly.com',
    fullName: 'Javenly Innovations',
    username: 'javenly',
    avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
    bio: 'Primary Administrator account for Javenly Innovations centralized identity platform.',
    jobTitle: 'Identity Administrator',
    department: 'Executive Operations',
    company: 'Javenly Innovations',
    role: 'super_admin',
    emailVerified: true,
    mfaEnabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
    status: 'active',
    metadata: {
      locale: 'en-US',
    },
  },
  {
    id: 'usr_jav_business_root_admin',
    email: 'business@javenly.com',
    fullName: 'Javenly Innovations (Business)',
    username: 'javenly_business',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Primary Business Administrator account for Javenly Innovations.',
    jobTitle: 'Identity Administrator',
    department: 'Executive Operations',
    company: 'Javenly Innovations',
    role: 'super_admin',
    emailVerified: true,
    mfaEnabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: new Date().toISOString(),
    status: 'active',
    metadata: {
      locale: 'en-US',
    },
  },
  {
    id: 'usr_jav_dev_chen',
    email: 'marcus.chen@javenly.com',
    fullName: 'Marcus Chen',
    username: 'mchen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Climate-tech software architect leading the Javenly smart home security system.',
    jobTitle: 'Senior Platform Engineer',
    department: 'Smart Home Automation',
    company: 'Javenly Innovations',
    role: 'developer',
    emailVerified: true,
    mfaEnabled: true,
    createdAt: '2024-02-10T14:20:00Z',
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    status: 'active',
    metadata: {
      team: 'IoT Engineering',
    },
  },
  {
    id: 'usr_jav_ops_sarah',
    email: 'sarah.jenkins@javenly.com',
    fullName: 'Sarah Jenkins',
    username: 'sjenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    bio: 'Operations lead overseeing Cary, NC field testing and customer success.',
    jobTitle: 'Operations & Security Manager',
    department: 'Field Operations',
    company: 'Javenly Innovations',
    role: 'admin',
    emailVerified: true,
    mfaEnabled: true,
    createdAt: '2024-02-15T09:30:00Z',
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    status: 'active',
    metadata: {
      location: 'Cary, NC',
    },
  },
  {
    id: 'usr_jav_wp_elena',
    email: 'elena.rostova@gmail.com',
    fullName: 'Elena Rostova',
    username: 'elena_r',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bio: 'Javenly CarbonTrack subscriber and smart home pilot user.',
    jobTitle: 'Smart Home Beta Tester',
    department: 'Customer Community',
    company: 'Individual Customer',
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: '2024-03-01T11:45:00Z',
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 40).toISOString(),
    status: 'active',
    metadata: {
      channel: 'javenly.com WordPress SSO',
    },
  },
  {
    id: 'usr_jav_wp_david',
    email: 'david.kim@outlook.com',
    fullName: 'David Kim',
    username: 'dkim_iot',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'Javenly Innovations shop member and security system pre-order customer.',
    jobTitle: 'Customer Member',
    department: 'E-commerce',
    company: 'Individual Customer',
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: '2024-03-12T16:15:00Z',
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
    status: 'active',
    metadata: {
      channel: 'javenly.com WooCommerce',
    },
  },
  {
    id: 'usr_jav_wp_amanda',
    email: 'amanda.foster@icloud.com',
    fullName: 'Amanda Foster',
    username: 'afoster',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
    bio: 'Residential clean-energy advocate and smart security early adopter.',
    jobTitle: 'Pilot Participant',
    department: 'Pilot Program',
    company: 'Individual Customer',
    role: 'user',
    emailVerified: true,
    mfaEnabled: false,
    createdAt: '2024-04-05T10:00:00Z',
    lastLoginAt: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
    status: 'active',
    metadata: {
      channel: 'javenly.com WordPress SSO',
    },
  },
];

export const INITIAL_APPLICATIONS: OAuthApplication[] = [
  {
    id: 'app_jav_wp_01',
    clientId: 'client_jav_wordpress_javenly_com',
    clientSecret: 'sec_live_948f20b8f74a01948dbf394cba8',
    name: 'Javenly WordPress Main Site',
    description: 'The official javenly.com WordPress website hosted with Namecheap. Uses Javenly Identity Connector for Single Sign-On and role mapping.',
    appType: 'web_confidential',
    homepageUrl: 'https://javenly.com',
    redirectUris: [
      'https://javenly.com/wp-json/javenly/v1/callback',
      'https://javenly.com/wp-admin/admin-ajax.php?action=javenly_callback',
      'http://localhost:8080/wp-json/javenly/v1/callback',
    ],
    logoutUris: [
      'https://javenly.com/wp-login.php?loggedout=true',
    ],
    allowedOrigins: [
      'https://javenly.com',
    ],
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    status: 'active',
    createdAt: '2024-01-20T10:00:00Z',
    ownerId: 'usr_jav_innovations_root_admin',
  },
  {
    id: 'app_jav_crm_02',
    clientId: 'client_jav_crm_nodejs_app',
    clientSecret: 'sec_live_55a298f01b339fca81938fe76d1',
    name: 'Javenly CRM Platform',
    description: 'Internal customer relationship management system built with Node.js, Express, and React.',
    appType: 'web_confidential',
    homepageUrl: 'https://crm.javenly.com',
    redirectUris: [
      'https://crm.javenly.com/auth/callback',
      'http://localhost:4000/auth/callback',
    ],
    logoutUris: [
      'https://crm.javenly.com/logout/callback',
    ],
    allowedOrigins: [
      'https://crm.javenly.com',
    ],
    scopes: ['openid', 'profile', 'email'],
    status: 'active',
    createdAt: '2024-02-15T12:00:00Z',
    ownerId: 'usr_jav_innovations_root_admin',
  },
  {
    id: 'app_jav_mobile_03',
    clientId: 'client_jav_mobile_ios_android',
    name: 'Javenly Mobile App',
    description: 'Native mobile client for iOS and Android using Authorization Code Flow with PKCE (public client).',
    appType: 'native_mobile',
    homepageUrl: 'https://javenly.com/mobile',
    redirectUris: [
      'com.javenly.identity://oauth2redirect',
    ],
    logoutUris: [
      'com.javenly.identity://logout',
    ],
    allowedOrigins: [],
    scopes: ['openid', 'profile', 'email', 'offline_access'],
    status: 'development',
    createdAt: '2024-04-01T15:30:00Z',
    ownerId: 'usr_jav_1847c210-901d-4e2b-bb42-f819039a0244',
  },
];

export const INITIAL_CONNECTED_APPS: ConnectedApp[] = [
  {
    id: 'conn_01',
    userId: 'usr_jav_innovations_root_admin',
    applicationId: 'app_jav_wp_01',
    applicationName: 'Javenly WordPress Main Site',
    clientId: 'client_jav_wordpress_javenly_com',
    authorizedAt: '2024-01-25T11:20:00Z',
    lastUsedAt: '2025-05-11T09:14:22Z',
    grantedScopes: ['openid', 'profile', 'email'],
    icon: 'Globe',
  },
  {
    id: 'conn_02',
    userId: 'usr_jav_innovations_root_admin',
    applicationId: 'app_jav_crm_02',
    applicationName: 'Javenly CRM Platform',
    clientId: 'client_jav_crm_nodejs_app',
    authorizedAt: '2024-02-18T14:30:00Z',
    lastUsedAt: '2025-05-10T16:40:00Z',
    grantedScopes: ['openid', 'profile', 'email'],
    icon: 'Database',
  },
];

export const INITIAL_SESSIONS: UserSession[] = [
  {
    id: 'sess_live_current',
    userId: 'usr_jav_innovations_root_admin',
    ipAddress: '172.68.14.22',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    browser: 'Chrome 124 on Windows 11',
    device: 'Desktop Workstation',
    location: 'San Jose, CA, USA',
    createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    lastActiveAt: new Date().toISOString(),
    isCurrent: true,
  },
  {
    id: 'sess_live_iphone',
    userId: 'usr_jav_innovations_root_admin',
    ipAddress: '172.56.21.99',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    browser: 'Mobile Safari on iOS 17',
    device: 'Apple iPhone 15 Pro',
    location: 'San Francisco, CA, USA',
    createdAt: new Date(Date.now() - 3600 * 1000 * 28).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    isCurrent: false,
  },
  {
    id: 'sess_live_macbook',
    userId: 'usr_jav_innovations_root_admin',
    ipAddress: '104.28.19.4',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    browser: 'Chrome 123 on macOS',
    device: 'MacBook Pro 16"',
    location: 'Seattle, WA, USA',
    createdAt: new Date(Date.now() - 3600 * 1000 * 96).toISOString(),
    lastActiveAt: new Date(Date.now() - 3600 * 1000 * 22).toISOString(),
    isCurrent: false,
  },
];

export const INITIAL_AUDIT_LOGS: SecurityAuditEvent[] = [
  {
    id: 'evt_001',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    eventType: 'auth.login.success',
    userEmail: 'admin@javenly.com',
    userId: 'usr_jav_innovations_root_admin',
    ipAddress: '172.68.14.22',
    actor: 'admin@javenly.com',
    status: 'success',
    details: 'Signed in via Supabase Auth with TOTP MFA verification.',
  },
  {
    id: 'evt_002',
    timestamp: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
    eventType: 'oauth.token.exchanged',
    userEmail: 'admin@javenly.com',
    userId: 'usr_jav_innovations_root_admin',
    ipAddress: '198.51.100.4',
    actor: 'client_jav_wordpress_javenly_com',
    status: 'success',
    details: 'Exchanged authorization code for JWT token (PKCE S256 validated). WordPress session created for javenly.com.',
  },
  {
    id: 'evt_003',
    timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
    eventType: 'auth.login.failed',
    userEmail: 'unknown.user@external.com',
    ipAddress: '45.133.1.20',
    actor: 'Anonymous',
    status: 'warning',
    details: 'Failed login attempt: invalid credentials from unrecognized IP address.',
  },
  {
    id: 'evt_004',
    timestamp: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    eventType: 'admin.app.created',
    userEmail: 'admin@javenly.com',
    userId: 'usr_jav_9941a82f-871d-40ce-8c31-419b380d1933',
    ipAddress: '172.68.14.22',
    actor: 'admin@javenly.com',
    status: 'success',
    details: 'Registered OAuth 2.1 client "Javenly CRM Platform" with PKCE authorization support.',
  },
  {
    id: 'evt_005',
    timestamp: new Date(Date.now() - 1000 * 60 * 340).toISOString(),
    eventType: 'auth.mfa.verified',
    userEmail: 'sarah.chen@javenly.com',
    userId: 'usr_jav_1847c210-901d-4e2b-bb42-f819039a0244',
    ipAddress: '108.162.245.12',
    actor: 'sarah.chen@javenly.com',
    status: 'success',
    details: 'Completed Time-based One-Time Password (TOTP) verification step.',
  },
];
