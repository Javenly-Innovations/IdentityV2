import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  Globe, 
  Database, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  ExternalLink,
  RefreshCw,
  Layers,
  Code2,
  FileCode,
  Sparkles
} from 'lucide-react';

export const AppsSandbox: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    setPendingOAuthRequest, 
    setCurrentSubdomain 
  } = useAuth();

  const [activeApp, setActiveApp] = useState<'wordpress' | 'crm'>('wordpress');
  const [wpSession, setWpSession] = useState<{
    loggedIn: boolean;
    user?: any;
    metaSub?: string;
    wpRole?: string;
  }>({ loggedIn: false });

  const [crmSession, setCrmSession] = useState<{
    loggedIn: boolean;
    token?: string;
    user?: any;
    role?: string;
  }>({ loggedIn: false });

  const [flowStep, setFlowStep] = useState<number>(0);
  const [flowLog, setFlowLog] = useState<string[]>([]);

  // Trigger real OAuth 2.1 PKCE Redirect Simulation
  const triggerWordPressSSO = () => {
    setFlowStep(1);
    setFlowLog(['[Step 1] User clicks "Sign in with Javenly" on javenly.com (WordPress).']);

    setTimeout(() => {
      setFlowStep(2);
      setFlowLog(prev => [
        ...prev, 
        '[Step 2] WordPress plugin generates PKCE code_verifier, calculates code_challenge (SHA-256), and cryptographic state.',
        '[Step 3] Redirecting to https://identity.javenly.com/v1/auth/authorize'
      ]);

      const wpApp = applications.find(a => a.id === 'app_jav_wp_01') || applications[0];

      // Setup pending OAuth request in context
      setPendingOAuthRequest({
        clientId: wpApp.clientId,
        redirectUri: wpApp.redirectUris[0],
        responseType: 'code',
        scope: 'openid profile email',
        state: `state_wp_${Date.now()}`,
        codeChallenge: 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        codeChallengeMethod: 'S256',
        appName: 'Javenly WordPress Main Site',
      });

      // Switch view to central identity auth for consent!
      setCurrentSubdomain('identity.javenly.com');
    }, 800);
  };

  const simulateCompleteWordPressLogin = () => {
    if (!currentUser) return;
    setFlowStep(4);
    setFlowLog([
      '[Step 1] Initiated from javenly.com.',
      '[Step 2] PKCE challenge & state validated.',
      '[Step 3] User authorized via Javenly Identity.',
      `[Step 4] Received authorization code at /wp-json/javenly/v1/callback.`,
      `[Step 5] Server-side token exchange validated with Supabase Auth GoTrue.`,
      `[Step 6] WordPress user created/linked with metadata _javenly_identity_sub = ${currentUser.id}`,
      `[Step 7] WordPress session cookie issued. Access granted!`,
    ]);

    setWpSession({
      loggedIn: true,
      user: currentUser,
      metaSub: currentUser.id,
      wpRole: currentUser.role === 'super_admin' ? 'Administrator' : currentUser.role === 'admin' ? 'Editor' : 'Subscriber',
    });
  };

  const triggerCrmSSO = () => {
    if (!currentUser) return;
    setCrmSession({
      loggedIn: true,
      token: `jav_jwt_live_${Math.random().toString(36).substring(2, 10)}...`,
      user: currentUser,
      role: currentUser.role,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-800/40">
            Live Ecosystem Sandbox
          </span>
          <span className="text-xs text-slate-400 font-mono">sandbox.javenly.com</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Single Sign-On (SSO) Client Apps Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Experience real-world authentication flows from <strong>javenly.com (WordPress on Namecheap)</strong> and Javenly CRM (Node.js).
        </p>
      </div>

      {/* App selector tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setActiveApp('wordpress')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeApp === 'wordpress'
              ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>WordPress Main Site (javenly.com)</span>
        </button>

        <button
          onClick={() => setActiveApp('crm')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeApp === 'crm'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Javenly CRM (Node.js App)</span>
        </button>
      </div>

      {/* APP 1: WORDPRESS SIMULATOR */}
      {activeApp === 'wordpress' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Simulated WordPress Client View */}
          <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Browser chrome header */}
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="px-4 py-1 rounded-md bg-slate-950 font-mono text-xs text-slate-400 border border-slate-800 flex items-center gap-2">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>https://javenly.com/wp-login.php</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Namecheap Host</span>
            </div>

            {/* Simulated WordPress Content */}
            <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center items-center text-center">
              
              {!wpSession.loggedIn ? (
                <div className="w-full max-w-sm space-y-6">
                  {/* WordPress Logo */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-700 p-1 mx-auto shadow-xl flex items-center justify-center">
                    <Globe className="w-9 h-9 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-white">javenly.com</h3>
                    <p className="text-xs text-slate-400 mt-1">Official Javenly Innovations WordPress Site</p>
                  </div>

                  {/* Standard WP form with JAVENLY IDENTITY CONNECTOR BUTTON */}
                  <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4 text-left">
                    {/* The primary SSO Button */}
                    <button
                      type="button"
                      onClick={triggerWordPressSSO}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2.5 group"
                    >
                      <ShieldCheck className="w-4 h-4 text-sky-200 group-hover:scale-110 transition-transform" />
                      <span>Sign in with Javenly</span>
                    </button>

                    <div className="relative text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800" />
                      </div>
                      <span className="relative px-3 bg-slate-900 text-[10px] uppercase font-bold text-slate-500">
                        Or standard WP login
                      </span>
                    </div>

                    <div className="space-y-2 opacity-60 pointer-events-none">
                      <input
                        type="text"
                        disabled
                        placeholder="WordPress Username"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-500"
                      />
                      <input
                        type="password"
                        disabled
                        placeholder="WordPress Password"
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-500"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Powered by <strong className="text-slate-400">Javenly Identity Connector</strong> Plugin. Existing WP database untouched.
                  </p>
                </div>
              ) : (
                /* Logged In WordPress Admin Area */
                <div className="w-full text-left space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <div>
                        <p className="font-bold">WordPress Single Sign-On Active!</p>
                        <p className="text-[11px] text-emerald-400/80">
                          Authenticated via Supabase Auth OIDC token exchange.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setWpSession({ loggedIn: false })}
                      className="text-xs underline text-slate-400 hover:text-white"
                    >
                      Log Out of WP
                    </button>
                  </div>

                  {/* WordPress User Record Inspection */}
                  <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 space-y-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400" />
                      WordPress User Profile in `wp_users`
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Display Name:</span>
                        <p className="font-bold text-white mt-0.5">{wpSession.user.fullName}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">User Login (Email):</span>
                        <p className="font-mono text-slate-300 mt-0.5">{wpSession.user.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">Assigned WordPress Role:</span>
                        <p className="font-bold text-sky-400 mt-0.5">{wpSession.wpRole}</p>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[11px]">User ID (wp_users ID):</span>
                        <p className="font-mono text-slate-300 mt-0.5">#42</p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <span className="text-slate-500 text-[11px] font-semibold">
                        Custom User Metadata (`wp_usermeta`):
                      </span>
                      <div className="mt-1 p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-sky-300 break-all">
                        <span className="text-slate-500">_javenly_identity_sub: </span>
                        {wpSession.metaSub}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">
                        ✓ Note: Permanent sub identifier links accounts even if user changes their email address in WordPress.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Right Flow Log & Explanation */}
          <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-sky-400" />
                  OAuth 2.1 PKCE Flow Telemetry
                </h3>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                  RFC 7636 Validated
                </span>
              </div>

              <div className="py-4 space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">
                  The Javenly WordPress Connector uses <strong>Authorization Code Flow with PKCE (S256)</strong>. WordPress never sees the user's password.
                </p>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono">
                  <div className="text-slate-500 text-[11px] uppercase font-bold">10-Step Standards Flow:</div>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-400 text-[11px]">
                    <li>User selects "Sign in with Javenly" on javenly.com.</li>
                    <li>WordPress initiates redirect to identity.javenly.com.</li>
                    <li>Supabase Auth GoTrue verifies session or prompts sign-in.</li>
                    <li>User grants consent for scopes (openid, profile, email).</li>
                    <li>Authorization code returned to WordPress callback URI.</li>
                    <li>WordPress server-side exchanges code for tokens.</li>
                    <li>Token signature & issuer claims validated.</li>
                    <li>WordPress queries `_javenly_identity_sub` in usermeta.</li>
                    <li>User logged in with mapped WordPress role.</li>
                  </ol>
                </div>

                {/* Simulate complete login shortcut if user was in identity */}
                {!wpSession.loggedIn && currentUser && (
                  <button
                    type="button"
                    onClick={simulateCompleteWordPressLogin}
                    className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-300 border border-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>⚡ Quick Complete WordPress Token Exchange</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Connector Version: 1.0.0</span>
              <span>WordPress 6.x Ready</span>
            </div>
          </div>

        </div>
      )}

      {/* APP 2: NODE.JS CRM SIMULATOR */}
      {activeApp === 'crm' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="px-4 py-1 rounded-md bg-slate-950 font-mono text-xs text-slate-400 border border-slate-800 flex items-center gap-2">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>https://crm.javenly.com/dashboard</span>
              </div>
              <span className="text-[10px] text-indigo-400 font-mono">Node.js Express App</span>
            </div>

            <div className="p-8">
              {!crmSession.loggedIn ? (
                <div className="max-w-md mx-auto text-center space-y-4 py-8">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                    <Database className="w-7 h-7" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Javenly CRM Platform</h3>
                  <p className="text-xs text-slate-400">
                    Internal business operations portal protected with <code className="text-sky-300">@javenly/identity-node</code>.
                  </p>
                  <button
                    onClick={triggerCrmSSO}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Sign in with Javenly Identity</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <img src={crmSession.user.avatarUrl} alt="" className="w-10 h-10 rounded-xl object-cover" />
                      <div>
                        <h4 className="font-bold text-white text-sm">{crmSession.user.fullName}</h4>
                        <p className="text-xs text-slate-400 font-mono">{crmSession.user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setCrmSession({ loggedIn: false })}
                      className="text-xs text-rose-400 hover:underline"
                    >
                      Sign Out
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[11px]">CRM Role:</span>
                      <p className="font-bold text-white capitalize">{(crmSession.role || 'user').replace('_', ' ')}</p>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-500 text-[11px]">Authorization:</span>
                      <p className="font-bold text-emerald-400">Bearer JWT Valid</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300">
                    <span className="text-slate-500">req.javenlyUser payload:</span>
                    <pre className="mt-1 text-sky-300">
{JSON.stringify({
  sub: crmSession.user.id,
  email: crmSession.user.email,
  name: crmSession.user.fullName,
  role: crmSession.role,
}, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800 rounded-2xl p-6">
            <h3 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-indigo-400" />
              Node.js Integration Code Preview
            </h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              In your Express or Hono application, authenticate requests with a single middleware:
            </p>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-indigo-300 overflow-x-auto">
{`import express from 'express';
import { javenlyAuth } from '@javenly/identity-node';

const app = express();

app.use(javenlyAuth({
  issuer: 'https://identity.javenly.com',
  clientId: process.env.JAVENLY_CLIENT_ID,
  clientSecret: process.env.JAVENLY_CLIENT_SECRET,
}));

app.get('/api/crm/data', (req, res) => {
  // req.javenlyUser contains verified sub UUID
  res.json({ user: req.javenlyUser });
});`}
            </pre>
          </div>
        </div>
      )}

    </div>
  );
};
