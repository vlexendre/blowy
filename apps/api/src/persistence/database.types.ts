/**
 * Types de la base, alignés sur supabase/migrations. Ils typent le client Supabase :
 * une colonne ou une table mal nommée dans un dépôt devient une erreur de compilation.
 * À régénérer après chaque migration (`supabase gen types typescript`), ou à compléter à la main.
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Omit<Row, Optional> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          display_name: string;
          birthdate: string;
          city: string | null;
          avatar_path: string | null;
          invite_code: string;
          words_code: string;
          plus_until: string | null;
          welcome_sent_at: string | null;
          created_at: string;
        },
        'city' | 'avatar_path' | 'plus_until' | 'welcome_sent_at' | 'created_at'
      >;
      pets: Table<
        {
          id: string;
          owner_id: string;
          name: string;
          species: string;
          social: number;
          play: number;
          tender: number;
          talk: number;
          decayed_on: string;
          hunger: number;
          energy: number;
          mood: number;
          needs_at: string;
          care_days: number;
          last_care_on: string | null;
          best_streak: number;
          outfit: Json;
          created_at: string;
        },
        | 'id'
        | 'social'
        | 'play'
        | 'tender'
        | 'talk'
        | 'decayed_on'
        | 'hunger'
        | 'energy'
        | 'mood'
        | 'needs_at'
        | 'care_days'
        | 'last_care_on'
        | 'best_streak'
        | 'outfit'
        | 'created_at'
      >;
      pet_items: Table<{ pet_id: string; item_id: string; source: string; acquired_at: string }, 'acquired_at'>;
      pet_events: Table<{ id: number; pet_id: string; kind: string; delta: Json; created_at: string }, 'id' | 'delta' | 'created_at'>;
      links: Table<
        {
          id: string;
          user_a: string;
          user_b: string;
          status: string;
          lives: number;
          xp: number;
          level: number;
          streak: number;
          last_active_on: string;
          last_tick_on: string;
          last_duo_photo_on: string | null;
          revived: boolean;
          message_xp_on: string | null;
          message_xp: number;
          last_message_at: string;
          created_at: string;
        },
        'id' | 'status' | 'lives' | 'xp' | 'level' | 'streak' | 'last_duo_photo_on' | 'revived' | 'message_xp_on' | 'message_xp' | 'last_message_at' | 'created_at'
      >;
      messages: Table<
        {
          id: string;
          link_id: string;
          author_kind: string;
          author_id: string | null;
          kind: string;
          body: string | null;
          media_path: string | null;
          created_at: string;
        },
        'id' | 'author_id' | 'body' | 'media_path' | 'created_at'
      >;
      link_reads: Table<{ link_id: string; user_id: string; last_read_at: string }, 'last_read_at'>;
      daily_photos: Table<
        { id: string; link_id: string; user_id: string; day: string; media_path: string; created_at: string },
        'id' | 'created_at'
      >;
      encounters: Table<
        { id: string; from_user: string; to_user: string; status: string; intro: string | null; created_at: string },
        'id' | 'status' | 'intro' | 'created_at'
      >;
      word_votes: Table<{ id: number; target_user: string; words: string[]; voter_hash: string; created_at: string }, 'id' | 'created_at'>;
      blocks: Table<{ blocker: string; blocked: string; created_at: string }, 'created_at'>;
      reports: Table<
        {
          id: number;
          reporter: string | null;
          target_user: string | null;
          link_id: string | null;
          reason: string;
          details: string | null;
          created_at: string;
        },
        'id' | 'reporter' | 'target_user' | 'link_id' | 'details' | 'created_at'
      >;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Db = import('@supabase/supabase-js').SupabaseClient<Database>;
