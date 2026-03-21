"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.endsWith("@chapman.edu")) {
      setStatus("error");
      setErrorMsg("Only @chapman.edu email addresses are allowed.");
      return;
    }

    setStatus("loading");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Sign in
        </h1>
        <p className="text-secondary text-sm mb-8">
          Use your Chapman University email to get started.
        </p>

        {status === "sent" ? (
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <CheckCircle size={32} className="mx-auto mb-3 text-primary" />
            <h2 className="text-lg font-bold mb-1">Check your email</h2>
            <p className="text-secondary text-sm">
              We sent a magic link to{" "}
              <span className="text-primary font-medium">{email}</span>. Click
              it to sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="email"
                placeholder="panther@chapman.edu"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                required
                className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-primary placeholder:text-muted focus:outline-none focus:border-primary/30 transition-colors"
              />
            </div>

            {status === "error" && errorMsg && (
              <div className="flex items-center gap-2 text-sm text-red-400">
                <AlertCircle size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-primary text-bg font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? (
                "Sending..."
              ) : (
                <>
                  Send Magic Link
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
