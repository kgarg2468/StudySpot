import { createBrowserClient } from "@supabase/ssr";

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // During SSR/build without env vars, return a dummy that won't be used
    // Client components will re-render in the browser with real values
    return createBrowserClient(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  client = createBrowserClient(url, key);
  return client;
}
