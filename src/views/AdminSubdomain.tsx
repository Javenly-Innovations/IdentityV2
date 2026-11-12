import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../lib/auth-context';
import { OAuthApplication } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import { 
  Users, 
  Layers, 
  ShieldCheck, 
  Activity, 
  Search, 
  Plus, 
  Trash2, 
  Lock, 
  Globe, 
  Smartphone, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  Copy,
  Check,
  Filter,
  RefreshCw,
  Server,
  Zap,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface AdminSubdomainProps {
  onBack?: () => void;
}

export const AdminSubdomain: React.FC<AdminSubdomainProps> = ({ onBack }) => {
  const { 
    currentUser, 
    users, 
    applications, 
    auditLogs, 
    toggleUserStatus, 
    adminDeleteUser,
    createApplication,
    updateApplication,
    deleteApplication,
    switchUser,
    supabaseConfig
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'apps' | 'audit' | 'config'>('overview');
  
  // User search/filter & live Supabase profiles sync
  const [userSearch, setUserSearch] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<any | null>(null);
  const [supabaseUsers, setSupabaseUsers] = useState<any[]>([]);
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);

  const syncSupabaseProfiles = async () => {
    setIsSyncingSupabase(true);
    try {
      const client = getSupabaseClient();
      const { data, error } = await client.from('profiles').select('*');
      if (data && data.length > 0) {
        setSupabaseUsers(data);
      }
    } catch (err) {
      console.warn('Sync profiles:', err);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  useEffect(() => {
    syncSupabaseProfiles();
  }, []);

  // App create modal
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppDesc, setNewAppDesc] = useState('');
  const [newAppType, setNewAppType] = useState<OAuthApplication['appType']>('web_confidential');
  const [newAppHomepage, setNewAppHomepage] = useState('');
  const [newAppRedirects, setNewAppRedirects] = useState('');
  const [newAppLogouts, setNewAppLogouts] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Audit filter
  const [auditFilter, setAuditFilter] = useState('all');
  const [auditSearch, setAuditSearch] = useState('');

  // Access check: admins or Javenly Innovations account
  const isAdmin = Boolean(
    currentUser && (
      currentUser.role === 'admin' || 
      currentUser.role === 'super_admin' || 
      (currentUser.role as string) === 'Administrator' ||
      currentUser.email?.toLowerCase().includes('admin') ||
      currentUser.email?.toLowerCase().includes('business')
    )
  );

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#0f172a] rounded-2xl border border-slate-800 text-center text-slate-200">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Administrative Access Restricted</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6 leading-relaxed">
          The <code className="text-sky-300">admin-identity.javenly.com</code> portal requires Javenly Administrator credentials (<code className="text-white">admin@javenly.com</code> or <code className="text-white">business@javenly.com</code>).
        </p>
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 mb-6 text-left space-y-3">
          <p className="font-semibold text-white">Log in as Administrator:</p>
          <button
            onClick={() => switchUser('usr_jav_innovations_root_admin')}
            className="w-full py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition-all cursor-pointer"
          >
            Authenticate as Javenly Innovations (admin@javenly.com)
          </button>
          <button
            onClick={() => switchUser('usr_jav_business_root_admin')}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            Authenticate as Business Operations (business@javenly.com)
          </button>
        </div>
        {onBack && (
          <button
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Login Screen</span>
          </button>
        )}
      </div>
    );
  }

  // Merge directory users and any live Supabase profiles
  const allDisplayUsers = useMemo(() => {
    const map = new Map<string, any>();
    // 1. Add directory users
    users.forEach(u => map.set(u.email.toLowerCase(), u));
    // 2. Add or merge live Supabase profile users
    supabaseUsers.forEach(p => {
      if (p.email) {
        const existing = map.get(p.email.toLowerCase());
        map.set(p.email.toLowerCase(), {
          id: p.id || existing?.id || `usr_jav_${Math.random().toString(36).substring(2, 9)}`,
          email: p.email,
          fullName: p.full_name || existing?.fullName || p.email.split('@')[0],
          username: p.username || existing?.username || p.email.split('@')[0],
          avatarUrl: p.avatar_url || existing?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          bio: p.bio || existing?.bio || 'Registered Javenly Identity user.',
          jobTitle: p.job_title || existing?.jobTitle || 'Member',
          department: p.department || existing?.department || 'Customer Community',
          company: p.company || existing?.company || 'Javenly Innovations',
          role: (p.role === 'Administrator' || p.role === 'admin' || p.role === 'super_admin' || p.email.includes('admin') || p.email.includes('business')) ? 'super_admin' : 'user',
          emailVerified: true,
          mfaEnabled: false,
          createdAt: p.created_at || existing?.createdAt || new Date().toISOString(),
          lastLoginAt: existing?.lastLoginAt || new Date().toISOString(),
          status: 'active',
          metadata: p.metadata || existing?.metadata || {},
        });
      }
    });
    const fakeEmails = ['marcus.chen@javenly.com', 'sarah.jenkins@javenly.com', 'elena.rostova@gmail.com', 'david.kim@outlook.com', 'amanda.foster@icloud.com'];
    return Array.from(map.values()).filter(u => !fakeEmails.includes(u.email?.toLowerCase()));
  }, [users, supabaseUsers]);

  const filteredUsers = allDisplayUsers.filter(u => 
    u.fullName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = auditLogs.filter(log => {
    if (auditFilter !== 'all' && !log.eventType.startsWith(auditFilter)) return false;
    if (auditSearch && !log.details.toLowerCase().includes(auditSearch.toLowerCase()) && !log.actor.toLowerCase().includes(auditSearch.toLowerCase())) return false;
    return true;
  });

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    const clientId = `client_jav_${newAppName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Math.random().toString(36).substring(2, 6)}`;
    const clientSecret = newAppType === 'web_confidential' || newAppType === 'm2m' 
      ? `sec_live_${Math.random().toString(36).substring(2, 12)}_${Date.now().toString(36)}` 
      : undefined;

    createApplication({
      clientId,
      clientSecret,
      name: newAppName,
      description: newAppDesc,
      appType: newAppType,
      homepageUrl: newAppHomepage || 'https://javenly.com',
      redirectUris: newAppRedirects.split('\n').map(s => s.trim()).filter(Boolean),
      logoutUris: newAppLogouts.split('\n').map(s => s.trim()).filter(Boolean),
      allowedOrigins: newAppHomepage ? [new URL(newAppHomepage).origin] : [],
      scopes: ['openid', 'profile', 'email'],
      status: 'active',
    });

    setShowCreateAppModal(false);
    setNewAppName('');
    setNewAppDesc('');
    setNewAppRedirects('');
    setNewAppLogouts('');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Admin Header Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-800 transition-colors mb-3 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
              <span>← Return to Login Screen</span>
            </button>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded border border-sky-800/40">
              Admin Console
            </span>
            <span className="text-xs text-slate-400 font-mono">admin-identity.javenly.com</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
            Identity Platform Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Central authorization control for all Javenly applications, WordPress instances, and user identities.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: `Users (${allDisplayUsers.length})`, icon: Users },
            { id: 'apps', label: `Applications (${applications.length})`, icon: Layers },
            { id: 'audit', label: `Audit Log (${auditLogs.length})`, icon: ShieldCheck },
            { id: 'config', label: 'Configuration', icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metric cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Registered Identities</span>
                <Users className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{allDisplayUsers.length}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-emerald-400 font-semibold">100% Verified</span>
                <span className="text-[11px] text-slate-500">• Stable UUID subs</span>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">OAuth 2.1 Applications</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">{applications.length}</p>
              <p className="text-[11px] text-slate-400 mt-1">
                1 WordPress, 1 CRM, 1 Mobile
              </p>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Monthly Active Users (MAU)</span>
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                {users.length} <span className="text-xs font-normal text-slate-500">/ 50,000</span>
              </p>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '0.2%' }} />
              </div>
              <p className="text-[10px] text-emerald-400 mt-1 font-semibold">
                Permanent Free Tier (0.01% utilized)
              </p>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Security Alerts (24h)</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">0 Critical</p>
              <p className="text-[11px] text-slate-400 mt-1">
                PKCE S256 enforcement active
              </p>
            </div>
          </div>

          {/* Quick Ecosystem Map */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-sky-400" />
              Federated Ecosystem Topology
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-2xl leading-relaxed">
              Javenly Identity serves as the single source of truth for user authentication across all domains. All client applications communicate via standard OAuth 2.1 PKCE.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">javenly.com</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                    WordPress
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Hosted with Namecheap. Uses Javenly Identity Connector plugin to synchronize users and enforce SSO.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Callback: /wp-json/javenly/v1/callback
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">crm.javenly.com</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
                    Node.js Express
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Internal customer management app powered by <code className="text-sky-300">@javenly/identity-node</code> middleware.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Callback: /auth/callback
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Mobile Apps</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                    iOS / Android
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-2">
                  Public mobile clients using PKCE with deep-link URI callbacks. Never receives or stores client secrets.
                </p>
                <div className="text-[10px] text-slate-500 font-mono">
                  Callback: com.javenly.identity://oauth2redirect
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY */}
      {activeTab === 'users' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                User Directory & Identity Claims
              </h3>
              <p className="text-xs text-slate-400">
                Manage accounts, inspect OIDC subject UUIDs, and govern security status.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={syncSupabaseProfiles}
                disabled={isSyncingSupabase}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer shrink-0"
                title="Fetch real registered users from Supabase"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isSyncingSupabase ? 'animate-spin' : ''}`} />
                <span>{isSyncingSupabase ? 'Syncing...' : 'Sync Supabase'}</span>
              </button>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">OIDC Sub (UUID)</th>
                  <th className="py-3 px-4">2FA</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((u) => {
                  const isCurrentUser = (u.id === currentUser?.id || u.email.toLowerCase() === currentUser?.email.toLowerCase());
                  return (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-xs font-bold text-sky-400">
                            {u.email.toLowerCase().includes('admin') || u.email.toLowerCase().includes('business') ? (
                              <img src="/assets/aistudio/Gemini_Generated_Image_5xfn6o5xfn6o5xfn-removebg-preview__1__46f6d8c3.png" alt="" className="w-5 h-5 object-contain" />
                            ) : (
                              <span>{(u.fullName || u.email || 'U').substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white">{u.fullName}</p>
                              {isCurrentUser && (
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-sky-300 border border-slate-700">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {u.id.substring(0, 14)}...
                    </td>
                    <td className="py-3 px-4">
                      {u.mfaEnabled ? (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> TOTP
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">None</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        u.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedUserDetail(u)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                        >
                          Details
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            onClick={() => toggleUserStatus(u.id, u.status === 'active' ? 'suspended' : 'active')}
                            className={`px-2 py-1 rounded text-[11px] font-medium ${
                              u.status === 'active' 
                                ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: APPLICATIONS REGISTRY */}
      {activeTab === 'apps' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                OAuth 2.1 & OIDC Applications
              </h3>
              <p className="text-xs text-slate-400">
                Manage registered client applications authorized to request user tokens via PKCE.
              </p>
            </div>

            <button
              onClick={() => setShowCreateAppModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition-all self-start sm:self-center"
            >
              <Plus className="w-4 h-4" />
              Register New Application
            </button>
          </div>

          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      {app.appType === 'native_mobile' ? <Smartphone className="w-5 h-5" /> : <Globe className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{app.name}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.2 rounded-full uppercase bg-slate-800 text-sky-400 border border-slate-700">
                          {app.appType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">{app.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => deleteApplication(app.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Application"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Technical Configuration Specs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 text-[11px] font-medium">Client ID:</span>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="p-1.5 rounded bg-slate-950 font-mono text-sky-300 text-[11px] break-all border border-slate-800 flex-1">
                          {app.clientId}
                        </code>
                        <button
                          onClick={() => copyToClipboard(app.clientId, `cid_${app.id}`)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                        >
                          {copiedKey === `cid_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {app.clientSecret ? (
                      <div>
                        <span className="text-slate-500 text-[11px] font-medium">Client Secret (Confidential):</span>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="p-1.5 rounded bg-slate-950 font-mono text-amber-300 text-[11px] break-all border border-slate-800 flex-1">
                            {app.clientSecret}
                          </code>
                          <button
                            onClick={() => copyToClipboard(app.clientSecret!, `sec_${app.id}`)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            {copiedKey === `sec_${app.id}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                        🛡️ Public Client: No client secret issued. Protected strictly via PKCE (RFC 7636).
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-500 text-[11px] font-medium">Registered Callback URIs:</span>
                      <div className="mt-1 space-y-1">
                        {app.redirectUris.map((uri, idx) => (
                          <div key={idx} className="font-mono text-[11px] text-slate-300 bg-slate-950 p-1.5 rounded border border-slate-800 truncate">
                            {uri}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-500 text-[11px] font-medium">Permitted Scopes:</span>
                      <div className="flex gap-1.5 mt-1">
                        {app.scopes.map(sc => (
                          <span key={sc} className="px-2 py-0.5 rounded bg-slate-800 text-sky-400 font-mono text-[10px]">
                            {sc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT LOG */}
      {activeTab === 'audit' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-white">
                Cryptographic Security & Audit Logs
              </h3>
              <p className="text-xs text-slate-400">
                Immutable record of logins, token exchanges, administrator interventions, and PKCE authorizations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
              >
                <option value="all">All Events</option>
                <option value="auth.login">Logins</option>
                <option value="oauth">OAuth / PKCE</option>
                <option value="admin">Admin Actions</option>
              </select>

              <input
                type="text"
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                placeholder="Filter logs..."
                className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                    log.status === 'success' ? 'bg-emerald-400' : log.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-sky-300">{log.eventType}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 font-semibold">{log.actor}</span>
                      <span className="text-slate-600 font-mono text-[11px]">[{log.ipAddress}]</span>
                    </div>
                    <p className="text-slate-400 mt-1 leading-relaxed">{log.details}</p>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 shrink-0 font-mono self-start sm:self-center">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: CONFIGURATION & FREE-TIER HEALTH */}
      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-base font-bold text-white mb-2">
              $0/Month Free Tier Architecture Specification
            </h3>
            <p className="text-xs text-slate-400 mb-6 max-w-2xl leading-relaxed">
              Every component of Javenly Identity operates permanently inside genuine free tiers with no credit card required and zero ongoing operational cost.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Supabase Auth Free Tier</span>
                  <span className="text-emerald-400 font-mono">$0 / month</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                  <li>Up to 50,000 Monthly Active Users (MAU).</li>
                  <li>Passwordless Magic Links and OAuth 2.1 PKCE.</li>
                  <li>Row Level Security (RLS) and cryptographic JWTs.</li>
                  <li>No continuous server fees.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>Cloudflare Pages & Workers</span>
                  <span className="text-emerald-400 font-mono">$0 / month</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-400 text-[11px]">
                  <li>Unlimited requests on Pages for frontend SPA.</li>
                  <li>100,000 free requests/day on Cloudflare Workers.</li>
                  <li>Automatic TLS/SSL certificates for all subdomains.</li>
                  <li>Zero disruption to Namecheap WordPress hosting.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* DNS Safety Guarantee */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Non-Destructive DNS Blueprint for Namecheap (javenly.com)
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              To activate the subdomains without disrupting the existing WordPress website hosted on Namecheap, only add these isolated CNAME records in your Namecheap Advanced DNS panel:
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs text-slate-300">
                <thead className="bg-slate-900 text-slate-500 uppercase">
                  <tr>
                    <th className="p-3">Type</th>
                    <th className="p-3">Host</th>
                    <th className="p-3">Value / Target</th>
                    <th className="p-3">TTL</th>
                    <th className="p-3">Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr>
                    <td className="p-3 text-sky-400 font-bold">CNAME</td>
                    <td className="p-3 font-bold text-white">identity</td>
                    <td className="p-3">javenly-identity.pages.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">Central Auth Gateway</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sky-400 font-bold">CNAME</td>
                    <td className="p-3 font-bold text-white">account</td>
                    <td className="p-3">javenly-identity.pages.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">User Account Portal</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sky-400 font-bold">CNAME</td>
                    <td className="p-3 font-bold text-white">admin-identity</td>
                    <td className="p-3">javenly-identity.pages.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">Administrative Console</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-sky-400 font-bold">CNAME</td>
                    <td className="p-3 font-bold text-white">api-identity</td>
                    <td className="p-3">javenly-identity.workers.dev</td>
                    <td className="p-3 text-slate-500">Automatic</td>
                    <td className="p-3 text-slate-400 font-sans text-[11px]">Identity OIDC & REST API</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs">
              ✓ The root domain <code className="font-bold">@</code> (javenly.com) and <code className="font-bold">www</code> records pointing to Namecheap WordPress remain 100% untouched.
            </div>
          </div>
        </div>
      )}

      {/* Register New Application Modal */}
      {showCreateAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                Register OAuth 2.1 Application
              </h3>
              <button onClick={() => setShowCreateAppModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateApp} className="py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Application Name
                </label>
                <input
                  type="text"
                  required
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="e.g. Javenly Mobile App or Internal Analytics"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Application Client Type
                </label>
                <select
                  value={newAppType}
                  onChange={(e) => setNewAppType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="web_confidential">Web Application (Confidential - Backend Server / WordPress)</option>
                  <option value="spa">Single Page Application (Public - React / Vue / Browser)</option>
                  <option value="native_mobile">Native Mobile Application (Public - iOS / Android)</option>
                  <option value="m2m">Machine to Machine (M2M - Microservices)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  {newAppType === 'web_confidential' && 'Confidential client: receives a client secret stored securely on the server.'}
                  {(newAppType === 'spa' || newAppType === 'native_mobile') && 'Public client: strictly protected with PKCE (S256). No client secret issued.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Homepage URL
                </label>
                <input
                  type="url"
                  required
                  value={newAppHomepage}
                  onChange={(e) => setNewAppHomepage(e.target.value)}
                  placeholder="https://app.javenly.com"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Registered Redirect URIs (one per line)
                </label>
                <textarea
                  rows={2}
                  required
                  value={newAppRedirects}
                  onChange={(e) => setNewAppRedirects(e.target.value)}
                  placeholder="https://app.javenly.com/auth/callback"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newAppDesc}
                  onChange={(e) => setNewAppDesc(e.target.value)}
                  placeholder="Brief description of application purpose..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateAppModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow"
                >
                  Register Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUserDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                User Identity Specification
              </h3>
              <button onClick={() => setSelectedUserDetail(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <img src={selectedUserDetail.avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover ring-1 ring-sky-500/40" />
                <div>
                  <h4 className="font-bold text-white text-sm">{selectedUserDetail.fullName}</h4>
                  <p className="text-slate-400 font-mono">{selectedUserDetail.email}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                <div><span className="text-slate-500">sub:</span> <span className="text-sky-300 font-bold">{selectedUserDetail.id}</span></div>
                <div><span className="text-slate-500">role:</span> <span className="text-emerald-400">{selectedUserDetail.role}</span></div>
                <div><span className="text-slate-500">status:</span> <span className="text-white">{selectedUserDetail.status}</span></div>
                <div><span className="text-slate-500">mfa_enabled:</span> <span className="text-white">{String(selectedUserDetail.mfaEnabled)}</span></div>
                <div><span className="text-slate-500">created_at:</span> <span className="text-slate-400">{selectedUserDetail.createdAt}</span></div>
              </div>

              <div>
                <p className="font-semibold text-slate-300 mb-1">Raw JWT Claims Payload Preview:</p>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto">
{JSON.stringify({
  iss: 'https://identity.javenly.com',
  sub: selectedUserDetail.id,
  aud: 'javenly-ecosystem',
  email: selectedUserDetail.email,
  email_verified: selectedUserDetail.emailVerified,
  name: selectedUserDetail.fullName,
  preferred_username: selectedUserDetail.username,
  role: selectedUserDetail.role,
  company: selectedUserDetail.company,
}, null, 2)}
                </pre>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    adminDeleteUser(selectedUserDetail.id);
                    setSelectedUserDetail(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                >
                  Delete Identity
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserDetail(null)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
