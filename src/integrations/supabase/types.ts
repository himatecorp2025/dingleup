export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      conversation_members: {
        Row: {
          conversation_id: string
          id: string
          is_admin: boolean
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_admin?: boolean
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_group: boolean
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group?: boolean
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_deleted: boolean
          sender_id: string
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          sender_id: string
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_threads: {
        Row: {
          archived_by_user_a: boolean | null
          archived_by_user_b: boolean | null
          created_at: string
          id: string
          last_message_at: string | null
          user_id_a: string
          user_id_b: string
        }
        Insert: {
          archived_by_user_a?: boolean | null
          archived_by_user_b?: boolean | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          user_id_a: string
          user_id_b: string
        }
        Update: {
          archived_by_user_a?: boolean | null
          archived_by_user_b?: boolean | null
          created_at?: string
          id?: string
          last_message_at?: string | null
          user_id_a?: string
          user_id_b?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id_a: string
          user_id_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id_a: string
          user_id_b: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id_a?: string
          user_id_b?: string
        }
        Relationships: []
      }
      game_results: {
        Row: {
          average_response_time: number | null
          category: string
          coins_earned: number
          completed: boolean | null
          completed_at: string | null
          correct_answers: number
          created_at: string | null
          id: string
          total_questions: number
          user_id: string
        }
        Insert: {
          average_response_time?: number | null
          category: string
          coins_earned?: number
          completed?: boolean | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          id?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          average_response_time?: number | null
          category?: string
          coins_earned?: number
          completed?: boolean | null
          completed_at?: string | null
          correct_answers?: number
          created_at?: string | null
          id?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      global_leaderboard: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          rank: number | null
          total_correct_answers: number
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          rank?: number | null
          total_correct_answers?: number
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          rank?: number | null
          total_correct_answers?: number
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          created_at: string | null
          id: string
          invitation_code: string
          invited_email: string | null
          invited_user_id: string | null
          inviter_id: string
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invitation_code: string
          invited_email?: string | null
          invited_user_id?: string | null
          inviter_id: string
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invitation_code?: string
          invited_email?: string | null
          invited_user_id?: string | null
          inviter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reads: {
        Row: {
          last_read_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          last_read_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          last_read_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          is_reported: boolean | null
          link_preview_image: string | null
          link_preview_url: string | null
          media_type: string | null
          media_url: string | null
          retention_until: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          is_reported?: boolean | null
          link_preview_image?: string | null
          link_preview_url?: string | null
          media_type?: string | null
          media_url?: string | null
          retention_until?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          is_reported?: boolean | null
          link_preview_image?: string | null
          link_preview_url?: string | null
          media_type?: string | null
          media_url?: string | null
          retention_until?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          coins: number | null
          created_at: string | null
          daily_gift_last_claimed: string | null
          daily_gift_streak: number | null
          email: string
          help_2x_answer_active: boolean | null
          help_50_50_active: boolean | null
          help_audience_active: boolean | null
          id: string
          invitation_code: string | null
          invitation_rewards_reset_at: string | null
          is_subscribed: boolean | null
          last_invitation_reward_reset: string | null
          last_life_regeneration: string | null
          lives: number | null
          lives_regeneration_rate: number | null
          max_lives: number | null
          question_swaps_available: number | null
          speed_booster_active: boolean | null
          speed_booster_expires_at: string | null
          speed_booster_multiplier: number | null
          speed_coins_per_tick: number | null
          speed_lives_per_tick: number | null
          speed_tick_interval_seconds: number | null
          speed_tick_last_processed_at: string | null
          subscription_tier: string | null
          total_correct_answers: number
          updated_at: string | null
          username: string
          welcome_bonus_claimed: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          coins?: number | null
          created_at?: string | null
          daily_gift_last_claimed?: string | null
          daily_gift_streak?: number | null
          email: string
          help_2x_answer_active?: boolean | null
          help_50_50_active?: boolean | null
          help_audience_active?: boolean | null
          id: string
          invitation_code?: string | null
          invitation_rewards_reset_at?: string | null
          is_subscribed?: boolean | null
          last_invitation_reward_reset?: string | null
          last_life_regeneration?: string | null
          lives?: number | null
          lives_regeneration_rate?: number | null
          max_lives?: number | null
          question_swaps_available?: number | null
          speed_booster_active?: boolean | null
          speed_booster_expires_at?: string | null
          speed_booster_multiplier?: number | null
          speed_coins_per_tick?: number | null
          speed_lives_per_tick?: number | null
          speed_tick_interval_seconds?: number | null
          speed_tick_last_processed_at?: string | null
          subscription_tier?: string | null
          total_correct_answers?: number
          updated_at?: string | null
          username: string
          welcome_bonus_claimed?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          coins?: number | null
          created_at?: string | null
          daily_gift_last_claimed?: string | null
          daily_gift_streak?: number | null
          email?: string
          help_2x_answer_active?: boolean | null
          help_50_50_active?: boolean | null
          help_audience_active?: boolean | null
          id?: string
          invitation_code?: string | null
          invitation_rewards_reset_at?: string | null
          is_subscribed?: boolean | null
          last_invitation_reward_reset?: string | null
          last_life_regeneration?: string | null
          lives?: number | null
          lives_regeneration_rate?: number | null
          max_lives?: number | null
          question_swaps_available?: number | null
          speed_booster_active?: boolean | null
          speed_booster_expires_at?: string | null
          speed_booster_multiplier?: number | null
          speed_coins_per_tick?: number | null
          speed_lives_per_tick?: number | null
          speed_tick_interval_seconds?: number | null
          speed_tick_last_processed_at?: string | null
          subscription_tier?: string | null
          total_correct_answers?: number
          updated_at?: string | null
          username?: string
          welcome_bonus_claimed?: boolean | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_coins: number | null
          amount_usd: number | null
          country: string | null
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          payment_method: string
          product_name: string | null
          product_type: string
          purchase_date: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount_coins?: number | null
          amount_usd?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method: string
          product_name?: string | null
          product_type: string
          purchase_date?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount_coins?: number | null
          amount_usd?: number | null
          country?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_method?: string
          product_name?: string | null
          product_type?: string
          purchase_date?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          bug_category: string | null
          bug_description: string | null
          created_at: string
          id: string
          report_type: string
          reported_message_id: string | null
          reported_user_id: string | null
          reporter_id: string
          status: string
          updated_at: string
          violation_description: string | null
          violation_type: string | null
        }
        Insert: {
          admin_notes?: string | null
          bug_category?: string | null
          bug_description?: string | null
          created_at?: string
          id?: string
          report_type: string
          reported_message_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          status?: string
          updated_at?: string
          violation_description?: string | null
          violation_type?: string | null
        }
        Update: {
          admin_notes?: string | null
          bug_category?: string | null
          bug_description?: string | null
          created_at?: string
          id?: string
          report_type?: string
          reported_message_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          status?: string
          updated_at?: string
          violation_description?: string | null
          violation_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_message_id_fkey"
            columns: ["reported_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end: string
          id?: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_boosters: {
        Row: {
          activated: boolean
          activated_at: string | null
          booster_type: string
          created_at: string
          expires_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          activated?: boolean
          activated_at?: string | null
          booster_type: string
          created_at?: string
          expires_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          activated?: boolean
          activated_at?: string | null
          booster_type?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_boosters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          is_online: boolean
          last_seen: string
          user_id: string
        }
        Insert: {
          is_online?: boolean
          last_seen?: string
          user_id: string
        }
        Update: {
          is_online?: boolean
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          created_at: string
          delta_coins: number
          delta_lives: number
          id: string
          idempotency_key: string
          metadata: Json | null
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta_coins?: number
          delta_lives?: number
          id?: string
          idempotency_key: string
          metadata?: Json | null
          source: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta_coins?: number
          delta_lives?: number
          id?: string
          idempotency_key?: string
          metadata?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_rankings: {
        Row: {
          average_response_time: number | null
          category: string
          created_at: string | null
          id: string
          rank: number | null
          total_correct_answers: number | null
          updated_at: string | null
          user_id: string
          username: string | null
          week_start: string
        }
        Insert: {
          average_response_time?: number | null
          category: string
          created_at?: string | null
          id?: string
          rank?: number | null
          total_correct_answers?: number | null
          updated_at?: string | null
          user_id: string
          username?: string | null
          week_start: string
        }
        Update: {
          average_response_time?: number | null
          category?: string
          created_at?: string | null
          id?: string
          rank?: number | null
          total_correct_answers?: number | null
          updated_at?: string | null
          user_id?: string
          username?: string | null
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { invitation_code_input: string }
        Returns: Json
      }
      activate_booster: {
        Args: {
          p_booster_type: string
          p_cost: number
          p_duration_hours?: number
          p_multiplier?: number
        }
        Returns: Json
      }
      activate_speed_booster: { Args: { booster_id: string }; Returns: boolean }
      archive_thread_for_user: { Args: { p_thread_id: string }; Returns: Json }
      award_coins: { Args: { amount: number }; Returns: undefined }
      claim_daily_gift: { Args: never; Returns: Json }
      claim_welcome_bonus: { Args: never; Returns: Json }
      cleanup_old_messages: { Args: never; Returns: undefined }
      create_friendship_from_invitation: {
        Args: { p_invitee_id: string; p_inviter_id: string }
        Returns: Json
      }
      credit_wallet: {
        Args: {
          p_delta_coins: number
          p_delta_lives: number
          p_idempotency_key: string
          p_metadata?: Json
          p_source: string
          p_user_id: string
        }
        Returns: Json
      }
      distribute_weekly_rewards: { Args: never; Returns: undefined }
      generate_invitation_code: { Args: never; Returns: string }
      get_invitation_tier_reward: {
        Args: { accepted_count: number }
        Returns: Json
      }
      get_next_life_at: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_users_offline: { Args: never; Returns: undefined }
      normalize_user_ids: {
        Args: { uid1: string; uid2: string }
        Returns: string[]
      }
      process_invitation_reward: { Args: never; Returns: Json }
      purchase_life: { Args: never; Returns: Json }
      reactivate_help: {
        Args: { p_cost?: number; p_help_type: string }
        Returns: Json
      }
      regenerate_invitation_code: { Args: never; Returns: string }
      regenerate_lives: { Args: never; Returns: undefined }
      regenerate_lives_background: { Args: never; Returns: undefined }
      reset_game_helps: { Args: never; Returns: undefined }
      spend_coins: { Args: { amount: number }; Returns: boolean }
      start_speed_booster: {
        Args: { p_duration_minutes?: number; p_multiplier: number }
        Returns: Json
      }
      use_help: { Args: { p_help_type: string }; Returns: Json }
      use_life: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
