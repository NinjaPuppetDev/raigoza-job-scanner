import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS entirely.
// Only use this for server-only flows where there's no logged-in user
// to authenticate against, e.g. public candidate submissions scoped
// to a known applicationId. Never import this into anything reachable
// from the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}