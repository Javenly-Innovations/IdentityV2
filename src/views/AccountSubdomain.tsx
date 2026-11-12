import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  User, 
  Shield, 
  Key, 
  Lock, 
  Smartphone, 
  Globe, 
  Trash2, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  QrCode, 
  Copy, 
  RefreshCw, 
  ExternalLink,
  Laptop,
  Check,
  Calendar,
  Layers,
  Fingerprint,
  Info
} from 'lucide-react';

export const AccountSubdomain: React.FC = () => {
  const { 
    currentUser, 
    sessions, 
    connectedApps, 
    updateProfile, 
    changePassword, 
    toggleMFA, 
    revokeSession, 
    revokeAllOtherSessions, 
    revokeConnectedApp, 
    exportUserData, 
    deleteAccount,
    setCurrentSubdomain
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'security' | 'apps' | 'privacy'>('overview');
  
  // Profile edit states
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [username, setUsername] = useState(currentUser?.username || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [jobTitle, setJobTitle] = useState(currentUser?.jobTitle || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [profileSaved, setProfileSaved] = useState(false);

  // Password edit states
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // MFA modal / setup
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSecret] = useState('J7V3 NLY2 S3CU R3T0 TP99');
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Deletion modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-[#0f172a] rounded-2xl border border-slate-800 text-center text-slate-200">
        <Shield className="w-12 h-12 text-sky-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold">Authentication Required</h2>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          You must be signed in to access the Javenly Account Management Portal.
        </p>
        <button
          onClick={() => setCurrentSubdomain('identity.javenly.com')}
          className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg shadow-sky-600/30"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      fullName,
      username,
      bio,
      jobTitle,
      avatarUrl,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPass.length < 8) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    const res = await changePassword(newPass);
    if (res.success) {
      setPasswordMsg({ type: 'success', text: res.message });
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    }
  };

  const userSessions = sessions.filter(s => s.userId === currentUser.id);
  const userConnectedApps = connectedApps.filter(c => c.userId === currentUser.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Account Header Hero */}
      <div className="bg-gradient-to-r from-[#0d1627] via-[#0f1b33] to-[#0a1220] border border-slate-800 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="relative">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-20 h-20 rounded-2xl object-cover ring-2 ring-sky-500/40 shadow-xl"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0d1627] flex items-center justify-center text-white text-[10px]" title="Active Identity">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {currentUser.fullName}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  @{currentUser.username}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
                  {currentUser.role.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 font-mono">
                {currentUser.email}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                <span>Member since {new Date(currentUser.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-400">
                  OIDC sub: <code className="text-sky-300 font-bold">{currentUser.id.substring(0, 18)}...</code>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={exportUserData}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Export Identity Data</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'profile', label: 'Profile Information', icon: User },
            { id: 'security', label: 'Security & Sessions', icon: Lock },
            { id: 'apps', label: `Connected Apps (${userConnectedApps.length})`, icon: Layers },
            { id: 'privacy', label: 'Privacy & Deletion', icon: Key },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850 bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Tab 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Security Health Score</span>
                <Shield className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                {currentUser.mfaEnabled ? '98%' : '75%'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {currentUser.mfaEnabled ? 'Strong: 2FA TOTP is active' : 'Recommend enabling 2FA for maximum protection'}
              </p>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Identity Provider</span>
                <Key className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                Supabase Auth
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Zero-cost free tier (50,000 MAU)
              </p>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Active Connected Apps</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                {userConnectedApps.length} Apps
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Includes javenly.com WordPress SSO
              </p>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium">Active Devices</span>
                <Laptop className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-extrabold text-white">
                {userSessions.length} Sessions
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                1 current workstation + {Math.max(0, userSessions.length - 1)} others
              </p>
            </div>
          </div>

          {/* OIDC Sub Identifier Explanation Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-sky-400" />
              Permanent OIDC Subject Identifier (sub)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Javenly Identity strictly adheres to OAuth 2.1 & OpenID Connect standards. Applications (such as WordPress at <code className="text-sky-300">javenly.com</code> or Javenly CRM) never use email addresses as primary keys because emails can change. Instead, they reference your immutable <code className="text-sky-300">sub</code> UUID.
            </p>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between font-mono text-xs text-sky-300 break-all">
              <span>{currentUser.id}</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded shrink-0 ml-2">
                Immutable Claim
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="max-w-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              Personal Profile Information
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Update your public identity. These claims are synchronized across all connected Javenly applications.
            </p>

            {profileSaved && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Profile updated successfully and federated to OpenID claims!
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username (Slug)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Avatar Photo URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Job Title / Role
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Software Architect"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Organization / Company
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.company}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Biography
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your team about yourself..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 3: SECURITY & SESSIONS */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          
          {/* Two-Factor Authentication (MFA) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">
                    Two-Factor Authentication (TOTP)
                  </h3>
                  {currentUser.mfaEnabled ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                      ENABLED
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      DISABLED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Protect your Javenly account with standard Time-based One-Time Passwords (compatible with Google Authenticator, 1Password, Authy).
                </p>
              </div>

              <button
                onClick={() => {
                  if (currentUser.mfaEnabled) {
                    toggleMFA(false);
                  } else {
                    setShowMfaModal(true);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  currentUser.mfaEnabled
                    ? 'bg-slate-800 hover:bg-slate-700 text-rose-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                }`}
              >
                {currentUser.mfaEnabled ? 'Disable 2FA' : 'Enable 2FA (TOTP)'}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-1">
              Change Account Password
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Cryptographically hashed and verified using Supabase Auth GoTrue engine.
            </p>

            {passwordMsg && (
              <div className={`mb-4 p-3 rounded-xl text-xs flex items-center gap-2 ${
                passwordMsg.type === 'error'
                  ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                  : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
              }`}>
                {passwordMsg.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="max-w-md space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition-all"
              >
                Update Password
              </button>
            </form>
          </div>

          {/* Active Sessions */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Active Login Sessions
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Devices currently signed into Javenly Identity with valid refresh token chains.
                </p>
              </div>

              {userSessions.length > 1 && (
                <button
                  onClick={revokeAllOtherSessions}
                  className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors"
                >
                  Sign Out All Other Devices
                </button>
              )}
            </div>

            <div className="space-y-3">
              {userSessions.map((s) => (
                <div
                  key={s.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    s.isCurrent 
                      ? 'bg-sky-950/20 border-sky-500/30' 
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 text-sky-400">
                      {s.device.toLowerCase().includes('iphone') ? (
                        <Smartphone className="w-5 h-5" />
                      ) : (
                        <Laptop className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {s.browser}
                        </span>
                        {s.isCurrent && (
                          <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2 py-0.2 rounded-full font-bold">
                            Current Device
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.device} • {s.location} • <span className="font-mono text-slate-500">{s.ipAddress}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Last active: {new Date(s.lastActiveAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {!s.isCurrent && (
                    <button
                      onClick={() => revokeSession(s.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold self-start sm:self-center"
                    >
                      Revoke Session
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Tab 4: CONNECTED APPLICATIONS */}
      {activeTab === 'apps' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="mb-6">
            <h3 className="text-base font-bold text-white mb-1">
              Authorized Applications
            </h3>
            <p className="text-xs text-slate-400">
              Applications you have granted permission to authenticate via Javenly Identity using OAuth 2.1 PKCE.
            </p>
          </div>

          {userConnectedApps.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No applications are currently authorized.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userConnectedApps.map((app) => (
                <div
                  key={app.id}
                  className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
                      <Globe className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {app.applicationName}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        Client ID: {app.clientId}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-[10px] text-slate-400">Granted Scopes:</span>
                        {app.grantedScopes.map(sc => (
                          <span key={sc} className="text-[10px] font-mono bg-slate-800 text-sky-300 px-2 py-0.5 rounded border border-slate-700">
                            {sc}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">
                        Authorized: {new Date(app.authorizedAt).toLocaleDateString()} • Last accessed: {new Date(app.lastUsedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => revokeConnectedApp(app.applicationId)}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs font-semibold transition-colors self-start sm:self-center"
                  >
                    Revoke Access
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: PRIVACY & DELETION */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          {/* Data Export */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-1">
              GDPR & CCPA Personal Data Export
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-xl leading-relaxed">
              Download a complete machine-readable JSON export of your personal profile, OAuth tokens history, session logs, and stable OIDC subject records.
            </p>
            <button
              onClick={exportUserData}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              Download My Data (.json)
            </button>
          </div>

          {/* Account Deletion */}
          <div className="bg-[#0f172a] border border-rose-900/40 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-rose-400 mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Delete Javenly Identity Account
            </h3>
            <p className="text-xs text-slate-400 mb-4 max-w-2xl leading-relaxed">
              Deleting your account is permanent and irreversible. Your stable subject identifier (<code className="text-rose-300 font-mono">{currentUser.id}</code>) will be permanently retired. You will immediately lose access to <strong>javenly.com (WordPress)</strong>, Javenly CRM, and any connected services.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all"
            >
              Initiate Permanent Deletion
            </button>
          </div>
        </div>
      )}

      {/* MFA Setup Modal */}
      {showMfaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Configure Two-Factor Authentication
              </h3>
              <button onClick={() => setShowMfaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="py-4 space-y-4">
              <p className="text-xs text-slate-400">
                1. Open Google Authenticator, 1Password, or any TOTP app and scan this QR code:
              </p>

              {/* QR Mockup */}
              <div className="bg-white p-4 rounded-xl w-40 h-40 mx-auto flex items-center justify-center shadow-md">
                <div className="grid grid-cols-6 gap-1 w-full h-full">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${(i % 2 === 0 || i % 5 === 0) ? 'bg-slate-900' : 'bg-transparent'} rounded-[2px]`}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-400 mb-1">
                  Or enter secret code manually:
                </p>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-sky-400">
                  <span>{mfaSecret}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(mfaSecret);
                      setCopiedSecret(true);
                      setTimeout(() => setCopiedSecret(false), 2000);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    {copiedSecret ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Enter 6-digit code from your app:
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456"
                  className="w-full text-center tracking-widest text-lg font-mono py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMfaModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={mfaCode.length !== 6}
                  onClick={() => {
                    toggleMFA(true);
                    setShowMfaModal(false);
                    setMfaCode('');
                  }}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
                >
                  Verify & Activate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-rose-900/60 w-full max-w-md rounded-2xl p-6 shadow-2xl text-slate-200">
            <h3 className="font-bold text-base text-rose-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Confirm Account Deletion
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Type <strong className="text-white font-mono">DELETE</strong> in the box below to permanently eradicate your account and all associated tokens across Javenly Innovations.
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-rose-500 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE'}
                onClick={() => {
                  deleteAccount();
                  setShowDeleteModal(false);
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50"
              >
                Permanently Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
