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
      clients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone_number: string
          status: string | null
          tenant_id: string
          total_balance: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone_number: string
          status?: string | null
          tenant_id: string
          total_balance?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone_number?: string
          status?: string | null
          tenant_id?: string
          total_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          id: string
          invoice_number: string
          notes: string | null
          product_id: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          id?: string
          invoice_number: string
          notes?: string | null
          product_id?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          product_id?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          tenant_id: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          tenant_id: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_details: {
        Row: {
          account_no: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          paybill: string | null
          payment_type: string
          tenant_id: string
          till: string | null
          updated_at: string
        }
        Insert: {
          account_no?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          paybill?: string | null
          payment_type: string
          tenant_id: string
          till?: string | null
          updated_at?: string
        }
        Update: {
          account_no?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          paybill?: string | null
          payment_type?: string
          tenant_id?: string
          till?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          price: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          price: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          price?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone_number: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone_number: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone_number?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_audit_logs: {
        Row: {
          action: string
          admin_email: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          resource_id: string | null
          resource_type: string
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          resource_id?: string | null
          resource_type?: string
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      super_admins: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          role: Database["public"]["Enums"]["super_admin_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["super_admin_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          role?: Database["public"]["Enums"]["super_admin_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tenant_feature_flags: {
        Row: {
          created_at: string
          flag_name: string
          id: string
          is_enabled: boolean
          metadata: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag_name: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag_name?: string
          id?: string
          is_enabled?: boolean
          metadata?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_feature_flags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          features: Json
          id: string
          max_clients: number
          max_invoices_per_month: number
          max_products: number
          max_users: number
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          features?: Json
          id?: string
          max_clients?: number
          max_invoices_per_month?: number
          max_products?: number
          max_users?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          features?: Json
          id?: string
          max_clients?: number
          max_invoices_per_month?: number
          max_products?: number
          max_users?: number
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_usage_metrics: {
        Row: {
          api_calls: number
          clients_count: number
          created_at: string
          id: string
          invoices_count: number
          period_end: string
          period_start: string
          storage_bytes: number
          tenant_id: string
          total_invoice_amount: number
          total_payment_amount: number
          transactions_count: number
          updated_at: string
          users_count: number
        }
        Insert: {
          api_calls?: number
          clients_count?: number
          created_at?: string
          id?: string
          invoices_count?: number
          period_end: string
          period_start: string
          storage_bytes?: number
          tenant_id: string
          total_invoice_amount?: number
          total_payment_amount?: number
          transactions_count?: number
          updated_at?: string
          users_count?: number
        }
        Update: {
          api_calls?: number
          clients_count?: number
          created_at?: string
          id?: string
          invoices_count?: number
          period_end?: string
          period_start?: string
          storage_bytes?: number
          tenant_id?: string
          total_invoice_amount?: number
          total_payment_amount?: number
          transactions_count?: number
          updated_at?: string
          users_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tenant_usage_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          business_name: string
          created_at: string
          deleted_at: string | null
          id: string
          last_activity_at: string | null
          phone_number: string
          status: Database["public"]["Enums"]["tenant_status"]
          updated_at: string
        }
        Insert: {
          business_name: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_activity_at?: string | null
          phone_number: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Update: {
          business_name?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_activity_at?: string | null
          phone_number?: string
          status?: Database["public"]["Enums"]["tenant_status"]
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          date: string
          id: string
          invoice_id: string | null
          notes: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          tenant_id: string
          type: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string | null
          notes?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_details: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          name: string | null
          phone_number: string | null
          status: string | null
          tenant_id: string | null
          total_balance: number | null
          total_invoiced: number | null
          total_paid: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_all_tenants_for_admin: {
        Args: {
          _limit?: number
          _offset?: number
          _plan?: Database["public"]["Enums"]["subscription_plan"]
          _search?: string
          _status?: Database["public"]["Enums"]["tenant_status"]
        }
        Returns: {
          business_name: string
          clients_count: number
          created_at: string
          deleted_at: string
          id: string
          last_activity_at: string
          max_clients: number
          max_users: number
          phone_number: string
          status: Database["public"]["Enums"]["tenant_status"]
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: string
          updated_at: string
          users_count: number
        }[]
      }
      get_platform_stats_admin: {
        Args: never
        Returns: {
          active_tenants: number
          enterprise_plan_tenants: number
          free_plan_tenants: number
          pro_plan_tenants: number
          suspended_tenants: number
          total_clients: number
          total_invoices: number
          total_tenants: number
          total_transactions: number
          total_users: number
        }[]
      }
      get_super_admin_audit_logs: {
        Args: {
          _action?: string
          _admin_id?: string
          _end_date?: string
          _limit?: number
          _offset?: number
          _start_date?: string
          _tenant_id?: string
        }
        Returns: {
          action: string
          admin_email: string
          admin_id: string
          created_at: string
          details: Json
          id: string
          ip_address: string
          resource_id: string
          resource_type: string
          tenant_id: string
          user_agent: string
        }[]
      }
      get_super_admin_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["super_admin_role"]
      }
      get_tenant_details_for_admin: {
        Args: { _tenant_id: string }
        Returns: {
          business_name: string
          clients_count: number
          created_at: string
          features: Json
          id: string
          invoices_count: number
          last_activity_at: string
          max_clients: number
          max_invoices_per_month: number
          max_products: number
          max_users: number
          phone_number: string
          status: Database["public"]["Enums"]["tenant_status"]
          subscription_expires_at: string
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_started_at: string
          subscription_status: string
          total_invoice_amount: number
          total_payment_amount: number
          transactions_count: number
          updated_at: string
          users_count: number
        }[]
      }
      get_tenant_feature_flags_admin: {
        Args: { _tenant_id: string }
        Returns: {
          created_at: string
          flag_name: string
          id: string
          is_enabled: boolean
          metadata: Json
          updated_at: string
        }[]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_super_admin_audit_log: {
        Args: {
          _action: string
          _admin_email: string
          _admin_id: string
          _details?: Json
          _ip_address?: string
          _resource_id?: string
          _resource_type: string
          _tenant_id?: string
          _user_agent?: string
        }
        Returns: string
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      soft_delete_tenant_admin: {
        Args: { _tenant_id: string }
        Returns: boolean
      }
      toggle_tenant_feature_flag_admin: {
        Args: { _flag_name: string; _is_enabled: boolean; _tenant_id: string }
        Returns: boolean
      }
      update_tenant_status_admin: {
        Args: {
          _new_status: Database["public"]["Enums"]["tenant_status"]
          _tenant_id: string
        }
        Returns: boolean
      }
      update_tenant_subscription_admin: {
        Args: {
          _max_clients?: number
          _max_invoices?: number
          _max_products?: number
          _max_users?: number
          _plan: Database["public"]["Enums"]["subscription_plan"]
          _tenant_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user" | "client"
      subscription_plan: "free" | "pro" | "enterprise"
      super_admin_role: "super_admin" | "support_admin"
      tenant_status: "active" | "suspended" | "pending" | "archived"
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
      app_role: ["admin", "user", "client"],
      subscription_plan: ["free", "pro", "enterprise"],
      super_admin_role: ["super_admin", "support_admin"],
      tenant_status: ["active", "suspended", "pending", "archived"],
    },
  },
} as const
