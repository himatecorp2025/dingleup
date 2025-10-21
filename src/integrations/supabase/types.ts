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
          last_invitation_reward_reset: string | null
          last_life_regeneration: string | null
          lives: number | null
          lives_regeneration_rate: number | null
          max_lives: number | null
          question_swaps_available: number | null
          speed_booster_active: boolean | null
          speed_booster_expires_at: string | null
          speed_booster_multiplier: number | null
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
          last_invitation_reward_reset?: string | null
          last_life_regeneration?: string | null
          lives?: number | null
          lives_regeneration_rate?: number | null
          max_lives?: number | null
          question_swaps_available?: number | null
          speed_booster_active?: boolean | null
          speed_booster_expires_at?: string | null
          speed_booster_multiplier?: number | null
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
          last_invitation_reward_reset?: string | null
          last_life_regeneration?: string | null
          lives?: number | null
          lives_regeneration_rate?: number | null
          max_lives?: number | null
          question_swaps_available?: number | null
          speed_booster_active?: boolean | null
          speed_booster_expires_at?: string | null
          speed_booster_multiplier?: number | null
          total_correct_answers?: number
          updated_at?: string | null
          username?: string
          welcome_bonus_claimed?: boolean | null
        }
        Relationships: []
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
      activate_speed_booster: {
        Args: { booster_id: string }
        Returns: boolean
      }
      award_coins: {
        Args: { amount: number }
        Returns: undefined
      }
      claim_daily_gift: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      claim_welcome_bonus: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      distribute_weekly_rewards: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_invitation_tier_reward: {
        Args: { accepted_count: number }
        Returns: Json
      }
      process_invitation_reward: {
        Args: { inviter_user_id: string }
        Returns: Json
      }
      purchase_life: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      reactivate_help: {
        Args: { p_cost?: number; p_help_type: string }
        Returns: Json
      }
      regenerate_invitation_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      regenerate_lives: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      regenerate_lives_background: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_game_helps: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      spend_coins: {
        Args: { amount: number }
        Returns: boolean
      }
      use_help: {
        Args: { p_help_type: string }
        Returns: Json
      }
      use_life: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
