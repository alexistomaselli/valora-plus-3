export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      analysis: {
        Row: {
          analysis_date: string
          created_at: string | null
          id: string
          pdf_filename: string | null
          pdf_url: string | null
          status: string
          updated_at: string | null
          user_id: string
          workshop_id: string | null
          valuation_date: string | null
        }
        Insert: {
          analysis_date?: string
          created_at?: string | null
          id?: string
          pdf_filename?: string | null
          pdf_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
          workshop_id?: string | null
          valuation_date?: string | null
        }
        Update: {
          analysis_date?: string
          created_at?: string | null
          id?: string
          pdf_filename?: string | null
          pdf_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
          workshop_id?: string | null
          valuation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_amounts: {
        Row: {
          analysis_id: string
          bodywork_labor_eur: number | null
          bodywork_labor_ut: number | null
          created_at: string | null
          id: string
          iva_amount: number | null
          iva_percentage: number | null
          net_subtotal: number | null
          paint_material_eur: number | null
          painting_labor_eur: number | null
          painting_labor_ut: number | null
          total_spare_parts_eur: number | null
          total_with_iva: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_id: string
          bodywork_labor_eur?: number | null
          bodywork_labor_ut?: number | null
          created_at?: string | null
          id?: string
          iva_amount?: number | null
          iva_percentage?: number | null
          net_subtotal?: number | null
          paint_material_eur?: number | null
          painting_labor_eur?: number | null
          painting_labor_ut?: number | null
          total_spare_parts_eur?: number | null
          total_with_iva?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_id?: string
          bodywork_labor_eur?: number | null
          bodywork_labor_ut?: number | null
          created_at?: string | null
          id?: string
          iva_amount?: number | null
          iva_percentage?: number | null
          net_subtotal?: number | null
          paint_material_eur?: number | null
          painting_labor_eur?: number | null
          painting_labor_ut?: number | null
          total_spare_parts_eur?: number | null
          total_with_iva?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_amounts_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          role: string
          updated_at: string
          workshop_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          role: string
          updated_at?: string
          workshop_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
          workshop_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_data: {
        Row: {
          analysis_id: string
          created_at: string | null
          hourly_price: number | null
          id: string
          internal_reference: string | null
          license_plate: string | null
          manufacturer: string | null
          model: string | null
          system: string | null
          updated_at: string | null
          vin: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          hourly_price?: number | null
          id?: string
          internal_reference?: string | null
          license_plate?: string | null
          manufacturer?: string | null
          model?: string | null
          system?: string | null
          updated_at?: string | null
          vin?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          hourly_price?: number | null
          id?: string
          internal_reference?: string | null
          license_plate?: string | null
          manufacturer?: string | null
          model?: string | null
          system?: string | null
          updated_at?: string | null
          vin?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_data_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_costs: {
        Row: {
          analysis_id: string
          bodywork_actual_hours: number | null
          bodywork_hourly_cost: number | null
          created_at: string | null
          id: string
          notes: string | null
          other_costs: number | null
          painting_actual_hours: number | null
          painting_consumables_cost: number | null
          painting_hourly_cost: number | null
          spare_parts_purchase_cost: number | null
          subcontractor_costs: number | null
          updated_at: string | null
        }
        Insert: {
          analysis_id: string
          bodywork_actual_hours?: number | null
          bodywork_hourly_cost?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          other_costs?: number | null
          painting_actual_hours?: number | null
          painting_consumables_cost?: number | null
          painting_hourly_cost?: number | null
          spare_parts_purchase_cost?: number | null
          subcontractor_costs?: number | null
          updated_at?: string | null
        }
        Update: {
          analysis_id?: string
          bodywork_actual_hours?: number | null
          bodywork_hourly_cost?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          other_costs?: number | null
          painting_actual_hours?: number | null
          painting_consumables_cost?: number | null
          painting_hourly_cost?: number | null
          spare_parts_purchase_cost?: number | null
          subcontractor_costs?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workshop_costs_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analysis"
            referencedColumns: ["id"]
          },
        ]
      }
      workshops: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_user_registration: {
        Args: { user_id: string; user_phone?: string; workshop_id: string }
        Returns: undefined
      }
      handle_workshop_registration: {
        Args: {
          workshop_email: string
          workshop_name: string
          workshop_phone?: string
        }
        Returns: string
      }
      is_admin_user: {
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
