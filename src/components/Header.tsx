import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { Subdomain } from '../types';
import { 
  Shield, 
  Key, 
  User, 
  Settings, 
  Code2, 
  ExternalLink, 
  CheckCircle2, 
  LogOut, 
  Users, 
  Sparkles,
  Database,
  Layers,
  ChevronDown,
  BookOpen
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentUser, 
    users, 
    currentSubdomain, 
    setCurrentSubdomain, 
    logout, 
    switchUser,
    supabaseConfig,
    updateSupabaseConfig
  } = useAuth();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [customUrl, setCustomUrl] = useState(supabaseConfig.url);
  const [customKey, setCustomKey] = useState(supabaseConfig.key);

  const subdomains: { id: Subdomain; label: string; icon: any; tag?: string }[] = [
    { id: 'identity.javenly.com', label: 'Identity Auth', icon: Key },
    { id: 'account.javenly.com', label: 'Account Portal', icon: User },
    { id: 'admin-identity.javenly.com', label: 'Admin Console', icon: Settings, tag: 'Admin' },
    { id: 'api-identity.javenly.com', label: 'API & OIDC', icon: Code2 },
    { id: 'sandbox.javenly.com', label: 'SSO Apps Sandbox', icon: Layers, tag: 'Live' },
    { id: 'docs.javenly.com', label: 'WordPress & Node.js', icon: BookOpen },
  ];

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateSupabaseConfig(customUrl.trim(), customKey.trim());
    setShowConfigModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Brand Logo */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentSubdomain('identity.javenly.com')}
                className="flex items-center gap-2.5 text-left group transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-cyan-400 p-[1.5px] shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all">
                  <div className="w-full h-full bg-[#0d1322] rounded-[10px] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                      JAVENLY
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      IDENTITY
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                    JAVENLY INNOVATIONS
                  </p>
                </div>
              </button>
            </div>

            {/* Subdomain Switcher Navigation */}
            <nav className="hidden lg:flex items-center gap-1 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
              {subdomains.map((sub) => {
                const Icon = sub.icon;
                const isActive = currentSubdomain === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setCurrentSubdomain(sub.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm shadow-sky-500/25'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{sub.label}</span>
                    {sub.tag && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                        isActive ? 'bg-sky-700/80 text-white' : 'bg-slate-800 text-sky-400'
                      }`}>
                        {sub.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Status & Profile Controls */}
            <div className="flex items-center gap-3">
              {/* $0 Free Tier Badge & Supabase Connection Modal Trigger */}
              <button
                onClick={() => setShowConfigModal(true)}
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 text-xs font-medium transition-all"
                title="Configured on permanent $0/month free tier (Supabase Auth + Cloudflare Pages)"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-semibold">$0/mo Free Tier</span>
                <span className="text-[10px] bg-emerald-950/60 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800/40">
                  Supabase Auth
                </span>
              </button>

              {/* User Dropdown / Switcher */}
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all text-left"
                  >
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.fullName}
                      className="w-7 h-7 rounded-lg object-cover ring-1 ring-sky-500/30"
                    />
                    <div className="hidden md:block">
                      <p className="text-xs font-semibold text-slate-200 leading-tight">
                        {currentUser.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {currentUser.role.replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserDropdown && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#0f172a] border border-slate-700 shadow-2xl p-2 z-50 text-slate-200">
                      <div className="p-3 border-b border-slate-800 bg-slate-900/50 rounded-xl mb-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentUser.avatarUrl}
                            alt={currentUser.fullName}
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-sky-500/40"
                          />
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">
                              {currentUser.fullName}
                            </p>
                            <p className="text-xs text-slate-400 truncate">
                              {currentUser.email}
                            </p>
                            <p className="text-[10px] text-sky-400 font-mono mt-0.5 truncate">
                              sub: {currentUser.id.substring(0, 16)}...
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1 mb-2">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500 px-3 py-1">
                          Switch Simulated Persona
                        </p>
                        {users.map(u => (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                              u.id === currentUser.id 
                                ? 'bg-sky-500/20 text-sky-300 font-semibold' 
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <img src={u.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover" />
                              <span className="truncate">{u.fullName}</span>
                            </div>
                            <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              {u.role.replace('_', ' ')}
                            </span>
                          </button>
                        ))}
                      </div>

                      <div className="border-t border-slate-800 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setShowUserDropdown(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 font-medium transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out of Javenly Identity
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setCurrentSubdomain('identity.javenly.com')}
                  className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all"
                >
                  Sign In
                </button>
              )}
            </div>

          </div>

          {/* Mobile subdomains bar */}
          <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-800/80 no-scrollbar">
            {subdomains.map((sub) => {
              const Icon = sub.icon;
              const isActive = currentSubdomain === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setCurrentSubdomain(sub.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap font-medium transition-all ${
                    isActive
                      ? 'bg-sky-600 text-white font-semibold'
                      : 'text-slate-400 bg-slate-900 border border-slate-800'
                  }`}
                >
                  <Icon className="w-3 h-3" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>

        </div>
      </header>

      {/* Supabase Free-Tier & Connection Settings Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0f172a] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6 text-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Supabase Auth Free-Tier Engine
                  </h3>
                  <p className="text-xs text-slate-400">
                    $0/month permanent operating architecture
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Free Tier Guarantees Verified:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 text-emerald-400/90 text-[11px]">
                  <li>Supabase Auth includes <strong>50,000 monthly active users (MAU)</strong> for $0/mo.</li>
                  <li>Full OAuth 2.1 PKCE, JWT tokens, social logins, and passwordless OTP.</li>
                  <li>Frontend deploys directly to <strong>Cloudflare Pages</strong> (Unlimited requests, 500 builds/mo on Free plan).</li>
                  <li>Existing WordPress hosting with <strong>Namecheap remains untouched</strong>.</li>
                </ul>
              </div>

              <form onSubmit={handleSaveConfig} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="text"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://your-project-id.supabase.co"
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-slate-200"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in Supabase Dashboard → Settings → API → Project URL.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supabase Anon Public API Key
                  </label>
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-900 border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 outline-none text-slate-200"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Found in Supabase Dashboard → Settings → API → Project API Keys (anon public).
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomUrl('https://javenly-identity.supabase.co');
                      setCustomKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.demo_key_javenly_identity_free_tier');
                    }}
                    className="text-xs text-sky-400 hover:text-sky-300 underline font-medium"
                  >
                    Restore Demo Sandbox Keys
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowConfigModal(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow"
                    >
                      Save Configuration
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
