import React from 'react';
import { useAuth } from '../lib/auth-context';
import { Subdomain } from '../types';
import { Globe, Lock, ShieldCheck, ArrowRight, Server, AlertTriangle } from 'lucide-react';

export const SubdomainBanner: React.FC = () => {
  const { currentSubdomain, setCurrentSubdomain } = useAuth();

  const getSubdomainDetails = (sub: Subdomain) => {
    switch (sub) {
      case 'identity.javenly.com':
        return {
          title: 'Central Authentication Gateway',
          path: '/v1/auth/authorize',
          dns: 'CNAME identity.javenly.com → javenly-identity.pages.dev',
          desc: 'Primary OAuth 2.1 & OpenID Connect PKCE gateway for all Javenly products.',
          status: 'Online (Cloudflare Pages)',
        };
      case 'account.javenly.com':
        return {
          title: 'User Self-Service Account Portal',
          path: '/settings/security',
          dns: 'CNAME account.javenly.com → javenly-identity.pages.dev',
          desc: 'Profile, MFA, active sessions revocation, and privacy data export.',
          status: 'Online (Protected)',
        };
      case 'admin-identity.javenly.com':
        return {
          title: 'Administrative Security Console',
          path: '/admin/overview',
          dns: 'CNAME admin-identity.javenly.com → javenly-identity.pages.dev',
          desc: 'User directory, OAuth client applications registry, and live audit telemetry.',
          status: 'Restricted (Admins Only)',
        };
      case 'api-identity.javenly.com':
        return {
          title: 'Identity API & OpenID Discovery',
          path: '/.well-known/openid-configuration',
          dns: 'CNAME api-identity.javenly.com → javenly-identity.workers.dev',
          desc: 'Standardized OIDC discovery, JWKS keys, and REST API endpoints.',
          status: 'Online (Cloudflare Workers)',
        };
      case 'sandbox.javenly.com':
        return {
          title: 'Live Ecosystem SSO Simulator',
          path: '/test/wordpress-sso',
          dns: 'Namecheap WordPress javenly.com + Node.js CRM SSO client test runner',
          desc: 'Test real-world "Sign in with Javenly" flow without modifying production servers.',
          status: 'Interactive Sandbox',
        };
      case 'docs.javenly.com':
        return {
          title: 'Javenly Identity Connector & Docs',
          path: '/plugins/wordpress-connector',
          dns: 'WordPress Plugin source code, Node.js SDK, and deployment blueprints',
          desc: 'Downloadable WordPress plugin ZIP and comprehensive $0/mo architecture guides.',
          status: 'Documentation Portal',
        };
      default:
        return {
          title: 'Javenly Identity',
          path: '/',
          dns: 'Cloudflare Pages DNS',
          desc: 'Centralized authentication',
          status: 'Active',
        };
    }
  };

  const details = getSubdomainDetails(currentSubdomain);

  return (
    <div className="bg-[#0b101d] border-b border-slate-800/80 px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 text-xs font-mono text-slate-300">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400 font-sans">https://</span>
            <span className="text-white font-bold">{currentSubdomain}</span>
            <span className="text-sky-400">{details.path}</span>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            TLS 1.3 Strict
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-[11px] text-slate-300">DNS: {details.dns}</span>
          </div>
          <span className="text-slate-700">|</span>
          <span className="text-[11px] font-semibold text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/40">
            {details.status}
          </span>
        </div>
      </div>
    </div>
  );
};
