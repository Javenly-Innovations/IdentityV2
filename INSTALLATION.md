# Local Installation Guide — Javenly Identity

This guide explains how to set up and develop Javenly Identity locally on **Windows 11** (or macOS/Linux) using VS Code, Node.js LTS, and Git.

---

## 1. Prerequisites

1. **Node.js LTS** (v20.x or v22.x): [Download Node.js](https://nodejs.org/)
2. **Git**: [Download Git](https://git-scm.com/)
3. **VS Code**: [Download VS Code](https://code.visualstudio.com/)
4. A free **Supabase Account**: [https://supabase.com](https://supabase.com) (No credit card required).

---

## 2. Cloning and Setup

1. Open your terminal (PowerShell, Command Prompt, or Git Bash):
   ```bash
   git clone https://github.com/javenly-innovations/javenly-identity.git
   cd javenly-identity
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

---

## 3. Configuring Supabase (Free Tier)

1. Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard).
2. Click **New project** (e.g., Name: `javenly-identity`, Region: Choose your closest region).
3. Under **Authentication** → **URL Configuration**:
   - Set **Site URL**: `http://localhost:3000` (or `https://identity.javenly.com` in production)
   - Add **Redirect URLs**:
     - `http://localhost:3000/*`
     - `https://javenly.com/wp-json/javenly/v1/callback`
     - `https://crm.javenly.com/auth/callback`
4. Go to **Settings** (gear icon) → **API**:
   - Copy **Project URL**
   - Copy **anon public** key
5. Paste these into your `.env` file:
   ```env
   VITE_SUPABASE_URL="https://your-project-id.supabase.co"
   VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
   ```

---

## 4. Running the Development Server

Start the local development server:
```bash
npm run dev
```

Open your browser to:
```
http://localhost:3000
```

The application runs with a full live interactive simulator for all subdomains (`identity.javenly.com`, `account.javenly.com`, `admin-identity.javenly.com`, `api-identity.javenly.com`, and `sandbox.javenly.com`).
