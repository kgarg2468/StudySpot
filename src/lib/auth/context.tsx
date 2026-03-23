"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types/database";

interface AuthContext {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContext>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      return null;
    }
    return createClient();
  }, []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const bootTimeout = window.setTimeout(() => {
      if (!cancelled) {
        setLoading(false);
      }
    }, 8000);

    async function bootstrapAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth bootstrap error:", error);
        }
        if (!cancelled) {
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error("Auth bootstrap exception:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    bootstrapAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(bootTimeout);
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !user) {
      setProfile(null);
      return;
    }

    let cancelled = false;

    async function loadProfile() {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (!data) {
          const { data: created } = await supabase
            .from("profiles")
            .upsert(
              {
                id: user.id,
                display_name: user.email?.split("@")[0] ?? "user",
              },
              { onConflict: "id" }
            )
            .select()
            .single();
          if (!cancelled) {
            setProfile(created);
          }
        } else if (!cancelled) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Profile load error:", error);
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [supabase, user]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
