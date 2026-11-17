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
          gender: string;
          seeking: string;
          whom: string | null;
          locale: string;
          discreet: boolean;
          sensitive_consent_at: string | null;
          location_consent_at: string | null;
          avatar_path: string | null;
          invite_code: string;
          words_code: string;
          plus_until: string | null;
          welcome_sent_at: string | null;
          created_at: string;
          last_active_on: string;
          inactivity_noticed_on: string | null;
          chat_reading_default: string;
          ai_proofs_consent: boolean | null;
          ai_proofs_consent_at: string | null;
          /** Migration 20261115200000_audit : monde d'exemple du compte de revue d'Apple. */
          review_world: string | null;
          /** Migration 20261115200000_audit : photo de profil vérifiée par le filtre. */
          avatar_checked_at: string | null;
          /** Migration 20261117120000_groupes : « Montrer mes habitudes » (spéc §25). */
          show_habits: boolean;
        },
        | 'gender'
        | 'seeking'
        | 'whom'
        | 'locale'
        | 'discreet'
        | 'sensitive_consent_at'
        | 'location_consent_at'
        | 'avatar_path'
        | 'plus_until'
        | 'welcome_sent_at'
        | 'created_at'
        | 'last_active_on'
        | 'inactivity_noticed_on'
        | 'chat_reading_default'
        | 'ai_proofs_consent'
        | 'ai_proofs_consent_at'
        | 'review_world'
        | 'avatar_checked_at'
        | 'show_habits'
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
          sociability: number;
          care_days: number;
          last_care_on: string | null;
          best_streak: number;
          outfit: Json;
          renamed_at: string | null;
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
        | 'sociability'
        | 'care_days'
        | 'last_care_on'
        | 'best_streak'
        | 'outfit'
        | 'renamed_at'
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
          /** Série du lien : jours d'affilée où les deux se sont écrit (20261115190000). */
          best_streak: number;
          duo_days: number;
          last_active_on: string;
          last_tick_on: string;
          /** V6, plus écrite depuis 20261115190000 (remplacée par last_duo_day_on) ; à supprimer plus tard. */
          last_duo_photo_on: string | null;
          last_duo_day_on: string | null;
          recent_days: Json;
          milestones: Json;
          write_reminder_on: string | null;
          revived: boolean;
          message_xp_on: string | null;
          message_xp: number;
          last_message_at: string;
          created_at: string;
        },
        | 'id'
        | 'status'
        | 'lives'
        | 'xp'
        | 'level'
        | 'streak'
        | 'best_streak'
        | 'duo_days'
        | 'last_duo_photo_on'
        | 'last_duo_day_on'
        | 'recent_days'
        | 'milestones'
        | 'write_reminder_on'
        | 'revived'
        | 'message_xp_on'
        | 'message_xp'
        | 'last_message_at'
        | 'created_at'
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
          pet_role: string | null;
          visible_to: string | null;
        },
        'id' | 'author_id' | 'body' | 'media_path' | 'created_at' | 'pet_role' | 'visible_to'
      >;
      link_reads: Table<{ link_id: string; user_id: string; last_read_at: string }, 'last_read_at'>;
      /** Anciennes photos du jour (V6) : lecture seule depuis 20261115190000, gardées pour les souvenirs des liens. */
      daily_photos: Table<
        { id: string; link_id: string; user_id: string; day: string; media_path: string; created_at: string },
        'id' | 'created_at'
      >;
      encounters: Table<
        { id: string; from_user: string; to_user: string; status: string; intro: string | null; created_at: string; status_at: string },
        'id' | 'status' | 'intro' | 'created_at' | 'status_at'
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
          message_id: string | null;
          handled_at: string | null;
          handled_by: string | null;
          resolution: string | null;
          /** Migration 20261115200000_audit : person · filter (filtre automatique). */
          source: string;
          /** 0 normal · 1 haut · 2 urgent. */
          priority: number;
          category: string | null;
          /** Fait dans le monde d'exemple du compte de revue (ni alerte, ni statistique). */
          review: boolean;
          alerted_at: string | null;
          escalated_at: string | null;
          /** Migration 20261117120000_groupes : signalement dans un groupe (message, membre ou le groupe). */
          group_id: string | null;
          group_message_id: string | null;
        },
        | 'id'
        | 'reporter'
        | 'target_user'
        | 'link_id'
        | 'details'
        | 'created_at'
        | 'message_id'
        | 'handled_at'
        | 'handled_by'
        | 'resolution'
        | 'source'
        | 'priority'
        | 'category'
        | 'review'
        | 'alerted_at'
        | 'escalated_at'
        | 'group_id'
        | 'group_message_id'
      >;
      // ── Vision (migration 20261115130000_vision) ──
      profile_places: Table<
        {
          user_id: string;
          last_lat: number;
          last_lng: number;
          located_at: string;
          last_away_at: string | null;
          home_lat: number;
          home_lng: number;
          home_cell: string;
          candidate_lat: number | null;
          candidate_lng: number | null;
          candidate_since: string | null;
          city_label: string | null;
          city_lat: number | null;
          city_lng: number | null;
          /** Migration 20261115200000_audit : gps (relevé arrondi) · manual (zone choisie sans localisation). */
          source: string;
          manual_label: string | null;
          manual_set_on: string | null;
        },
        'last_away_at' | 'candidate_lat' | 'candidate_lng' | 'candidate_since' | 'city_label' | 'city_lat' | 'city_lng' | 'source' | 'manual_label' | 'manual_set_on'
      >;
      vision_signals: Table<{ id: number; user_id: string; axis: string; value: number; source: string; at: string }, 'id'>;
      vision_profiles: Table<{ user_id: string; axes: Json; test_done: boolean; computed_at: string }, 'test_done' | 'computed_at'>;
      match_cache: Table<{ user_id: string; day: string; center_key: string; entries: Json; computed_at: string }, 'computed_at'>;
      // ── Facturation et administration (migration 20261115160000_facturation_admin) ──
      subscriptions: Table<
        {
          store: string;
          original_transaction_id: string;
          user_id: string | null;
          product_id: string;
          /** `yearly`, `monthly` ou `weekly` (migration 20261117140000_hebdo_fidelisation). */
          plan: string;
          status: string;
          expires_at: string | null;
          grace_until: string | null;
          trial_ends_at: string | null;
          trial_used: boolean;
          auto_renew: boolean;
          revoked_at: string | null;
          latest_transaction_id: string;
          environment: string;
          started_at: string;
          updated_at: string;
          trial_reminder_for: string | null;
          created_at: string;
        },
        'user_id' | 'expires_at' | 'grace_until' | 'trial_ends_at' | 'trial_used' | 'auto_renew' | 'revoked_at' | 'environment' | 'trial_reminder_for' | 'created_at'
      >;
      store_notifications: Table<
        {
          store: string;
          notification_id: string;
          type: string;
          subtype: string | null;
          original_transaction_id: string | null;
          environment: string | null;
          signed_at: string;
          received_at: string;
          processed_at: string | null;
          outcome: string | null;
        },
        'subtype' | 'original_transaction_id' | 'environment' | 'received_at' | 'processed_at' | 'outcome'
      >;
      account_suspensions: Table<{ user_id: string; since: string; until: string | null; reason: string; by_email: string }, 'since' | 'until'>;
      admin_audit_log: Table<
        {
          id: number;
          at: string;
          admin_email: string;
          action: string;
          target_user_id: string | null;
          target_name: string | null;
          report_id: number | null;
          reason: string;
          until: string | null;
        },
        'id' | 'at' | 'target_user_id' | 'target_name' | 'report_id' | 'until'
      >;
      user_activity_days: Table<{ day: string; user_id: string }>;
      admin_daily_stats: Table<{ day: string; metrics: Json; computed_at: string }, 'computed_at'>;
      // ── Intégration (20261115170000_integration) ──
      banned_identities: Table<{ hash: string; banned_at: string; until: string }, 'banned_at'>;
      encounter_proposals: Table<{ day: string; user_id: string; proposed: number; score_sum: number }>;
      live_activity_tokens: Table<
        {
          token: string;
          user_id: string;
          use: string;
          activity: string | null;
          activity_id: string | null;
          link_id: string | null;
          ends_at: string | null;
          created_at: string;
          last_seen_at: string;
          disabled_at: string | null;
        },
        'activity' | 'activity_id' | 'link_id' | 'ends_at' | 'created_at' | 'last_seen_at' | 'disabled_at'
      >;
      // ── plateforme (20261115150000) ──
      ai_usage_daily: Table<
        {
          day: string;
          feature: string;
          tier: string;
          calls: number;
          declined: number;
          errors: number;
          input_tokens: number;
          output_tokens: number;
          cache_write_tokens: number;
          cache_read_tokens: number;
          cost_micros: number;
        },
        'calls' | 'declined' | 'errors' | 'input_tokens' | 'output_tokens' | 'cache_write_tokens' | 'cache_read_tokens' | 'cost_micros'
      >;
      ai_user_calls: Table<{ user_id: string; day: string; feature: string; calls: number }, 'calls'>;
      chat_link_settings: Table<
        { link_id: string; user_id: string; consent: boolean | null; consent_at: string | null; muted: boolean; by_default: boolean; updated_at: string },
        'consent' | 'consent_at' | 'muted' | 'by_default' | 'updated_at'
      >;
      chat_pet_state: Table<
        {
          link_id: string;
          day: string | null;
          interventions: number;
          messages_since_remark: number;
          icebreaker_done: boolean;
          last_user_at: string | null;
          last_nudge_for: string | null;
          last_guard_at: string | null;
          updated_at: string;
        },
        'day' | 'interventions' | 'messages_since_remark' | 'icebreaker_done' | 'last_user_at' | 'last_nudge_for' | 'last_guard_at' | 'updated_at'
      >;
      push_devices: Table<
        { token: string; user_id: string; platform: string; kind: string; created_at: string; last_seen_at: string; disabled_at: string | null },
        'kind' | 'created_at' | 'last_seen_at' | 'disabled_at'
      >;
      notification_settings: Table<
        { user_id: string; time_zone: string; morning_hour: number; disabled_kinds: string[]; next_morning_at: string | null; updated_at: string },
        'time_zone' | 'morning_hour' | 'disabled_kinds' | 'next_morning_at' | 'updated_at'
      >;
      notification_log: Table<
        {
          id: number;
          user_id: string;
          kind: string;
          link_id: string | null;
          local_day: string;
          status: string;
          send_after: string | null;
          vars: Json | null;
          created_at: string;
        },
        'id' | 'link_id' | 'send_after' | 'vars' | 'created_at'
      >;
      push_receipts: Table<{ ticket_id: string; token: string; created_at: string }, 'created_at'>;
      /** Migration 20261117140000_hebdo_fidelisation : messages de fidélisation déjà partis (une ligne par personne et clé). */
      lifecycle_messages: Table<{ user_id: string; key: string; sent_at: string }, 'sent_at'>;
      tick_runs: Table<{ job: string; slot: string; started_at: string; finished_at: string | null; done: number | null }, 'started_at' | 'finished_at' | 'done'>;
      ritual_states: Table<
        {
          user_id: string;
          streak_current: number;
          streak_best: number;
          streak_last_done_on: string | null;
          joker_days: string[];
          last_seen_on: string | null;
          outing_on: string | null;
          outing_answer: string | null;
          outing_confirmed: boolean;
          habits_kept: number;
          danger_notified_on: string | null;
          needs_out_notified_on: string | null;
          review_week: string | null;
          updated_at: string;
        },
        | 'streak_current'
        | 'streak_best'
        | 'streak_last_done_on'
        | 'joker_days'
        | 'last_seen_on'
        | 'outing_on'
        | 'outing_answer'
        | 'outing_confirmed'
        | 'habits_kept'
        | 'danger_notified_on'
        | 'needs_out_notified_on'
        | 'review_week'
        | 'updated_at'
      >;
      ritual_photos: Table<
        { id: string; user_id: string; source: string; day: string; path: string; caption: string; keep: boolean; created_at: string; deleted_at: string | null },
        'caption' | 'keep' | 'created_at' | 'deleted_at'
      >;
      daily_challenges: Table<
        {
          user_id: string;
          day: string;
          challenge_id: string;
          kind: string;
          axis: string | null;
          status: string;
          answer: number | null;
          photo_id: string | null;
          seen_at: string | null;
          accepted_at: string | null;
          done_at: string | null;
          created_at: string;
        },
        'axis' | 'status' | 'answer' | 'photo_id' | 'seen_at' | 'accepted_at' | 'done_at' | 'created_at'
      >;
      habits: Table<
        { id: string; user_id: string; habit_id: string; rhythm: string; proof_hour: number; asked_on: string | null; created_at: string; archived_at: string | null },
        'asked_on' | 'created_at' | 'archived_at'
      >;
      habit_checks: Table<
        { id: string; habit_ref: string; user_id: string; day: string; verdict: string; line: string; photo_id: string | null; created_at: string },
        'photo_id' | 'created_at'
      >;
      weekly_reviews: Table<
        {
          id: string;
          user_id: string;
          week_start: string;
          facts: Json;
          did: string[];
          noticed: string;
          tip: string;
          link_lines: string[];
          body: string;
          coached: boolean;
          detailed: Json | null;
          vision: Json;
          read_at: string | null;
          created_at: string;
          axis_moves: Json;
        },
        'did' | 'link_lines' | 'coached' | 'detailed' | 'vision' | 'read_at' | 'created_at' | 'axis_moves'
      >;
      apple_tokens: Table<{ user_id: string; refresh_token: string; client_id: string; created_at: string; updated_at: string }, 'created_at' | 'updated_at'>;
      // ── Habitudes partagées et groupes (migration 20261117120000_groupes) ──
      habit_jokers: Table<{ user_id: string; day: string; created_at: string }, 'created_at'>;
      groups: Table<
        {
          id: string;
          name: string;
          kind: 'habit' | 'free';
          habit_id: string | null;
          status: 'forming' | 'active' | 'asleep' | 'closed';
          created_by: string | null;
          lives: number;
          streak: number;
          best_streak: number;
          clean_days: number;
          started_on: string | null;
          evaluated_through: string | null;
          from_together: boolean;
          closed_at: string | null;
          closed_reason: string | null;
          created_at: string;
          updated_at: string;
        },
        | 'id'
        | 'habit_id'
        | 'status'
        | 'created_by'
        | 'lives'
        | 'streak'
        | 'best_streak'
        | 'clean_days'
        | 'started_on'
        | 'evaluated_through'
        | 'from_together'
        | 'closed_at'
        | 'closed_reason'
        | 'created_at'
        | 'updated_at'
      >;
      group_members: Table<
        {
          group_id: string;
          user_id: string;
          status: 'invited' | 'active' | 'declined' | 'left';
          invited_by: string | null;
          joined_at: string | null;
          left_at: string | null;
          last_read_at: string | null;
          notified_at: string | null;
          created_at: string;
        },
        'invited_by' | 'joined_at' | 'left_at' | 'last_read_at' | 'notified_at' | 'created_at'
      >;
      group_messages: Table<
        {
          id: string;
          group_id: string;
          author_kind: 'user' | 'pet' | 'system';
          author_id: string | null;
          kind: 'text' | 'event';
          body: string | null;
          event: string | null;
          event_vars: Json;
          created_at: string;
        },
        'id' | 'author_id' | 'body' | 'event' | 'event_vars' | 'created_at'
      >;
      group_days: Table<
        { group_id: string; day: string; outcome: 'kept' | 'missed' | 'skipped'; members: Json; lives_after: number; streak_after: number; created_at: string },
        'members' | 'created_at'
      >;
      together_proposals: Table<
        { id: string; user_id: string; habit_id: string; status: 'waiting' | 'matched' | 'withdrawn'; group_id: string | null; created_at: string; updated_at: string },
        'id' | 'status' | 'group_id' | 'created_at' | 'updated_at'
      >;
    };
    Views: { [_ in never]: never };
    Functions: {
      admin_daily_metrics: { Args: { p_day: string }; Returns: Json };
      /** Socle des chiffres du jour (20261115160000), appelé par `admin_daily_metrics` (20261115190000, + liens écrits à deux). */
      admin_daily_metrics_base: { Args: { p_day: string }; Returns: Json };
      ai_take_user_call: { Args: { p_user: string; p_day: string; p_feature: string; p_max: number }; Returns: boolean };
      ritual_add_habits_kept: { Args: { p_user: string; p_n: number }; Returns: number };
      encounter_proposals_record: { Args: { p_day: string; p_user: string; p_proposed: number; p_score_sum: number }; Returns: undefined };
      encounter_proposals_summary: { Args: { p_day: string }; Returns: Json };
      places_in_cells: { Args: { p_cells: string[]; p_limit: number; p_exclude: string }; Returns: Database['public']['Tables']['profile_places']['Row'][] };
      ai_record_usage: {
        Args: {
          p_day: string;
          p_feature: string;
          p_tier: string;
          p_calls: number;
          p_declined: number;
          p_errors: number;
          p_input: number;
          p_output: number;
          p_cache_write: number;
          p_cache_read: number;
          p_cost_micros: number;
        };
        Returns: undefined;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Db = import('@supabase/supabase-js').SupabaseClient<Database>;
