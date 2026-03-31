#!/usr/bin/env node
/**
 * extract-cc.mjs
 * Extracts the Funding Command Center from the Ryland monorepo into a
 * standalone project that can be pushed to GitHub and imported by Lovable.
 *
 * Usage:  node scripts/extract-cc.mjs
 * Output: ../funding-command-center/  (sibling to Ryland folder)
 */

import { cpSync, mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = resolve(__dirname, "..");                    // Ryland root
const DST = resolve(__dirname, "../../funding-command-center"); // sibling folder

console.log(`\n🏗️  Extracting Command Center`);
console.log(`   Source: ${SRC}`);
console.log(`   Target: ${DST}\n`);

// ═══════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════

function copy(relPath) {
  const src = join(SRC, relPath);
  const dst = join(DST, relPath);
  if (!existsSync(src)) {
    console.log(`   ⚠️  SKIP (not found): ${relPath}`);
    return;
  }
  mkdirSync(dirname(dst), { recursive: true });
  const stat = statSync(src);
  if (stat.isDirectory()) {
    cpSync(src, dst, { recursive: true });
  } else {
    cpSync(src, dst);
  }
  console.log(`   ✅ ${relPath}`);
}

function copyModify(relPath, replacements) {
  const src = join(SRC, relPath);
  const dst = join(DST, relPath);
  if (!existsSync(src)) {
    console.log(`   ⚠️  SKIP (not found): ${relPath}`);
    return;
  }
  mkdirSync(dirname(dst), { recursive: true });
  let content = readFileSync(src, "utf-8");
  for (const [find, replace] of replacements) {
    content = content.replaceAll(find, replace);
  }
  writeFileSync(dst, content);
  console.log(`   ✏️  ${relPath} (modified)`);
}

function generate(relPath, content) {
  const dst = join(DST, relPath);
  mkdirSync(dirname(dst), { recursive: true });
  writeFileSync(dst, content);
  console.log(`   🆕 ${relPath} (generated)`);
}

function copyDir(relPath) {
  copy(relPath); // cpSync handles dirs recursively
}

// ═══════════════════════════════════════════════════════════
// Phase 1: COPY as-is
// ═══════════════════════════════════════════════════════════
console.log("📦 Phase 1: Copying files...\n");

// CC pages & components (entire directories)
copyDir("src/pages/command-center");
copyDir("src/components/command-center");

// Shared UI components
copyDir("src/components/ui");

// Shared standalone components
copy("src/components/NotificationBell.tsx");
copy("src/components/ScrollToTop.tsx");

// Supabase client
copy("src/integrations/supabase/client.ts");

// Lib
copy("src/lib/utils.ts");

// CSS
copy("src/index.css");

// Types
copy("src/types/command-center.ts");

// Utils
copy("src/utils/createCommandCenterNotification.ts");

// Edge functions
copyDir("supabase/functions/intake-webhook");

// Config files
copy("tailwind.config.ts");
copy("tsconfig.json");
copy("tsconfig.app.json");
copy("tsconfig.node.json");
copy("postcss.config.js");
copy("components.json");

// CC-specific hooks (copy as-is)
const ccHooks = [
  "useCommandCenterRole.ts",
  "useMetrics.ts",
  "useClient.ts",
  "useMyClients.ts",
  "useClientApplications.ts",
  "useBureauStatus.ts",
  "useClientDocuments.ts",
  "useClientActivity.ts",
  "useClientNotes.ts",
  "useMyTasks.ts",
  "usePipelineData.ts",
  "useClientAssignments.ts",
  "useFundingSequence.ts",
  "useInquiryQueue.ts",
  "useBanksAdmin.ts",
];

for (const hook of ccHooks) {
  copy(`src/hooks/${hook}`);
}

// Shared hooks
copy("src/hooks/use-toast.ts");
copy("src/hooks/use-mobile.tsx");

// ═══════════════════════════════════════════════════════════
// Phase 2: COPY + MODIFY
// ═══════════════════════════════════════════════════════════
console.log("\n✏️  Phase 2: Copying + modifying files...\n");

// CommandCenterSidebar — route paths + sign-out redirect
copyModify("src/components/command-center/CommandCenterSidebar.tsx", [
  ['path: "/command-center/my-clients"', 'path: "/my-clients"'],
  ['path: "/command-center/metrics"', 'path: "/metrics"'],
  ['path: "/command-center/bank-admin"', 'path: "/bank-admin"'],
  ['path: "/command-center/inquiry-queue"', 'path: "/inquiry-queue"'],
  ['path: "/command-center"', 'path: "/"'],
  ["'/portal/login'", "'/login'"],
  ['location.pathname === "/command-center"', 'location.pathname === "/"'],
  ['location.pathname === "/command-center/"', 'location.pathname === "/"'],
  ['item.path === "/command-center"', 'item.path === "/"'],
  ['end={item.path === "/command-center"}', 'end={item.path === "/"}'],
  // Dynamic localStorage key detection instead of hardcoded
  ["localStorage.removeItem('sb-gkowxzoadsljkpdzrlue-auth-token')",
   "const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token')); if (storageKey) localStorage.removeItem(storageKey)"],
]);

// CommandCenterGuard — login redirect
copyModify("src/components/command-center/CommandCenterGuard.tsx", [
  ['"/portal/login"', '"/login"'],
  ['/portal/login', '/login'],
]);

// CommandCenterLayout — ContentLoader import rename
copyModify("src/components/command-center/CommandCenterLayout.tsx", [
  ['import PortalContentLoader from "@/components/portal/PortalContentLoader"',
   'import ContentLoader from "@/components/ContentLoader"'],
  ['<PortalContentLoader />', '<ContentLoader />'],
]);

// formatters.ts — remove stageColors dependency
generate("src/utils/formatters.ts", `import { format } from "date-fns";

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null || amount === 0) return "\\u2014";
  return \`\$\${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}\`;
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "\\u2014";
  try {
    return format(new Date(dateStr), "MMM d, yyyy");
  } catch {
    return "\\u2014";
  }
}

export function formatDateTimeWithTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "\\u2014";
  try {
    return format(new Date(dateStr), "MMM d, yyyy h:mm a");
  } catch {
    return "\\u2014";
  }
}
`);

// ═══════════════════════════════════════════════════════════
// Phase 3: GENERATE new files
// ═══════════════════════════════════════════════════════════
console.log("\n🆕 Phase 3: Generating new files...\n");

// ── main.tsx ──
generate("src/main.tsx", `import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
`);

// ── vite-env.d.ts ──
generate("src/vite-env.d.ts", `/// <reference types="vite/client" />
`);

// ── App.tsx ──
generate("src/App.tsx", `import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ScrollToTop from "@/components/ScrollToTop";

const Login = lazy(() => import("@/pages/Login"));
const CommandCenterLayout = lazy(() => import("@/components/command-center/CommandCenterLayout"));
const PipelineDashboard = lazy(() => import("@/pages/command-center/PipelineDashboard"));
const ClientDetailView = lazy(() => import("@/pages/command-center/ClientDetailView"));
const QuickInfoCard = lazy(() => import("@/pages/command-center/QuickInfoCard"));
const MyClients = lazy(() => import("@/pages/command-center/MyClients"));
const MetricsDashboard = lazy(() => import("@/pages/command-center/MetricsDashboard"));
const BankAdmin = lazy(() => import("@/pages/command-center/BankAdmin"));
const InquiryQueue = lazy(() => import("@/pages/command-center/InquiryQueue"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster position="top-right" richColors closeButton />
          <BrowserRouter>
            <ScrollToTop />
            <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<CommandCenterLayout />}>
                  <Route index element={<PipelineDashboard />} />
                  <Route path="clients/:id" element={<ClientDetailView />} />
                  <Route path="clients/:id/quick-info" element={<QuickInfoCard />} />
                  <Route path="my-clients" element={<MyClients />} />
                  <Route path="metrics" element={<MetricsDashboard />} />
                  <Route path="bank-admin" element={<BankAdmin />} />
                  <Route path="inquiry-queue" element={<InquiryQueue />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
`);

// ── useAuth.tsx (stripped of affiliate logic) ──
generate("src/hooks/useAuth.tsx", `import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const storageKey = Object.keys(localStorage).find(key =>
        key.startsWith('sb-') && key.endsWith('-auth-token')
      );
      if (storageKey) {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.user && parsed?.access_token) {
            return {
              user: parsed.user as User,
              session: parsed as unknown as Session,
              loading: true,
            };
          }
        }
      }
    } catch {
      // ignore
    }
    return { user: null, session: null, loading: true };
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;

        if (session?.user) {
          initializedRef.current = true;
          setState({ user: session.user, session, loading: false });
          return;
        }
      } catch {
        if (cancelled) return;
      }

      // Fallback: restore session from localStorage
      if (!cancelled && !initializedRef.current && state.user) {
        try {
          const storageKey = Object.keys(localStorage).find(key =>
            key.startsWith('sb-') && key.endsWith('-auth-token')
          );
          if (storageKey) {
            const stored = localStorage.getItem(storageKey);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed?.access_token && parsed?.refresh_token) {
                const { data } = await supabase.auth.setSession({
                  access_token: parsed.access_token,
                  refresh_token: parsed.refresh_token,
                });
                if (!cancelled && data?.session?.user) {
                  initializedRef.current = true;
                  setState({ user: data.session!.user, session: data.session, loading: false });
                  return;
                }
              }
            }
          }
        } catch {
          if (cancelled) return;
        }
      }

      if (!cancelled && !initializedRef.current) {
        initializedRef.current = true;
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (cancelled || event === 'INITIAL_SESSION') return;
        const user = session?.user ?? null;
        setState({ user, session, loading: false });
      }
    );

    return () => { cancelled = true; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    try {
      const storageKey = Object.keys(localStorage).find(key =>
        key.startsWith('sb-') && key.endsWith('-auth-token')
      );
      if (storageKey) localStorage.removeItem(storageKey);
    } catch { /* ignore */ }

    setState({ user: null, session: null, loading: false });
    window.location.href = '/login';
    supabase.auth.signOut().catch(() => {});
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
`);

// ── Login.tsx ──
generate("src/pages/Login.tsx", `import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      toast.error(error.message || "Invalid email or password");
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <Card className="w-full max-w-md border-slate-800 bg-slate-900 shadow-2xl">
        <CardHeader className="text-center space-y-3 pb-2">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
            CC
          </div>
          <CardTitle className="text-2xl font-bold text-white">
            Funding Command Center
          </CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to access the Command Center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white" disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Signing in…</> : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
`);

// ── ContentLoader.tsx (renamed PortalContentLoader) ──
generate("src/components/ContentLoader.tsx", `import { Skeleton } from "@/components/ui/skeleton";

export default function ContentLoader() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-slate-200" />
        <Skeleton className="h-4 w-72 bg-slate-200" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 space-y-3">
            <Skeleton className="h-4 w-24 bg-slate-200" />
            <Skeleton className="h-8 w-32 bg-slate-200" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <Skeleton className="h-6 w-40 bg-slate-200" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full max-w-md bg-slate-200" />
                <Skeleton className="h-3 w-full max-w-sm bg-slate-200" />
              </div>
              <Skeleton className="h-6 w-20 bg-slate-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

// ── Supabase types placeholder ──
generate("src/integrations/supabase/types.ts", `// Placeholder — regenerate from your new Supabase project:
// npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
`);

// ── package.json ──
generate("package.json", JSON.stringify({
  name: "funding-command-center",
  private: true,
  version: "0.0.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "vite build",
    "build:dev": "vite build --mode development",
    lint: "eslint .",
    preview: "vite preview",
  },
  dependencies: {
    "@hookform/resolvers": "^3.10.0",
    "@radix-ui/react-accordion": "^1.2.11",
    "@radix-ui/react-alert-dialog": "^1.1.14",
    "@radix-ui/react-aspect-ratio": "^1.1.7",
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.2",
    "@radix-ui/react-collapsible": "^1.1.11",
    "@radix-ui/react-context-menu": "^2.2.15",
    "@radix-ui/react-dialog": "^1.1.14",
    "@radix-ui/react-dropdown-menu": "^2.1.15",
    "@radix-ui/react-hover-card": "^1.1.14",
    "@radix-ui/react-label": "^2.1.7",
    "@radix-ui/react-menubar": "^1.1.15",
    "@radix-ui/react-navigation-menu": "^1.2.13",
    "@radix-ui/react-popover": "^1.1.14",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-radio-group": "^1.3.7",
    "@radix-ui/react-scroll-area": "^1.2.9",
    "@radix-ui/react-select": "^2.2.5",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-slider": "^1.3.5",
    "@radix-ui/react-slot": "^1.2.3",
    "@radix-ui/react-switch": "^1.2.5",
    "@radix-ui/react-tabs": "^1.1.12",
    "@radix-ui/react-toast": "^1.2.14",
    "@radix-ui/react-toggle": "^1.1.9",
    "@radix-ui/react-toggle-group": "^1.1.10",
    "@radix-ui/react-tooltip": "^1.2.7",
    "@supabase/supabase-js": "^2.95.3",
    "@tanstack/react-query": "^5.83.0",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "^1.1.1",
    "date-fns": "^3.6.0",
    "embla-carousel-react": "^8.6.0",
    "framer-motion": "^12.34.0",
    "input-otp": "^1.4.2",
    "lucide-react": "^0.462.0",
    "next-themes": "^0.3.0",
    "react": "^18.3.1",
    "react-day-picker": "^8.10.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.61.1",
    "react-resizable-panels": "^2.1.9",
    "react-router-dom": "^6.30.1",
    "recharts": "^2.15.4",
    "sonner": "^1.7.4",
    "tailwind-merge": "^2.6.0",
    "tailwindcss-animate": "^1.0.7",
    "vaul": "^0.9.9",
    "zod": "^3.25.76",
  },
  devDependencies: {
    "@eslint/js": "^9.32.0",
    "@tailwindcss/typography": "^0.5.16",
    "@types/node": "^22.16.5",
    "@types/react": "^18.3.23",
    "@types/react-dom": "^18.3.7",
    "@vitejs/plugin-react-swc": "^3.11.0",
    "autoprefixer": "^10.4.21",
    "eslint": "^9.32.0",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "globals": "^15.15.0",
    "lovable-tagger": "^1.1.13",
    "postcss": "^8.5.6",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.8.3",
    "typescript-eslint": "^8.38.0",
    "vite": "^5.4.19",
  },
}, null, 2) + "\n");

// ── vite.config.ts ──
generate("vite.config.ts", `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          ui: ["framer-motion", "@tanstack/react-query"],
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
}));
`);

// ── index.html ──
generate("index.html", `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
    <title>Funding Command Center</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

// ── .env.example ──
generate(".env.example", `VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOi...your-anon-key
`);

// ── .gitignore ──
generate(".gitignore", `node_modules
dist
.env
.env.local
*.local
.DS_Store
`);

// ═══════════════════════════════════════════════════════════
// Done
// ═══════════════════════════════════════════════════════════
console.log("\n✅ Extraction complete!\n");
console.log("Next steps:");
console.log("  1. Create the consolidated migration (copy from command-center/ PRD docs)");
console.log("  2. cd ../funding-command-center && npm install");
console.log("  3. Create .env with your new Supabase credentials");
console.log("  4. npm run dev — verify everything works");
console.log("  5. git init && git add . && git commit && push to GitHub");
console.log("  6. Import into Lovable from GitHub\n");
