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
      app_session_events: {
        Row: {
          browser: string | null
          city: string | null
          country_code: string | null
          created_at: string
          device_info: Json | null
          device_type: string | null
          event_type: string
          id: string
          metadata: Json | null
          os_version: string | null
          screen_size: string | null
          session_duration_seconds: number | null
          session_id: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_info?: Json | null
          device_type?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          os_version?: string | null
          screen_size?: string | null
          session_duration_seconds?: number | null
          session_id: string
          user_id: string
        }
        Update: {
          browser?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          device_info?: Json | null
          device_type?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          os_version?: string | null
          screen_size?: string | null
          session_duration_seconds?: number | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      bonus_claim_events: {
        Row: {
          bonus_type: string
          coins_amount: number | null
          created_at: string
          event_type: string
          id: string
          is_subscriber: boolean | null
          lives_amount: number | null
          metadata: Json | null
          session_id: string
          streak_day: number | null
          user_id: string
        }
        Insert: {
          bonus_type: string
          coins_amount?: number | null
          created_at?: string
          event_type: string
          id?: string
          is_subscriber?: boolean | null
          lives_amount?: number | null
          metadata?: Json | null
          session_id: string
          streak_day?: number | null
          user_id: string
        }
        Update: {
          bonus_type?: string
          coins_amount?: number | null
          created_at?: string
          event_type?: string
          id?: string
          is_subscriber?: boolean | null
          lives_amount?: number | null
          metadata?: Json | null
          session_id?: string
          streak_day?: number | null
          user_id?: string
        }
        Relationships: []
      }
      chat_interaction_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          session_id: string
          target_user_id: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          session_id: string
          target_user_id?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          target_user_id?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
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
      conversion_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          product_id: string | null
          product_type: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_type?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          product_type?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversion_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversion_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_collection_metadata: {
        Row: {
          collection_start_date: string
          created_at: string
          description: string
          feature_name: string
          id: string
        }
        Insert: {
          collection_start_date: string
          created_at?: string
          description: string
          feature_name: string
          id?: string
        }
        Update: {
          collection_start_date?: string
          created_at?: string
          description?: string
          feature_name?: string
          id?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_deleted: boolean
          message_seq: number
          sender_id: string
          status: string | null
          thread_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          message_seq?: never
          sender_id: string
          status?: string | null
          thread_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          message_seq?: never
          sender_id?: string
          status?: string | null
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
      feature_usage_events: {
        Row: {
          action: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          event_type: string
          feature_name: string
          id: string
          metadata: Json | null
          session_id: string
          success: boolean | null
          user_id: string
        }
        Insert: {
          action?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type: string
          feature_name: string
          id?: string
          metadata?: Json | null
          session_id: string
          success?: boolean | null
          user_id: string
        }
        Update: {
          action?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          event_type?: string
          feature_name?: string
          id?: string
          metadata?: Json | null
          session_id?: string
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      friend_request_rate_limit: {
        Row: {
          last_request_at: string
          target_user_id: string
          user_id: string
        }
        Insert: {
          last_request_at?: string
          target_user_id: string
          user_id: string
        }
        Update: {
          last_request_at?: string
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          requested_by: string | null
          source: string | null
          status: string
          updated_at: string
          user_id_a: string
          user_id_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          requested_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id_a: string
          user_id_b: string
        }
        Update: {
          created_at?: string
          id?: string
          requested_by?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_id_a?: string
          user_id_b?: string
        }
        Relationships: []
      }
      game_exit_events: {
        Row: {
          category: string
          correct_answers: number | null
          created_at: string
          event_type: string
          exit_reason: string | null
          id: string
          metadata: Json | null
          question_index: number
          session_id: string
          time_played_seconds: number | null
          total_questions: number | null
          user_id: string
        }
        Insert: {
          category: string
          correct_answers?: number | null
          created_at?: string
          event_type: string
          exit_reason?: string | null
          id?: string
          metadata?: Json | null
          question_index: number
          session_id: string
          time_played_seconds?: number | null
          total_questions?: number | null
          user_id: string
        }
        Update: {
          category?: string
          correct_answers?: number | null
          created_at?: string
          event_type?: string
          exit_reason?: string | null
          id?: string
          metadata?: Json | null
          question_index?: number
          session_id?: string
          time_played_seconds?: number | null
          total_questions?: number | null
          user_id?: string
        }
        Relationships: []
      }
      game_help_usage: {
        Row: {
          category: string
          created_at: string
          game_result_id: string | null
          help_type: string
          id: string
          question_index: number
          used_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          game_result_id?: string | null
          help_type: string
          id?: string
          question_index: number
          used_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          game_result_id?: string | null
          help_type?: string
          id?: string
          question_index?: number
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_help_usage_game_result_id_fkey"
            columns: ["game_result_id"]
            isOneToOne: false
            referencedRelation: "game_results"
            referencedColumns: ["id"]
          },
        ]
      }
      game_question_analytics: {
        Row: {
          category: string
          created_at: string
          difficulty_level: string | null
          game_result_id: string | null
          help_used: string | null
          id: string
          is_genius_user: boolean | null
          question_id: string | null
          question_index: number
          response_time_seconds: number
          session_id: string
          user_id: string
          was_correct: boolean
        }
        Insert: {
          category: string
          created_at?: string
          difficulty_level?: string | null
          game_result_id?: string | null
          help_used?: string | null
          id?: string
          is_genius_user?: boolean | null
          question_id?: string | null
          question_index: number
          response_time_seconds: number
          session_id: string
          user_id: string
          was_correct: boolean
        }
        Update: {
          category?: string
          created_at?: string
          difficulty_level?: string | null
          game_result_id?: string | null
          help_used?: string | null
          id?: string
          is_genius_user?: boolean | null
          question_id?: string | null
          question_index?: number
          response_time_seconds?: number
          session_id?: string
          user_id?: string
          was_correct?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "game_question_analytics_game_result_id_fkey"
            columns: ["game_result_id"]
            isOneToOne: false
            referencedRelation: "game_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_question_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_question_analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "game_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          category: string
          completed_at: string | null
          correct_answers: number
          created_at: string
          current_question: number
          expires_at: string
          id: string
          questions: Json
          session_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          category: string
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          current_question?: number
          expires_at: string
          id?: string
          questions: Json
          session_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          correct_answers?: number
          created_at?: string
          current_question?: number
          expires_at?: string
          id?: string
          questions?: Json
          session_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
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
            foreignKeyName: "invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lives_ledger: {
        Row: {
          correlation_id: string
          created_at: string | null
          delta_lives: number
          id: string
          metadata: Json | null
          source: string
          user_id: string
        }
        Insert: {
          correlation_id: string
          created_at?: string | null
          delta_lives: number
          id?: string
          metadata?: Json | null
          source: string
          user_id: string
        }
        Update: {
          correlation_id?: string
          created_at?: string | null
          delta_lives?: number
          id?: string
          metadata?: Json | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      message_media: {
        Row: {
          created_at: string | null
          duration_ms: number | null
          file_name: string | null
          file_size: number | null
          height: number | null
          id: string
          media_type: string
          media_url: string
          message_id: string
          mime_type: string | null
          thumbnail_url: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          duration_ms?: number | null
          file_name?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          media_type: string
          media_url: string
          message_id: string
          mime_type?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          duration_ms?: number | null
          file_name?: string | null
          file_size?: number | null
          height?: number | null
          id?: string
          media_type?: string
          media_url?: string
          message_id?: string
          mime_type?: string | null
          thumbnail_url?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "message_media_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
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
      navigation_events: {
        Row: {
          created_at: string
          device_info: Json | null
          event_type: string
          id: string
          metadata: Json | null
          page_route: string
          previous_route: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_type: string
          id?: string
          metadata?: Json | null
          page_route: string
          previous_route?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_type?: string
          id?: string
          metadata?: Json | null
          page_route?: string
          previous_route?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: []
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
          help_audience_active: boolean | null
          help_third_active: boolean | null
          id: string
          invitation_code: string | null
          invitation_rewards_reset_at: string | null
          is_subscribed: boolean | null
          is_subscriber: boolean | null
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
          sub_promo_last_shown: string | null
          subscriber_renew_at: string | null
          subscriber_since: string | null
          subscriber_type: string | null
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
          help_audience_active?: boolean | null
          help_third_active?: boolean | null
          id: string
          invitation_code?: string | null
          invitation_rewards_reset_at?: string | null
          is_subscribed?: boolean | null
          is_subscriber?: boolean | null
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
          sub_promo_last_shown?: string | null
          subscriber_renew_at?: string | null
          subscriber_since?: string | null
          subscriber_type?: string | null
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
          help_audience_active?: boolean | null
          help_third_active?: boolean | null
          id?: string
          invitation_code?: string | null
          invitation_rewards_reset_at?: string | null
          is_subscribed?: boolean | null
          is_subscriber?: boolean | null
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
          sub_promo_last_shown?: string | null
          subscriber_renew_at?: string | null
          subscriber_since?: string | null
          subscriber_type?: string | null
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
          screenshot_urls: string[] | null
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
          screenshot_urls?: string[] | null
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
          screenshot_urls?: string[] | null
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
      session_details: {
        Row: {
          browser: string | null
          country_code: string | null
          created_at: string
          device_type: string | null
          duration_seconds: number | null
          games_played: number | null
          id: string
          is_genius: boolean | null
          messages_sent: number | null
          os_version: string | null
          pages_visited: number | null
          purchases_made: number | null
          screen_size: string | null
          session_end: string | null
          session_id: string
          session_start: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          games_played?: number | null
          id?: string
          is_genius?: boolean | null
          messages_sent?: number | null
          os_version?: string | null
          pages_visited?: number | null
          purchases_made?: number | null
          screen_size?: string | null
          session_end?: string | null
          session_id: string
          session_start?: string
          user_id: string
        }
        Update: {
          browser?: string | null
          country_code?: string | null
          created_at?: string
          device_type?: string | null
          duration_seconds?: number | null
          games_played?: number | null
          id?: string
          is_genius?: boolean | null
          messages_sent?: number | null
          os_version?: string | null
          pages_visited?: number | null
          purchases_made?: number | null
          screen_size?: string | null
          session_end?: string | null
          session_id?: string
          session_start?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_interactions: {
        Row: {
          created_at: string
          currency: string | null
          event_type: string
          id: string
          metadata: Json | null
          price_amount: number | null
          product_id: string | null
          product_name: string | null
          product_type: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          price_amount?: number | null
          product_id?: string | null
          product_name?: string | null
          product_type: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          price_amount?: number | null
          product_id?: string | null
          product_name?: string | null
          product_type?: string
          session_id?: string
          user_id?: string
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
      subscription_promo_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          promo_trigger: string | null
          promo_type: string
          session_id: string
          time_since_last_shown_seconds: number | null
          times_shown_before: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          promo_trigger?: string | null
          promo_type: string
          session_id: string
          time_since_last_shown_seconds?: number | null
          times_shown_before?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          promo_trigger?: string | null
          promo_type?: string
          session_id?: string
          time_since_last_shown_seconds?: number | null
          times_shown_before?: number | null
          user_id?: string
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
      thread_participants: {
        Row: {
          can_send: boolean
          created_at: string
          thread_id: string
          user_id: string
        }
        Insert: {
          can_send?: boolean
          created_at?: string
          thread_id: string
          user_id: string
        }
        Update: {
          can_send?: boolean
          created_at?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      tips_tricks_videos: {
        Row: {
          created_at: string | null
          description: string | null
          duration_sec: number | null
          id: string
          is_active: boolean | null
          published_at: string | null
          sort_order: number | null
          thumb_url: string
          title: string
          updated_at: string | null
          video_url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_sec?: number | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          sort_order?: number | null
          thumb_url: string
          title: string
          updated_at?: string | null
          video_url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_sec?: number | null
          id?: string
          is_active?: boolean | null
          published_at?: string | null
          sort_order?: number | null
          thumb_url?: string
          title?: string
          updated_at?: string | null
          video_url?: string
        }
        Relationships: []
      }
      typing_status: {
        Row: {
          is_typing: boolean | null
          thread_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          is_typing?: boolean | null
          thread_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          is_typing?: boolean | null
          thread_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "typing_status_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "dm_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_daily: {
        Row: {
          date: string
          histogram: number[]
          top_slots: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          date: string
          histogram?: number[]
          top_slots?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          date?: string
          histogram?: number[]
          top_slots?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_pings: {
        Row: {
          bucket_start: string
          created_at: string
          device_class: string
          id: string
          source: string
          user_id: string
        }
        Insert: {
          bucket_start: string
          created_at?: string
          device_class: string
          id?: string
          source: string
          user_id: string
        }
        Update: {
          bucket_start?: string
          created_at?: string
          device_class?: string
          id?: string
          source?: string
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
          {
            foreignKeyName: "user_boosters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cohorts: {
        Row: {
          became_genius_day: number | null
          churn_risk_score: number | null
          cohort_month: string
          cohort_week: string
          created_at: string
          first_purchase_day: number | null
          is_retained_d1: boolean | null
          is_retained_d14: boolean | null
          is_retained_d30: boolean | null
          is_retained_d7: boolean | null
          last_active_date: string | null
          registration_date: string
          total_games: number | null
          total_purchases: number | null
          total_sessions: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          became_genius_day?: number | null
          churn_risk_score?: number | null
          cohort_month: string
          cohort_week: string
          created_at?: string
          first_purchase_day?: number | null
          is_retained_d1?: boolean | null
          is_retained_d14?: boolean | null
          is_retained_d30?: boolean | null
          is_retained_d7?: boolean | null
          last_active_date?: string | null
          registration_date: string
          total_games?: number | null
          total_purchases?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          became_genius_day?: number | null
          churn_risk_score?: number | null
          cohort_month?: string
          cohort_week?: string
          created_at?: string
          first_purchase_day?: number | null
          is_retained_d1?: boolean | null
          is_retained_d14?: boolean | null
          is_retained_d30?: boolean | null
          is_retained_d7?: boolean | null
          last_active_date?: string | null
          registration_date?: string
          total_games?: number | null
          total_purchases?: number | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cohorts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cohorts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_engagement_scores: {
        Row: {
          created_at: string
          factors: Json
          game_score: number | null
          last_calculated: string
          previous_score: number | null
          purchase_score: number | null
          retention_score: number | null
          score: number
          score_tier: string
          score_trend: string | null
          session_score: number | null
          social_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          factors?: Json
          game_score?: number | null
          last_calculated?: string
          previous_score?: number | null
          purchase_score?: number | null
          retention_score?: number | null
          score: number
          score_tier: string
          score_trend?: string | null
          session_score?: number | null
          social_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          factors?: Json
          game_score?: number | null
          last_calculated?: string
          previous_score?: number | null
          purchase_score?: number | null
          retention_score?: number | null
          score?: number
          score_tier?: string
          score_trend?: string | null
          session_score?: number | null
          social_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_engagement_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_engagement_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
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
          {
            foreignKeyName: "wallet_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_leaderboard_snapshot: {
        Row: {
          id: string
          rank: number
          score: number
          snapshot_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          id?: string
          rank: number
          score: number
          snapshot_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          id?: string
          rank?: number
          score?: number
          snapshot_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_login_rewards: {
        Row: {
          created_at: string | null
          gold_amount: number
          lives_bonus: number | null
          reward_index: number
        }
        Insert: {
          created_at?: string | null
          gold_amount: number
          lives_bonus?: number | null
          reward_index: number
        }
        Update: {
          created_at?: string | null
          gold_amount?: number
          lives_bonus?: number | null
          reward_index?: number
        }
        Relationships: []
      }
      weekly_login_state: {
        Row: {
          awarded_login_index: number | null
          created_at: string | null
          last_counted_at: string | null
          updated_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          awarded_login_index?: number | null
          created_at?: string | null
          last_counted_at?: string | null
          updated_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          awarded_login_index?: number | null
          created_at?: string | null
          last_counted_at?: string | null
          updated_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_prize_table: {
        Row: {
          created_at: string | null
          gold: number
          lives: number
          rank: number
        }
        Insert: {
          created_at?: string | null
          gold: number
          lives: number
          rank: number
        }
        Update: {
          created_at?: string | null
          gold?: number
          lives?: number
          rank?: number
        }
        Relationships: []
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
          {
            foreignKeyName: "weekly_rankings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_winner_awarded: {
        Row: {
          awarded_at: string | null
          rank: number
          user_id: string
          week_start: string
        }
        Insert: {
          awarded_at?: string | null
          rank: number
          user_id: string
          week_start: string
        }
        Update: {
          awarded_at?: string | null
          rank?: number
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
      weekly_winner_popup_shown: {
        Row: {
          shown_at: string | null
          user_id: string
          week_start: string
        }
        Insert: {
          shown_at?: string | null
          user_id: string
          week_start: string
        }
        Update: {
          shown_at?: string | null
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string | null
          invitation_code: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          invitation_code?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string | null
          invitation_code?: string | null
          username?: string | null
        }
        Relationships: []
      }
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
      cleanup_expired_game_sessions: { Args: never; Returns: undefined }
      cleanup_old_messages: { Args: never; Returns: undefined }
      create_friendship_from_invitation: {
        Args: { p_invitee_id: string; p_inviter_id: string }
        Returns: Json
      }
      credit_lives: {
        Args: {
          p_delta_lives: number
          p_idempotency_key: string
          p_metadata?: Json
          p_source: string
          p_user_id: string
        }
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
      get_current_week_start: { Args: never; Returns: string }
      get_invitation_tier_reward: {
        Args: { accepted_count: number }
        Returns: Json
      }
      get_next_life_at: { Args: { p_user_id: string }; Returns: string }
      get_user_threads_optimized: {
        Args: { p_user_id: string }
        Returns: {
          is_online: boolean
          last_message_at: string
          other_user_avatar: string
          other_user_id: string
          other_user_name: string
          thread_id: string
        }[]
      }
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
      search_users_by_name: {
        Args: {
          current_user_id: string
          result_limit?: number
          search_query: string
        }
        Returns: {
          avatar_url: string
          id: string
          username: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
