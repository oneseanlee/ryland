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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliate_leads: {
        Row: {
          affiliate_id: string
          assigned_rep: string | null
          commission_amount: number | null
          commission_status: string | null
          company_name: string | null
          created_at: string
          deal_amount: number | null
          email: string | null
          full_name: string
          ghl_contact_id: string | null
          ghl_opportunity_id: string | null
          id: string
          latest_update: string | null
          next_appointment_at: string | null
          next_step: string | null
          notes: string | null
          phone: string | null
          pipeline_stage: string
          referred_at: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          assigned_rep?: string | null
          commission_amount?: number | null
          commission_status?: string | null
          company_name?: string | null
          created_at?: string
          deal_amount?: number | null
          email?: string | null
          full_name: string
          ghl_contact_id?: string | null
          ghl_opportunity_id?: string | null
          id?: string
          latest_update?: string | null
          next_appointment_at?: string | null
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string
          referred_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          assigned_rep?: string | null
          commission_amount?: number | null
          commission_status?: string | null
          company_name?: string | null
          created_at?: string
          deal_amount?: number | null
          email?: string | null
          full_name?: string
          ghl_contact_id?: string | null
          ghl_opportunity_id?: string | null
          id?: string
          latest_update?: string | null
          next_appointment_at?: string | null
          next_step?: string | null
          notes?: string | null
          phone?: string | null
          pipeline_stage?: string
          referred_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_leads_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type?: string
          read?: boolean
          link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          link?: string | null
          created_at?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          admin_notes: string | null
          affiliate_id: string
          backend_commission_rate: number
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          ghl_contact_id: string | null
          id: string
          payment_email: string | null
          phone: string | null
          status: Database["public"]["Enums"]["affiliate_status"]
          updated_at: string
          upfront_commission_rate: number
          user_id: string
          w9_file_url: string | null
          website: string | null
        }
        Insert: {
          admin_notes?: string | null
          affiliate_id: string
          backend_commission_rate?: number
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          ghl_contact_id?: string | null
          id?: string
          payment_email?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          updated_at?: string
          upfront_commission_rate?: number
          user_id: string
          w9_file_url?: string | null
          website?: string | null
        }
        Update: {
          admin_notes?: string | null
          affiliate_id?: string
          backend_commission_rate?: number
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          ghl_contact_id?: string | null
          id?: string
          payment_email?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["affiliate_status"]
          updated_at?: string
          upfront_commission_rate?: number
          user_id?: string
          w9_file_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
      assessment_leads: {
        Row: {
          business_name: string | null
          business_status: string
          created_at: string
          credit_score_range: string
          denied_recently: boolean
          email: string
          funding_timeline: string
          id: string
          name: string
          phone: string | null
          primary_goal: string
          qualification: string
        }
        Insert: {
          business_name?: string | null
          business_status: string
          created_at?: string
          credit_score_range: string
          denied_recently?: boolean
          email: string
          funding_timeline: string
          id?: string
          name: string
          phone?: string | null
          primary_goal: string
          qualification?: string
        }
        Update: {
          business_name?: string | null
          business_status?: string
          created_at?: string
          credit_score_range?: string
          denied_recently?: boolean
          email?: string
          funding_timeline?: string
          id?: string
          name?: string
          phone?: string | null
          primary_goal?: string
          qualification?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_status: Database["public"]["Enums"]["commission_status"]
          commission_type: string
          created_at: string
          id: string
          lead_id: string | null
          payout_date: string | null
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          commission_status?: Database["public"]["Enums"]["commission_status"]
          commission_type?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          payout_date?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_status?: Database["public"]["Enums"]["commission_status"]
          commission_type?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          payout_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "affiliate_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_verifications: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      funnel_leads: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          phone: string | null
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          phone?: string | null
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string | null
          source?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          download_token: string
          downloaded_at: string | null
          id: string
          order_id: string
          product_title: string
          shopify_product_handle: string
        }
        Insert: {
          created_at?: string
          download_token?: string
          downloaded_at?: string | null
          id?: string
          order_id: string
          product_title: string
          shopify_product_handle: string
        }
        Update: {
          created_at?: string
          download_token?: string
          downloaded_at?: string | null
          id?: string
          order_id?: string
          product_title?: string
          shopify_product_handle?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_name: string
          email: string
          id: string
          shopify_order_id: string
          shopify_order_number: string | null
        }
        Insert: {
          created_at?: string
          customer_name: string
          email: string
          id?: string
          shopify_order_id: string
          shopify_order_number?: string | null
        }
        Update: {
          created_at?: string
          customer_name?: string
          email?: string
          id?: string
          shopify_order_id?: string
          shopify_order_number?: string | null
        }
        Relationships: []
      }
      partner_events: {
        Row: {
          created_at: string
          description: string | null
          end_time: string | null
          event_date: string
          event_link: string | null
          id: string
          location: string | null
          start_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date: string
          event_link?: string | null
          id?: string
          location?: string | null
          start_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string | null
          event_date?: string
          event_link?: string | null
          id?: string
          location?: string | null
          start_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_submissions: {
        Row: {
          affiliate_link: string | null
          business_name: string | null
          created_at: string
          email: string
          ghl_contact_id: string | null
          id: string
          message: string | null
          name: string
          phone: string | null
          referral_source: string | null
        }
        Insert: {
          affiliate_link?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          ghl_contact_id?: string | null
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          referral_source?: string | null
        }
        Update: {
          affiliate_link?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          ghl_contact_id?: string | null
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          referral_source?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          affiliate_id: string
          amount: number
          created_at: string
          id: string
          payment_method: string | null
          payout_period: string | null
          status: Database["public"]["Enums"]["payout_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          payout_period?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string | null
          payout_period?: string | null
          status?: Database["public"]["Enums"]["payout_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          is_placeholder: boolean
          resource_type: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_placeholder?: boolean
          resource_type?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_placeholder?: boolean
          resource_type?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_opt_ins: {
        Row: {
          consent_text: string
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          name: string
          phone: string
          user_agent: string | null
        }
        Insert: {
          consent_text: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          name: string
          phone: string
          user_agent?: string | null
        }
        Update: {
          consent_text?: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          name?: string
          phone?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      speaker_requests: {
        Row: {
          affiliate_id: string
          audience_description: string | null
          created_at: string
          email: string
          event_location: string | null
          event_name: string
          full_name: string
          id: string
          notes: string | null
          organization_name: string | null
          requested_date: string | null
          status: Database["public"]["Enums"]["speaker_request_status"]
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          audience_description?: string | null
          created_at?: string
          email: string
          event_location?: string | null
          event_name: string
          full_name: string
          id?: string
          notes?: string | null
          organization_name?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["speaker_request_status"]
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          audience_description?: string | null
          created_at?: string
          email?: string
          event_location?: string | null
          event_name?: string
          full_name?: string
          id?: string
          notes?: string | null
          organization_name?: string | null
          requested_date?: string | null
          status?: Database["public"]["Enums"]["speaker_request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "speaker_requests_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_my_affiliate_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      affiliate_status: "pending" | "approved" | "suspended"
      app_role: "admin" | "user"
      commission_status: "pending" | "approved" | "paid"
      payout_status: "pending" | "processing" | "paid" | "failed"
      speaker_request_status: "pending" | "reviewed" | "approved" | "declined"
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
      affiliate_status: ["pending", "approved", "suspended"],
      app_role: ["admin", "user"],
      commission_status: ["pending", "approved", "paid"],
      payout_status: ["pending", "processing", "paid", "failed"],
      speaker_request_status: ["pending", "reviewed", "approved", "declined"],
    },
  },
} as const
