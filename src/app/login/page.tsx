"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const authError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.endsWith("@chapman.edu")) {
      setStatus("error");
      setErrorMsg("Only @chapman.edu email addresses are allowed.");
      return;
    }

    setStatus("loading");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // #region agent log
    fetch('http://127.0.0.1:7525/ingest/d2bfbd53-e014-4d13-ac29-880e46dcbbc5',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c48fc5'},body:JSON.stringify({sessionId:'c48fc5',location:'login/page.tsx:signIn',message:'signIn response',data:{error:error?{message:error.message,status:error.status,name:error.name}:null,hasSession:!!data?.session,userId:data?.user?.id},timestamp:Date.now(),hypothesisId:'login'})}).catch(()=>{});
    // #endregion

    if (error) {
      setStatus("error");
      setErrorMsg(
        error.message === "Invalid login credentials"
          ? "Invalid email or password."
          : error.message === "Email not confirmed"
            ? "Please confirm your email before signing in. Check your inbox."
            : error.message
      );
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const clearError = () => {
    if (status === "error") setStatus("idle");
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">
          Sign in
        </h1>
        <p className="text-secondary text-sm mb-8">
          Use your Chapman University email to sign in.
        </p>

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
                clearError();
              }}
              required
              className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-primary placeholder:text-muted focus:outline-none focus:border-primary/30 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError();
              }}
              required
              className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-primary placeholder:text-muted focus:outline-none focus:border-primary/30 transition-colors"
            />
          </div>

          {(status === "error" || authError) && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle size={14} />
              <span>
                {errorMsg ||
                  (authError === "auth"
                    ? "Authentication failed. Please try again."
                    : "Something went wrong.")}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full bg-primary text-bg font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? (
              "Signing in..."
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <p className="text-secondary text-sm text-center mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-primary font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
