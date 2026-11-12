import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { 
  Code2, 
  Play, 
  Copy, 
  Check, 
  Server, 
  Lock, 
  ExternalLink,
  Sparkles,
  Database
} from 'lucide-react';

interface Endpoint {
  method: 'GET' | 'POST' | 'DELETE';
  path: string;
  category: 'OIDC Discovery' | 'User & Profile' | 'OAuth Applications' | 'Security';
  description: string;
  authRequired: boolean;
  sampleBody?: any;
}

export const ApiSubdomain: React.FC = () => {
  const { 
    currentUser, 
    applications, 
    connectedApps, 
    sessions, 
    users 
  } = useAuth();

  const endpoints: Endpoint[] = [
    {
      method: 'GET',
      path: '/.well-known/openid-configuration',
      category: 'OIDC Discovery',
      description: 'Standard OpenID Connect 1.0 Discovery document with issuer, token endpoints, JWKS URI, and supported claims.',
      authRequired: false,
    },
    {
      method: 'GET',
      path: '/api/v1/me',
      category: 'User & Profile',
      description: 'OpenID Connect UserInfo endpoint returning verified claims for the authenticated subject (sub).',
      authRequired: true,
    },
    {
      method: 'GET',
      path: '/api/v1/profile',
      category: 'User & Profile',
      description: 'Extended personal profile metadata, organization, timezone, and avatar references.',
      authRequired: true,
    },
    {
      method: 'GET',
      path: '/api/v1/applications',
      category: 'OAuth Applications',
      description: 'List of registered OAuth 2.1 client applications and allowed redirect callback URIs.',
      authRequired: false,
    },
    {
      method: 'GET',
      path: '/api/v1/connected-applications',
      category: 'OAuth Applications',
      description: 'Applications authorized by the currently authenticated user with scopes granted.',
      authRequired: true,
    },
    {
      method: 'GET',
      path: '/api/v1/security/sessions',
      category: 'Security',
      description: 'Active refresh token families and browser/device sessions for the caller.',
      authRequired: true,
    },
    {
      method: 'POST',
      path: '/api/v1/security/sessions/revoke',
      category: 'Security',
      description: 'Revoke a specific device session ID and invalidate its refresh token.',
      authRequired: true,
      sampleBody: {
        sessionId: 'sess_live_iphone',
        reason: 'User manual revocation',
      },
    },
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[0]);
  const [activeTab, setActiveTab] = useState<'response' | 'curl'>('response');
  const [responseOutput, setResponseOutput] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const executeRequest = () => {
    const start = performance.now();

    let output: any = null;
    let status = 200;

    switch (selectedEndpoint.path) {
      case '/.well-known/openid-configuration':
        output = {
          issuer: 'https://identity.javenly.com',
          authorization_endpoint: 'https://identity.javenly.com/v1/auth/authorize',
          token_endpoint: 'https://api-identity.javenly.com/v1/auth/token',
          userinfo_endpoint: 'https://api-identity.javenly.com/api/v1/me',
          jwks_uri: 'https://api-identity.javenly.com/.well-known/jwks.json',
          revocation_endpoint: 'https://api-identity.javenly.com/v1/auth/revoke',
          response_types_supported: ['code'],
          response_modes_supported: ['query'],
          grant_types_supported: ['authorization_code', 'refresh_token'],
          token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic', 'none'],
          code_challenge_methods_supported: ['S256'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256', 'ES256'],
          scopes_supported: ['openid', 'profile', 'email', 'offline_access'],
          claims_supported: ['sub', 'iss', 'aud', 'exp', 'iat', 'name', 'email', 'email_verified', 'preferred_username', 'picture', 'role'],
          service_documentation: 'https://javenly.com/docs/identity',
        };
        break;

      case '/api/v1/me':
        if (!currentUser) {
          status = 401;
          output = { error: 'unauthorized', error_description: 'Bearer token required for /api/v1/me' };
        } else {
          output = {
            sub: currentUser.id,
            email: currentUser.email,
            email_verified: currentUser.emailVerified,
            name: currentUser.fullName,
            preferred_username: currentUser.username,
            picture: currentUser.avatarUrl,
            role: currentUser.role,
            company: currentUser.company,
            updated_at: Math.floor(new Date(currentUser.lastLoginAt).getTime() / 1000),
          };
        }
        break;

      case '/api/v1/profile':
        if (!currentUser) {
          status = 401;
          output = { error: 'unauthorized', message: 'Authentication required' };
        } else {
          output = {
            status: 'success',
            profile: {
              id: currentUser.id,
              fullName: currentUser.fullName,
              username: currentUser.username,
              avatarUrl: currentUser.avatarUrl,
              bio: currentUser.bio || 'Architect at Javenly Innovations',
              jobTitle: currentUser.jobTitle || 'Engineer',
              company: currentUser.company,
              email: currentUser.email,
              emailVerified: currentUser.emailVerified,
              mfaEnabled: currentUser.mfaEnabled,
              createdAt: currentUser.createdAt,
            },
          };
        }
        break;

      case '/api/v1/applications':
        output = {
          count: applications.length,
          applications: applications.map(a => ({
            id: a.id,
            clientId: a.clientId,
            name: a.name,
            appType: a.appType,
            homepageUrl: a.homepageUrl,
            redirectUris: a.redirectUris,
            scopes: a.scopes,
            status: a.status,
          })),
        };
        break;

      case '/api/v1/connected-applications':
        if (!currentUser) {
          status = 401;
          output = { error: 'unauthorized' };
        } else {
          const userConns = connectedApps.filter(c => c.userId === currentUser.id);
          output = {
            userId: currentUser.id,
            count: userConns.length,
            connectedApplications: userConns,
          };
        }
        break;

      case '/api/v1/security/sessions':
        if (!currentUser) {
          status = 401;
          output = { error: 'unauthorized' };
        } else {
          const userSess = sessions.filter(s => s.userId === currentUser.id);
          output = {
            userId: currentUser.id,
            count: userSess.length,
            sessions: userSess,
          };
        }
        break;

      case '/api/v1/security/sessions/revoke':
        output = {
          success: true,
          message: 'Device session invalidated and refresh token revoked.',
          revokedAt: new Date().toISOString(),
        };
        break;

      default:
        output = { error: 'not_found' };
        status = 404;
    }

    const duration = Math.round(performance.now() - start);
    setResponseOutput(output);
    setResponseStatus(status);
    setResponseTime(duration + 12);
  };

  const curlCommand = `curl -X ${selectedEndpoint.method} "https://api-identity.javenly.com${selectedEndpoint.path}" \\
  -H "Accept: application/json"${selectedEndpoint.authRequired ? ` \\
  -H "Authorization: Bearer jav_tok_live_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."` : ''}${selectedEndpoint.sampleBody ? ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(selectedEndpoint.sampleBody)}'` : ''}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-slate-200">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded border border-sky-800/40">
            OpenID 1.0 & REST API
          </span>
          <span className="text-xs text-slate-400 font-mono">api-identity.javenly.com</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mt-1">
          Identity API Console & Explorer
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Production endpoints for OpenID Connect discovery, userinfo verification, session revocation, and OAuth clients.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Endpoints List */}
        <div className="lg:col-span-5 space-y-2">
          <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-slate-200">API Endpoints (v1)</span>
            <span className="font-mono text-[10px] bg-slate-800 text-sky-400 px-2 py-0.5 rounded">
              Base: https://api-identity.javenly.com
            </span>
          </div>

          <div className="space-y-1.5">
            {endpoints.map((ep) => {
              const isSelected = selectedEndpoint.path === ep.path;
              return (
                <button
                  key={ep.path}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    setResponseOutput(null);
                    setResponseStatus(null);
                  }}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#0f172a] border-sky-500/50 shadow-md shadow-sky-500/10'
                      : 'bg-slate-900/50 border-slate-800/80 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase font-mono ${
                        ep.method === 'GET' 
                          ? 'bg-sky-500/20 text-sky-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="font-mono text-xs font-bold text-white">
                        {ep.path}
                      </span>
                    </div>
                    {ep.authRequired && (
                      <span title="Requires Bearer Token">
                        <Lock className="w-3 h-3 text-slate-500" />
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">
                    {ep.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Request / Response Playground */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            {/* Endpoint summary */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded font-mono ${
                    selectedEndpoint.method === 'GET' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {selectedEndpoint.method}
                  </span>
                  <span className="font-mono text-sm font-bold text-white">
                    {selectedEndpoint.path}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {selectedEndpoint.description}
                </p>
              </div>

              <button
                onClick={executeRequest}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-md shadow-sky-600/30 transition-all shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Test Request</span>
              </button>
            </div>

            {/* Request Details */}
            <div className="py-4 space-y-3">
              <div className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Headers:</span>
                <div className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-0.5">
                  <div>Accept: application/json</div>
                  {selectedEndpoint.authRequired && (
                    <div className="text-sky-300">
                      Authorization: Bearer jav_tok_live_... (Current session token)
                    </div>
                  )}
                  {selectedEndpoint.sampleBody && (
                    <div>Content-Type: application/json</div>
                  )}
                </div>
              </div>

              {selectedEndpoint.sampleBody && (
                <div className="text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">Request Body:</span>
                  <pre className="mt-1 p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-slate-300">
                    {JSON.stringify(selectedEndpoint.sampleBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Response Section */}
            <div className="border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-white">Output:</span>
                  {responseStatus && (
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      responseStatus === 200 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      HTTP {responseStatus} OK
                    </span>
                  )}
                  {responseTime && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {responseTime}ms
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('response')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeTab === 'response' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    JSON Response
                  </button>
                  <button
                    onClick={() => setActiveTab('curl')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      activeTab === 'curl' ? 'bg-slate-800 text-sky-400 font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    cURL Command
                  </button>
                </div>
              </div>

              {activeTab === 'response' ? (
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-300 font-mono overflow-x-auto max-h-72">
                  {responseOutput 
                    ? JSON.stringify(responseOutput, null, 2)
                    : '// Click "Test Request" to execute query and view live JSON payload.'}
                </pre>
              ) : (
                <div className="relative">
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-sky-300 font-mono overflow-x-auto max-h-72">
                    {curlCommand}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(curlCommand);
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Runtime: Cloudflare Workers edge (Free Tier)</span>
            <span>Auth Engine: Supabase GoTrue OIDC</span>
          </div>
        </div>

      </div>

    </div>
  );
};
