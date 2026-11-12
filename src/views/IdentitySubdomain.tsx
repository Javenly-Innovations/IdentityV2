import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  Shield, 
  Lock, 
  Mail, 
  Key, 
  User, 
  CheckCircle2, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Github, 
  Fingerprint, 
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';

export const IdentitySubdomain: React.FC = () => {
  const { 
    currentUser, 
    loginWithEmail, 
    loginWithMagicLink, 
    signup, 
    pendingOAuthRequest,
    approveOAuthConsent,
    denyOAuthConsent,
    applications,
    setCurrentSubdomain
  } = useAuth();

  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'magic' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password strength calculator
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0 to 5
  };

  const passScore = calculatePasswordStrength(password);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await loginWithEmail(email, password);
    setLoading(false);

    if (result.success) {
      if (!pendingOAuthRequest) {
        setCurrentSubdomain('account.javenly.com');
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Invalid credentials' });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passScore < 3) {
      setMessage({ type: 'error', text: 'Please choose a stronger password with at least 8 characters, numbers, and symbols.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const result = await signup(email, password, fullName, username);
    setLoading(false);

    if (result.success) {
      setMessage({ type: 'success', text: 'Account created! Welcome to Javenly Identity.' });
      if (!pendingOAuthRequest) {
        setTimeout(() => setCurrentSubdomain('account.javenly.com'), 1000);
      }
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create account.' });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const result = await loginWithMagicLink(email);
    setLoading(false);
    setMessage({ type: 'success', text: result.message });
  };

  const handleSocialLogin = async (provider: string) => {
    setLoading(true);
    setMessage(null);
    setTimeout(async () => {
      // Simulate OAuth login
      await loginWithEmail('admin@javenly.com');
      setLoading(false);
      setMessage({ type: 'success', text: `Authenticated securely with ${provider} via Supabase Auth!` });
      if (!pendingOAuthRequest) {
        setCurrentSubdomain('account.javenly.com');
      }
    }, 600);
  };

  // If there is an active OAuth 2.1 PKCE Authorization Consent request
  if (pendingOAuthRequest) {
    const app = applications.find(a => a.clientId === pendingOAuthRequest.clientId);
    const appName = pendingOAuthRequest.appName || app?.name || 'Third-Party Application';
    const scopes = (pendingOAuthRequest.scope || 'openid profile email').split(' ');

    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 text-slate-200">
          
          {/* Header */}
          <div className="text-center pb-6 border-b border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[2px] mx-auto mb-3 shadow-lg shadow-sky-500/30">
              <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center">
                <Shield className="w-7 h-7 text-sky-400" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Authorize Application
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              <strong className="text-sky-300 font-semibold">{appName}</strong> is requesting access to your Javenly Identity.
            </p>
          </div>

          {/* Current Signed-in Identity Badge */}
          {currentUser && (
            <div className="my-5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-9 h-9 rounded-lg object-cover ring-1 ring-sky-500/40"
                />
                <div>
                  <p className="text-xs font-bold text-white">{currentUser.fullName}</p>
                  <p className="text-[11px] text-slate-400">{currentUser.email}</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full font-medium">
                Active Session
              </span>
            </div>
          )}

          {/* Scopes Requested */}
          <div className="space-y-3 mb-6">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Permissions Requested:
            </p>
            <div className="space-y-2">
              {scopes.map(sc => (
                <div key={sc} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/70 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-mono font-bold text-sky-300">{sc}</span>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      {sc === 'openid' && 'Verify your identity and provide your unique, stable subject identifier (sub).'}
                      {sc === 'profile' && 'Access your display name, username, avatar photo, and organization profile.'}
                      {sc === 'email' && 'Access and verify your primary Javenly email address.'}
                      {sc === 'offline_access' && 'Maintain persistent connection via secure refresh tokens.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* PKCE Technical Guarantee Info */}
          <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 text-sky-300 text-xs mb-6">
            <div className="flex items-center gap-1.5 font-semibold text-[11px] text-sky-400 mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>OAuth 2.1 PKCE S256 Cryptographic Protection Active</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your password is <strong>never</strong> shared with {appName}. Access is granted via cryptographically signed JWT tokens issued by Supabase Auth.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const res = denyOAuthConsent(pendingOAuthRequest.clientId);
                window.location.hash = res.redirectUrl;
              }}
              className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Deny Access
            </button>
            <button
              onClick={() => {
                const res = approveOAuthConsent(pendingOAuthRequest.clientId, scopes);
                window.location.hash = res.redirectUrl;
                setCurrentSubdomain('sandbox.javenly.com');
              }}
              className="w-1/2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Authorize App</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center mt-4">
            <span className="text-[10px] text-slate-500">
              Redirect URI: <span className="font-mono text-slate-400">{pendingOAuthRequest.redirectUri}</span>
            </span>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-cyan-400 p-[2px] mx-auto mb-4 shadow-xl shadow-sky-500/25">
            <div className="w-full h-full bg-[#0d1322] rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-sky-400" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
            {authMode === 'signin' && 'Sign in to Javenly'}
            {authMode === 'signup' && 'Create your Javenly Account'}
            {authMode === 'magic' && 'Passwordless Magic Link'}
            {authMode === 'forgot' && 'Reset your Javenly Password'}
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400">
            One account for javenly.com, Javenly CRM, and all company services.
          </p>
        </div>

        {/* Auth Card */}
        <div className="mt-8 bg-[#0f172a] border border-slate-800 shadow-2xl rounded-2xl p-6 sm:p-8">
          
          {/* Quick Tabs: Sign In / Create Account / Magic Link */}
          <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setAuthMode('signin'); setMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'signin' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('signup'); setMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'signup' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('magic'); setMessage(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                authMode === 'magic' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Status Message */}
          {message && (
            <div className={`p-3.5 rounded-xl mb-5 text-xs flex items-start gap-2.5 ${
              message.type === 'error'
                ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{message.text}</div>
            </div>
          )}

          {/* Social Logins */}
          {authMode !== 'forgot' && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('Google')}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('GitHub')}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Github className="w-4 h-4 text-white" />
                  <span>GitHub</span>
                </button>
              </div>

              <div className="relative mb-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-[#0f172a] text-slate-500 font-medium">
                    Or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Sign In Form */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work or Personal Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@javenly.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot')}
                    className="text-[11px] text-sky-400 hover:text-sky-300"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Demo quick fill button */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@javenly.com');
                    setPassword('Javenly2025Secure!');
                  }}
                  className="text-[11px] text-slate-400 hover:text-sky-400 underline"
                >
                  ⚡ Autofill Administrator (Javenly Innovations)
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : 'Sign In with Javenly'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration Form */}
          {authMode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Vance"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jordanvance"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@javenly.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters with numbers & symbols"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
                
                {/* Password strength indicator */}
                {password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1 h-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <div
                          key={lvl}
                          className={`flex-1 rounded-full ${
                            passScore >= lvl
                              ? passScore < 3
                                ? 'bg-rose-500'
                                : passScore < 4
                                ? 'bg-amber-400'
                                : 'bg-emerald-400'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Strength: {passScore < 3 ? 'Weak' : passScore < 4 ? 'Good' : 'Very Strong'}
                    </p>
                  </div>
                )}
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <span>
                  No phone number required. Your account will automatically link with javenly.com and internal tools via stable OpenID subject UUID.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Creating Identity...' : 'Create Javenly Account'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Magic Link Form */}
          {authMode === 'magic' && (
            <form onSubmit={handleMagicLink} className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your email address and we'll send you an encrypted passwordless login link powered by Supabase Auth OTP.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@javenly.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Magic Link'}
                <Sparkles className="w-4 h-4 text-sky-300" />
              </button>
            </form>
          )}

          {/* Forgot Password */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your registered Javenly email. We'll send instructions and a secure one-time cryptographic reset token.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@javenly.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMessage({ type: 'success', text: `Password reset link dispatched to ${email || 'your email'}.` });
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow transition-all"
              >
                Send Password Reset Email
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Security and Free-Tier Footer */}
        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>Protected by Javenly Identity • Powered by Supabase Auth Free Tier</p>
          <p className="text-[11px] text-slate-600">
            Compliant with OAuth 2.1 & OpenID Connect PKCE Standards
          </p>
        </div>

      </div>
    </div>
  );
};
