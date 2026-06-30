"use client";

import React, { useState, useEffect } from "react";
import { X, Mail, Lock, ShieldCheck, RefreshCw, Github } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuthStore } from "@/store/authStore";

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthOverlay({ isOpen, onClose, onSuccess }: AuthOverlayProps) {
  const { login, register } = useAuthStore();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Listen to postMessages for OAuth popup events
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.data?.type === "oauth-success") {
        setLoading(true);
        setFeedback(null);
        
        const oauthEmail = event.data.email;
        // OAuth uses a standard secure mock password derived uniquely per email
        const oauthPassword = `verra-oauth-secure-pass-${oauthEmail}`;
        
        // 1. Attempt to register the OAuth user (in case it is their first time)
        await register(oauthEmail, oauthPassword);
        
        // 2. Log in
        const res = await login(oauthEmail, oauthPassword, true);
        setLoading(false);
        
        if (res.success) {
          setFeedback({ success: true, message: "OAuth Authentication successful." });
          setTimeout(() => {
            onClose();
            onSuccess?.();
          }, 600);
        } else {
          setFeedback({ success: false, message: res.message });
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [login, register, onClose, onSuccess]);

  const handleSimulatedOAuth = (provider: "google" | "github") => {
    const width = 500;
    const height = 550;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      "",
      `verra-${provider}-oauth`,
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no`
    );

    if (popup) {
      popup.document.write(`
        <html>
          <head>
            <title>Authorize Verra via ${provider === "google" ? "Google" : "GitHub"}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Outfit', sans-serif; background-color: #09090b; color: #f8fafc; }
            </style>
          </head>
          <body class="flex flex-col items-center justify-center min-h-screen p-6 text-center">
            <div class="max-w-sm w-full bg-zinc-950 border border-zinc-900 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6">
              <div class="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                ${provider === "google" 
                  ? '<svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.833 0-8.75-3.766-8.75-8.514s3.917-8.514 8.75-8.514c2.195 0 4.103.811 5.568 2.235l3.207-3.207C18.665.922 15.688 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c7.056 0 12.48-4.954 12.48-12.24 0-.823-.075-1.425-.24-1.954H12.24z"/></svg>' 
                  : '<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>'
                }
              </div>
              <h1 class="text-xl font-bold text-white">Connect Verra to ${provider === "google" ? "Google" : "GitHub"}</h1>
              <p class="text-xs text-zinc-400">Log in to link your drafts securely across devices.</p>
              
              <div class="w-full bg-zinc-900 border border-zinc-800/60 p-4 rounded-xl text-left">
                <label class="block text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-1">Account Profile</label>
                <span class="text-sm font-medium text-zinc-200">demo-user@verra.ai</span>
              </div>
              
              <button onclick="window.opener.postMessage({ type: 'oauth-success', provider: '${provider}', email: 'demo-user@verra.ai' }, '*'); window.close();" 
                      class="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold py-3 px-5 rounded-xl transition cursor-pointer">
                Authorize Verra
              </button>
              <button onclick="window.close();" class="text-zinc-550 hover:text-zinc-400 text-[10px] uppercase tracking-wider font-semibold cursor-pointer">
                Cancel
              </button>
            </div>
          </body>
        </html>
      `);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setFeedback({ success: false, message: "Please fill in all credentials." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    if (isSignUp) {
      const res = await register(email, password);
      setLoading(false);
      if (res.success) {
        setFeedback({ success: true, message: res.message });
        setIsSignUp(false);
      } else {
        setFeedback({ success: false, message: res.message });
      }
    } else {
      const res = await login(email, password, rememberMe);
      setLoading(false);
      if (res.success) {
        setFeedback({ success: true, message: "Successfully logged in." });
        setTimeout(() => {
          onClose();
          onSuccess?.();
        }, 600);
      } else {
        setFeedback({ success: false, message: res.message });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#09090b]/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="w-full max-w-md overflow-hidden border border-zinc-800 bg-zinc-950 rounded-2xl shadow-2xl glass-panel relative p-6 md:p-8 flex flex-col gap-6"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-900 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-bold tracking-tight text-white font-serif">
            {isSignUp ? "Create your workspace" : "Welcome back to Verra"}
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed font-sans">
            {isSignUp
              ? "Register an account to sync your drafts and preferences securely."
              : "Sign in to access your isolated drafts, settings, and history."}
          </p>
        </div>

        {/* OAuth Buttons */}
        <div className="grid grid-cols-2 gap-3 font-sans">
          <button
            onClick={() => handleSimulatedOAuth("google")}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-800 hover:bg-zinc-900/50 text-xs font-semibold text-zinc-300 transition cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.833 0-8.75-3.766-8.75-8.514s3.917-8.514 8.75-8.514c2.195 0 4.103.811 5.568 2.235l3.207-3.207C18.665.922 15.688 0 12.24 0 5.48 0 0 5.48 0 12.24s5.48 12.24 12.24 12.24c7.056 0 12.48-4.954 12.48-12.24 0-.823-.075-1.425-.24-1.954H12.24z"/>
            </svg>
            Google
          </button>
          <button
            onClick={() => handleSimulatedOAuth("github")}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-zinc-800 hover:bg-zinc-900/50 text-xs font-semibold text-zinc-300 transition cursor-pointer"
          >
            <Github className="w-3.5 h-3.5" />
            GitHub
          </button>
        </div>

        <div className="relative flex items-center justify-center font-sans">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-900"></span>
          </div>
          <span className="relative bg-zinc-950 px-3 text-[10px] text-zinc-550 uppercase tracking-widest font-semibold">
            or use credentials
          </span>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-purple-800/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-200 outline-none focus:border-purple-800/40"
              />
            </div>
          </div>

          {!isSignUp && (
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-zinc-800 bg-zinc-900 text-purple-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                />
                Remember Me
              </label>
            </div>
          )}

          {/* Feedback messages */}
          <AnimatePresence mode="wait">
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`text-xs p-3 rounded-lg border leading-relaxed ${
                  feedback.success
                    ? "bg-emerald-950/20 border-emerald-800/40 text-emerald-400"
                    : "bg-rose-950/20 border-rose-800/40 text-rose-400"
                }`}
              >
                {feedback.message}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-900 hover:bg-purple-955 text-purple-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-purple-800/25 cursor-pointer transition disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : isSignUp ? (
              "Sign Up"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Form Toggle */}
        <div className="text-center text-xs text-zinc-450 font-sans">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setFeedback(null);
            }}
            className="text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline underline-offset-4"
          >
            {isSignUp ? "Sign In" : "Create Account"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
