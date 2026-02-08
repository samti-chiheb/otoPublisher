// Minimal placeholder types; extend with your DB schema if needed.
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          display_name: string | null;
          business_name: string | null;
          timezone: string | null;
          notify_on_fail: boolean | null;
          role: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          display_name?: string | null;
          business_name?: string | null;
          timezone?: string | null;
          notify_on_fail?: boolean | null;
          role?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          username?: string | null;
          display_name?: string | null;
          business_name?: string | null;
          timezone?: string | null;
          notify_on_fail?: boolean | null;
          role?: string | null;
          avatar_url?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
