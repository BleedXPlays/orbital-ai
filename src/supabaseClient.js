import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebase";

const supabaseUrl = "https://yffkeluziizwhwlvgtnh.supabase.co";

const supabaseAnonKey =
  "sb_publishable_u2Cdiho7oG1Ya8B8yfRSJA_jXvY_NY-";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    accessToken: async () => {
      return (await auth.currentUser?.getIdToken(false)) ?? null;
    },
  }
);
