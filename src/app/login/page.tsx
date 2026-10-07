"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  GitBranch,
  UserCheck,
  Loader2,
} from "lucide-react";

interface PersonaOption {
  role: string;
  name: string;
  email: string;
  title: string;
  icon: string;
  badgeColor: string;
  avatar: string;
}

const DEMO_PERSONAS: PersonaOption[] = [
  {
    role: "SUPER_ADMIN",
    name: "Platform Owner",
    email: "superadmin@digisail.com",
    title: "Global SaaS Super Admin",
    icon: "👑",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
  },
  {
    role: "COMPANY_ADMIN",
    name: "Sarah Jenkins",
    email: "sarah.jenkins@digisail.com",
    title: "Company HR Director",
    icon: "🏢",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  },
  {
    role: "BRANCH_ADMIN",
    name: "Michael Scott",
    email: "michael.scott@digisail.com",
    title: "Branch HR (HQ-NYC)",
    icon: "📍",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
  },
  {
    role: "DEPARTMENT_ADMIN",
    name: "Alexander Chen",
    email: "alex.chen@digisail.com",
    title: "Head of Engineering",
    icon: "📁",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  },
  {
    role: "TEAM_LEAD",
    name: "David Miller",
    email: "david.miller@digisail.com",
    title: "Cloud Systems Lead",
    icon: "👤",
    badgeColor: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  },
  {
    role: "EMPLOYEE",
    name: "Priya Patel",
    email: "priya.patel@digisail.com",
    title: "Senior Software Engineer",
    icon: "👥",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  },
];

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("alex.chen@digisail.com");
  const [password, setPassword] = useState("demo123");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPersonaRole, setSelectedPersonaRole] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle standard credential submit
  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccessMessage(`Welcome back, ${data.data?.user?.name || "User"}! Redirecting...`);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 700);
    } catch (err) {
      setErrorMessage("Network error connecting to authentication server.");
      setIsLoading(false);
    }
  };

  // Handle one-click demo persona login
  const handleFastPersonaLogin = async (persona: PersonaOption) => {
    setSelectedPersonaRole(persona.role);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);
    setEmail(persona.email);
    setPassword("demo123");

    try {
      const res = await fetch("/api/auth/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: persona.role, email: persona.email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Failed to establish persona session.");
        setIsLoading(false);
        setSelectedPersonaRole(null);
        return;
      }

      setSuccessMessage(`Logged in as ${persona.name} (${persona.title})!`);
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 600);
    } catch (err) {
      setErrorMessage("Could not connect to persona session handler.");
      setIsLoading(false);
      setSelectedPersonaRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Ambience & Radial Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch z-10">
        
        {/* Left Column: Brand Hero & Platform Overview */}
        <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/80 rounded-3xl border border-slate-800/80 p-8 flex flex-col justify-between backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-indigo-500/25">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-2xl tracking-tight text-white">DigiSail</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    HRM
                  </span>
                </div>
                <p className="text-xs text-slate-400">Enterprise Workforce Cloud</p>
              </div>
            </div>

            {/* Headline */}
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-indigo-950 text-indigo-400 border border-indigo-800/60 mb-3">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Multi-Tenant Architecture v2.4
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug">
                Unified Workforce Intelligence & Multi-Tier Approvals
              </h1>
              <p className="text-sm text-slate-400 mt-2.5 leading-relaxed">
                Seamless role orchestration connecting Platform Super Admins, Branch HR, Department Heads, and Teams in real time.
              </p>
            </div>

            {/* Feature Bullets */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800/60">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                  <GitBranch className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">2-Stage Candidate Onboarding</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Stage 1 Dept Review ➔ Stage 2 Branch HR Final Activation.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800/60">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Multi-Tenant Data Isolation</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Strict company partitioning with Neon Serverless PostgreSQL.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-800/60">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Automated Provisioning</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Instant login credentials and annual leave quotas upon approval.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Certifications */}
          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              256-Bit HS256 JWT
            </span>
            <span>•</span>
            <span>Neon Cloud PostgreSQL</span>
            <span>•</span>
            <span>ISO-Audit Ready</span>
          </div>
        </div>

        {/* Right Column: Authentication Card */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-3xl border border-slate-800 p-8 sm:p-10 flex flex-col justify-between backdrop-blur-xl shadow-2xl">
          <div>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Sign in to your account
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your company credentials or choose a quick demo persona below.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-950/40 border border-red-800/60 flex items-center gap-3 text-red-200 text-xs animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-center gap-3 text-emerald-200 text-xs animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Credential Form */}
            <form onSubmit={handleCredentialLogin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail("alex.chen@digisail.com");
                      setPassword("demo123");
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Use default test password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Help */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-800 border-slate-700 text-indigo-600 focus:ring-indigo-500/30"
                  />
                  <span>Keep me signed in for 7 days</span>
                </label>
                <span className="text-slate-400 font-mono text-[11px]">Default: demo123</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
              >
                {isLoading && !selectedPersonaRole ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="bg-slate-900 px-3 text-slate-400 font-bold">
                  Or Test with Demo Personas
                </span>
              </div>
            </div>

            {/* Quick Demo Persona Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DEMO_PERSONAS.map((p) => {
                const isSelected = selectedPersonaRole === p.role;
                return (
                  <button
                    key={p.role}
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleFastPersonaLogin(p)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between group cursor-pointer ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                        : "bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={p.avatar}
                        alt={p.name}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                      />
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-white block truncate leading-tight">
                          {p.name}
                        </span>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {p.title.split("(")[0]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-800/80">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold border ${p.badgeColor}`}>
                        {p.icon} {p.role.replace("_", " ").slice(0, 10)}
                      </span>
                      {isSelected ? (
                        <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                      ) : (
                        <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Note */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>© 2026 DigiSail Technologies Inc.</span>
            <span>Version 2.4 Enterprise</span>
          </div>
        </div>

      </div>
    </div>
  );
}
