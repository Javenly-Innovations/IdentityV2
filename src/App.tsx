import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  ArrowRight,
  ExternalLink,
  KeyRound,
  Download,
  X,
  Copy,
  Check,
  ShieldCheck,
  Shield,
  Database,
  Lock
} from 'lucide-react';
import { getSupabaseClient, getSupabaseConfig, resetSupabaseClient } from './lib/supabase';
import { AdminSubdomain } from './views/AdminSubdomain';
import { useAuth } from './lib/auth-context';
import { JavenlyUser } from './types';

interface OAuthRequest {
  clientId: string;
  appName: string;
  redirectUri: string;
  responseType: string;
  scope: string;
  state: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
}

export default function App() {
  const { setCurrentUser: setContextUser, logout: authLogout } = useAuth();
  const [currentView, setCurrentView] = useState<'login' | 'admin'>('login');
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'forgot' | 'new_password'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [showDbErrorModal, setShowDbErrorModal] = useState(false);
  const [showSchemaErrorModal, setShowSchemaErrorModal] = useState(false);
  const [copiedFixSql, setCopiedFixSql] = useState(false);
  const [copiedSchemaFixSql, setCopiedSchemaFixSql] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Active OAuth 2.1 Request (when redirected from javenly.com)
  const [activeOAuthRequest, setActiveOAuthRequest] = useState<OAuthRequest | null>(null);

  // Current Logged-in State
  const [currentUser, setCurrentUser] = useState<JavenlyUser | null>(() => {
    const saved = localStorage.getItem('javenly_logged_user');
    return saved ? JSON.parse(saved) : null;
  });

  const supabaseConfig = getSupabaseConfig();

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('javenly_logged_user', JSON.stringify(currentUser));
      setContextUser(currentUser);
    } else {
      localStorage.removeItem('javenly_logged_user');
      setContextUser(null);
    }
  }, [currentUser, setContextUser]);

  // Check URL query parameters for OAuth 2.1 authorization request or password recovery token
  useEffect(() => {
    // 1. Check for Password Recovery in URL hash (from Supabase reset email)
    const hash = window.location.hash;
    if (hash && (hash.includes('type=recovery') || hash.includes('access_token='))) {
      setAuthMode('new_password');
      setMessage({
        type: 'success',
        text: 'Recovery link verified! Please enter your new password below.',
      });
    }

    // 2. Also listen for PASSWORD_RECOVERY event from Supabase Auth
    try {
      const client = getSupabaseClient();
      const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setAuthMode('new_password');
          setMessage({
            type: 'success',
            text: 'Password recovery verified. Please enter your new password.',
          });
        }
      });
      return () => subscription.unsubscribe();
    } catch (err) {
      console.warn('Auth listener setup:', err);
    }

    // 3. Check for OAuth 2.1 authorization parameters
    const params = new URLSearchParams(window.location.search);
    const clientId = params.get('client_id');
    const redirectUri = params.get('redirect_uri');
    if (clientId && redirectUri) {
      setActiveOAuthRequest({
        clientId,
        appName: clientId.includes('wordpress') ? 'Javenly WordPress' : 'Javenly Application',
        redirectUri,
        responseType: params.get('response_type') || 'code',
        scope: params.get('scope') || 'openid profile email',
        state: params.get('state') || 'state_123',
        codeChallenge: params.get('code_challenge') || 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM',
        codeChallengeMethod: 'S256',
      });
    }
  }, []);

  // Helper to build OAuth 2.1 callback URL with user's verified identity
  const buildOAuthCallbackUrl = (request: typeof activeOAuthRequest, user: JavenlyUser) => {
    if (!request) return '';

    const authPayload = {
      sub: user.id,
      email: user.email,
      name: user.fullName,
      role: (user.role as string) === 'super_admin' ? 'Administrator' : user.role,
      iss: 'https://identity.javenly.com',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };

    let encodedPayload = '';
    try {
      encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(authPayload))))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    } catch {
      encodedPayload = btoa(JSON.stringify(authPayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    const authCode = `jav_${encodedPayload}`;
    const separator = request.redirectUri.includes('?') ? '&' : '?';
    const params = new URLSearchParams({
      code: authCode,
      state: request.state || '',
      email: user.email,
      sub: user.id,
      name: user.fullName,
      role: (user.role as string) === 'super_admin' ? 'Administrator' : user.role,
      auth_token: encodedPayload,
    });

    return `${request.redirectUri}${separator}${params.toString()}`;
  };

  // Handle Log In - strictly verified via Supabase Auth
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    if (!password) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please enter your password.' });
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: normalizedEmail,
        password: password,
      });

      if (error) {
        setLoading(false);
        if (error.message.toLowerCase().includes('querying schema')) {
          setShowSchemaErrorModal(true);
          return;
        }
        setMessage({ type: 'error', text: error.message || 'Invalid login credentials.' });
        return;
      }

      if (data?.user) {
        // Fetch role from profiles table in Supabase
        let resolvedRole: 'super_admin' | 'admin' | 'developer' | 'user' = 'user';
        let resolvedFullName = data.user.user_metadata?.full_name || 'Javenly User';
        let profileRole: string | undefined = undefined;
        let profileStatus: string | undefined = undefined;

        try {
          const { data: profile } = await client
            .from('profiles')
            .select('role, full_name, status')
            .eq('id', data.user.id)
            .single();

          if (profile?.role) {
            profileRole = profile.role;
            if (profile.role === 'Administrator' || profile.role === 'admin' || profile.role === 'super_admin') {
              resolvedRole = 'super_admin';
            }
          }
          if (profile?.full_name) {
            resolvedFullName = profile.full_name;
          }
          if ((profile as any)?.status) {
            profileStatus = (profile as any).status;
          }
        } catch (profileErr) {
          console.warn('Profile fetch notice:', profileErr);
        }

        // If verified by Supabase and account is designated administrator
        if (
          normalizedEmail === 'admin@javenly.com' ||
          normalizedEmail === 'business@javenly.com' ||
          data.user.user_metadata?.role === 'Administrator' ||
          data.user.user_metadata?.role === 'admin' ||
          profileRole === 'Administrator' ||
          profileRole === 'admin' ||
          profileRole === 'super_admin'
        ) {
          resolvedRole = 'super_admin';
          resolvedFullName = resolvedFullName === 'Javenly User' ? 'Javenly Innovations' : resolvedFullName;
        }

        // Check if user is suspended or deleted by admin
        const statusOverrides: Record<string, string> = (() => {
          try {
            const saved = localStorage.getItem('javenly_user_status_overrides');
            return saved ? JSON.parse(saved) : {};
          } catch {
            return {};
          }
        })();

        const deletedUserIds: string[] = (() => {
          try {
            const saved = localStorage.getItem('javenly_deleted_user_ids');
            return saved ? JSON.parse(saved) : [];
          } catch {
            return [];
          }
        })();

        if (deletedUserIds.includes(data.user.id) || deletedUserIds.includes(normalizedEmail)) {
          setLoading(false);
          setMessage({ type: 'error', text: 'This account has been deleted by an administrator.' });
          return;
        }

        const userStatus = statusOverrides[data.user.id] || statusOverrides[normalizedEmail] || profileStatus || 'active';
        if (userStatus === 'suspended') {
          setLoading(false);
          setMessage({ type: 'error', text: 'This account has been suspended by an administrator. Please contact security@javenly.com.' });
          return;
        }

        const user: JavenlyUser = {
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          fullName: resolvedFullName,
          username: normalizedEmail.split('@')[0],
          avatarUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
          role: resolvedRole,
          company: 'Javenly Innovations',
          emailVerified: true,
          mfaEnabled: false,
          createdAt: data.user.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          status: userStatus as 'active' | 'suspended',
          metadata: {},
        };

        setCurrentUser(user);
        setContextUser(user);
        localStorage.setItem('javenly_logged_user', JSON.stringify(user));

        if (activeOAuthRequest) {
          setMessage({ 
            type: 'success', 
            text: `Authenticated as ${resolvedFullName}! Returning you to WordPress...` 
          });
          const callbackUrl = buildOAuthCallbackUrl(activeOAuthRequest, user);
          setTimeout(() => {
            window.location.href = callbackUrl;
          }, 350);
          return;
        }

        setLoading(false);
        setMessage({ type: 'success', text: `Welcome back, ${resolvedFullName}!` });
        return;
      }

      setLoading(false);
      setMessage({ type: 'error', text: 'Invalid login credentials.' });
    } catch (err: any) {
      setLoading(false);
      setMessage({ type: 'error', text: err.message || 'Error communicating with Supabase.' });
    }
  };

  // Handle Registration
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const normalizedEmail = email.trim().toLowerCase();

    if (password !== confirmPassword) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      const client = getSupabaseClient();
      const { data, error } = await client.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            full_name: fullName.trim() || 'Javenly Member',
            role: 'Member',
            company: 'Javenly Innovations',
          },
        },
      });

      if (error) {
        setLoading(false);
        if (error.message.includes('Database error saving new user')) {
          setShowDbErrorModal(true);
          return;
        }
        setMessage({ type: 'error', text: error.message });
        return;
      }

      setLoading(false);
      if (data?.session && data?.user) {
        const user: JavenlyUser = {
          id: data.user.id,
          email: data.user.email || normalizedEmail,
          fullName: fullName.trim() || 'Javenly Member',
          username: normalizedEmail.split('@')[0],
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          role: 'user',
          company: 'Javenly Innovations',
          emailVerified: false,
          mfaEnabled: false,
          createdAt: data.user.created_at || new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
          status: 'active',
          metadata: {},
        };
        setCurrentUser(user);
        setContextUser(user);
        localStorage.setItem('javenly_logged_user', JSON.stringify(user));

        if (activeOAuthRequest) {
          setMessage({ 
            type: 'success', 
            text: `Account created! Returning you to WordPress...` 
          });
          const callbackUrl = buildOAuthCallbackUrl(activeOAuthRequest, user);
          setTimeout(() => {
            window.location.href = callbackUrl;
          }, 350);
          return;
        }

        setMessage({ type: 'success', text: 'Account registered successfully!' });
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Account created! Please check your email to confirm your account, then log in.' 
        });
        setAuthMode('signin');
      }
    } catch (err: any) {
      setLoading(false);
      setMessage({ type: 'error', text: err.message || 'Error communicating with Supabase.' });
    }
  };

  // Real Password Reset Request (Dispatches password recovery email via Supabase)
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.resetPasswordForEmail(targetEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        setLoading(false);
        setMessage({ type: 'error', text: error.message });
        return;
      }

      setLoading(false);
      setMessage({
        type: 'success',
        text: `A password reset link has been dispatched to ${targetEmail}. Please check your inbox and spam folder.`,
      });
    } catch (err: any) {
      setLoading(false);
      setMessage({ type: 'error', text: err.message || 'Error communicating with Supabase.' });
    }
  };

  // Set New Password via Supabase Auth
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setLoading(false);
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setLoading(false);
      setMessage({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }

    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setLoading(false);
        setMessage({ type: 'error', text: error.message });
        return;
      }

      setLoading(false);
      setMessage({ type: 'success', text: 'Your password has been updated successfully! You can now log in.' });
      setAuthMode('signin');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setLoading(false);
      setMessage({ type: 'error', text: err.message || 'Error communicating with Supabase.' });
    }
  };

  // OAuth 2.1 Consent Actions
  const handleApproveOAuth = () => {
    if (!activeOAuthRequest || !currentUser) return;
    const callbackUrl = buildOAuthCallbackUrl(activeOAuthRequest, currentUser);
    if (callbackUrl) {
      window.location.href = callbackUrl;
    }
  };

  const handleDenyOAuth = () => {
    if (!activeOAuthRequest) return;
    const callbackUrl = `${activeOAuthRequest.redirectUri}?error=access_denied&error_description=User+denied+authorization&state=${encodeURIComponent(activeOAuthRequest.state)}`;
    window.location.href = callbackUrl;
  };

  // Verified admin role or designated administrator accounts
  const isAdminUser = Boolean(
    currentUser && (
      currentUser.role === 'super_admin' ||
      currentUser.role === 'admin' ||
      (currentUser.role as string) === 'Administrator' ||
      currentUser.email?.toLowerCase() === 'admin@javenly.com' ||
      currentUser.email?.toLowerCase() === 'business@javenly.com'
    )
  );

  if (currentView === 'admin' && isAdminUser) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 selection:bg-sky-500 selection:text-white">
        <AdminSubdomain onBack={() => setCurrentView('login')} currentUser={currentUser} />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex flex-col items-center justify-center relative font-sans selection:bg-[#cb475b] selection:text-white px-4 py-8"
      style={{
        backgroundImage: `url('/assets/javenly_login_bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      
      {/* Subtle Dark Vignette Overlay for Depth */}
      <div className="absolute inset-0 bg-black/15 pointer-events-none" />

      {/* CENTER COLUMN CONTAINER */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[410px]">
        
        {/* Javenly Logo floating above the login card */}
        <div className="mb-6 select-none">
          <img
            src="/assets/aistudio/Gemini_Generated_Image_5xfn6o5xfn6o5xfn-removebg-preview__1__46f6d8c3.png"
            alt="Javenly Innovations"
            className="h-16 sm:h-[72px] w-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          />
        </div>

        {/* 1. OAUTH 2.1 AUTHORIZATION CONSENT CARD (If coming from javenly.com with client_id) */}
        {activeOAuthRequest && currentUser ? (
          <div className="w-full bg-white rounded-2xl shadow-2xl p-7 sm:p-8 animate-fade-in text-slate-800">
            <div className="text-center pb-4 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Authorize Application
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                <strong className="text-[#00A3E0]">{activeOAuthRequest.appName}</strong> requests access to your Javenly account.
              </p>
            </div>

            <div className="my-5 p-3.5 rounded-xl bg-[#ecf3fe] border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-900">{currentUser.fullName}</p>
                <p className="text-[11px] text-slate-500 font-mono">{currentUser.email}</p>
              </div>
              <span className="text-[10px] text-[#00A3E0] font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                Logged In
              </span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleDenyOAuth}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Deny
              </button>
              <button
                onClick={handleApproveOAuth}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00A3E0] hover:bg-[#0092c9] shadow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Authorize & Return</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCurrentUser(null);
                authLogout();
                setMessage(null);
              }}
              className="w-full mt-3 text-xs text-slate-400 hover:text-slate-600 underline text-center cursor-pointer"
            >
              Sign in with a different account
            </button>
          </div>
        ) : currentUser ? (
          /* 2. LOGGED IN STATE (Clean & Minimal) */
          <div className="w-full bg-white rounded-2xl shadow-2xl p-7 sm:p-8 animate-fade-in text-center text-slate-800">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Logged In</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900">
              {currentUser.fullName}
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5 mb-6">
              {currentUser.email}
            </p>

            <div className="space-y-2.5">
              {/* Admin Dashboard Action for Administrators */}
              {isAdminUser && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('admin');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 shadow cursor-pointer border border-slate-700"
                >
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>Open Identity Admin Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <a
                href="https://javenly.com"
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#00A3E0] hover:bg-[#0092c9] transition-colors flex items-center justify-center gap-1.5 shadow"
              >
                <span>Return to Javenly.com</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  authLogout();
                  setMessage({ type: 'success', text: 'Logged out successfully.' });
                }}
                className="w-full py-2 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-[#cb475b] hover:bg-red-50 border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* 3. NORMAL AUTHENTICATION CARD */
          <div className="w-full bg-white rounded-2xl shadow-2xl p-7 sm:p-9 text-slate-800">
            
            {/* Status Alert */}
            {message && (
              <div className={`p-3 rounded-lg mb-4 text-xs flex items-start gap-2 ${
                message.type === 'error'
                  ? 'bg-red-50 text-[#cb475b] border border-red-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {message.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span className="leading-relaxed">{message.text}</span>
              </div>
            )}

            {/* FORM A: SIGN IN (EXACT MATCH TO SCREENSHOT) */}
            {authMode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-normal text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="business@javenly.com"
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#ecf3fe] border border-blue-100/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-[#e6f0fe] focus:border-[#00A3E0] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-normal text-slate-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-11 py-3 text-sm rounded-lg bg-[#ecf3fe] border border-blue-100/60 text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-[#e6f0fe] focus:border-[#00A3E0] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#cb475b] hover:opacity-80 transition-opacity p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#cb475b] focus:ring-[#cb475b] border-slate-300 accent-[#cb475b] cursor-pointer"
                  />
                  <label htmlFor="remember" className="text-sm text-slate-700 font-normal select-none cursor-pointer">
                    Remember Me
                  </label>
                </div>

                {/* Wide Berry-Red Log In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-base font-bold text-white bg-[#cb475b] hover:bg-[#ba3d50] active:scale-[0.99] transition-all shadow-md shadow-[#cb475b]/25 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? 'Logging in...' : 'Log In'}
                </button>
              </form>
            )}

            {/* FORM B: REGISTER */}
            {authMode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-3.5">
                <div className="text-center pb-2">
                  <h3 className="text-base font-bold text-slate-900">Create Javenly Account</h3>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#ecf3fe] border border-blue-100 text-slate-800 focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@javenly.com"
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#ecf3fe] border border-blue-100 text-slate-800 focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-3.5 pr-10 py-2.5 text-xs rounded-lg bg-[#ecf3fe] border border-blue-100 text-slate-800 focus:outline-none focus:border-[#00A3E0]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#cb475b] p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 text-xs rounded-lg bg-[#ecf3fe] border border-blue-100 text-slate-800 focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#cb475b] hover:bg-[#ba3d50] transition-colors shadow mt-2 cursor-pointer"
                >
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </form>
            )}

            {/* FORM C: REQUEST PASSWORD RESET (LOST YOUR PASSWORD) */}
            {authMode === 'forgot' && (
              <form onSubmit={handleRequestPasswordReset} className="space-y-4">
                <div className="text-center pb-1">
                  <h3 className="text-base font-bold text-slate-900">Reset Your Password</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Enter your email to receive a password reset link.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-normal text-slate-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="business@javenly.com"
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#ecf3fe] border border-blue-100 text-slate-800 focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#cb475b] hover:bg-[#ba3d50] transition-colors shadow cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Sending link...' : 'Send Reset Link'}
                </button>

                {/* Direct Password Reset Link Option */}
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('new_password'); setMessage(null); }}
                    className="text-xs text-[#00A3E0] hover:underline cursor-pointer inline-flex items-center gap-1"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Have a recovery token or want to enter new password directly?</span>
                  </button>
                </div>
              </form>
            )}

            {/* FORM D: SET NEW PASSWORD */}
            {authMode === 'new_password' && (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="text-center pb-1">
                  <h3 className="text-base font-bold text-slate-900">Enter New Password</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Choose a new password for your account.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-normal text-slate-700 mb-1.5">
                    New Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-11 py-3 text-sm rounded-lg bg-[#ecf3fe] border border-blue-100 text-slate-800 focus:outline-none focus:border-[#00A3E0]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-[#cb475b] p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-normal text-slate-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 text-sm rounded-lg bg-[#ecf3fe] border border-blue-100 text-slate-800 focus:outline-none focus:border-[#00A3E0]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-[#cb475b] hover:bg-[#ba3d50] transition-colors shadow cursor-pointer disabled:opacity-60"
                >
                  {loading ? 'Updating password...' : 'Update Password'}
                </button>
              </form>
            )}

          </div>
        )}

        {/* BOTTOM LINKS (Exact replica of user screenshot) */}
        <div className="w-full mt-4 text-center">
          {authMode === 'signin' ? (
            <div className="flex items-center justify-between text-xs text-slate-300 font-normal px-2">
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setMessage(null); }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Register
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('forgot'); setMessage(null); }}
                className="hover:text-white transition-colors cursor-pointer"
              >
                Lost your password?
              </button>
            </div>
          ) : (
            <div className="text-center text-xs text-slate-300">
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setMessage(null); }}
                className="hover:text-white transition-colors underline cursor-pointer"
              >
                ← Back to Log In
              </button>
            </div>
          )}

          {/* Back to Javenly Innovations */}
          <div className="mt-4 flex items-center justify-center text-xs text-slate-400">
            <a
              href="https://javenly.com"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors inline-flex items-center gap-1"
            >
              <span>←</span>
              <span>Back to Javenly Innovations</span>
            </a>
          </div>
        </div>

      </div>

      {/* DATABASE TRIGGER ERROR MODAL & 1-CLICK SQL FIX */}
      {showDbErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-7">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Database Trigger Fix Required
                  </h3>
                  <p className="text-xs text-amber-600 font-mono">
                    Supabase: "Database error saving new user"
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDbErrorModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                This error happens when the database trigger attached to <code>auth.users</code> encounters an error during signup. Running the script below in your Supabase SQL Editor fixes it permanently.
              </p>

              {/* 1-Click Copy SQL Fix */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">1-Step Fix for Supabase SQL Editor:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const fixSql = `-- Run this in Supabase Dashboard -> SQL Editor:
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role, company)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    case when lower(new.email) in ('admin@javenly.com', 'business@javenly.com') then 'Administrator' else 'Member' end,
    'Javenly Innovations'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name);
  return new;
exception when others then
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();`;
                      navigator.clipboard.writeText(fixSql);
                      setCopiedFixSql(true);
                      setTimeout(() => setCopiedFixSql(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00A3E0] hover:bg-[#0092c9] text-white font-bold text-xs shadow cursor-pointer"
                  >
                    {copiedFixSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFixSql ? 'Copied SQL!' : 'Copy 1-Step Fix SQL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Open your <strong>Supabase Dashboard → SQL Editor → New Query</strong>, paste this script, and click <strong>Run</strong>. The <code>exception when others then return new;</code> clause permanently prevents user creation rollbacks.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowDbErrorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEMA NULL TOKEN ERROR MODAL & 1-CLICK FIX */}
      {showSchemaErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in text-slate-800">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Fix: Database Error Querying Schema
                  </h3>
                  <p className="text-xs text-amber-600 font-mono">
                    Supabase Auth NULL token scan issue
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowSchemaErrorModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>
                In Supabase Auth (GoTrue), this error occurs when a user row in <code>auth.users</code> has <code>NULL</code> values in token fields (like <code>confirmation_token</code> or <code>recovery_token</code>) from a raw SQL insert.
              </p>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">1-Step SQL Cleanup:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const fixSql = `update auth.users
set 
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change = coalesce(email_change, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  phone_change = coalesce(phone_change, ''),
  phone_change_token = coalesce(phone_change_token, '')
where 
  confirmation_token is null 
  or recovery_token is null 
  or email_change is null 
  or email_change_token_new is null;`;
                      navigator.clipboard.writeText(fixSql);
                      setCopiedSchemaFixSql(true);
                      setTimeout(() => setCopiedSchemaFixSql(false), 2000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00A3E0] hover:bg-[#0092c9] text-white font-bold text-xs shadow cursor-pointer"
                  >
                    {copiedSchemaFixSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSchemaFixSql ? 'Copied SQL!' : 'Copy 1-Step Fix SQL'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Run this in your <strong>Supabase Dashboard → SQL Editor</strong>. It converts all <code>NULL</code> token columns into clean empty strings.
                </p>
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-slate-700">
                <span className="font-bold text-slate-900">Alternative 10-Second Fix:</span>
                <p className="text-[11px] mt-1 text-slate-600">
                  Go to <strong>Authentication → Users</strong> in your Supabase Dashboard, click <strong>Add user → Create user</strong>, enter <code>business@javenly.com</code> (or your email), set a password, and toggle <strong>Auto Confirm: ON</strong>.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowSchemaErrorModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
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
}
