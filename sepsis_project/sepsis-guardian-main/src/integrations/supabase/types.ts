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
      appointments: {
        Row: {
          created_at: string | null
          doctor_id: string
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          scheduled_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          scheduled_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_messages: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          is_read: boolean
          message: string
          patient_id: string | null
          request_type: string | null
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          is_read?: boolean
          message: string
          patient_id?: string | null
          request_type?: string | null
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          is_read?: boolean
          message?: string
          patient_id?: string | null
          request_type?: string | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_messages_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_patient_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          doctor_id: string
          id: string
          is_active: boolean
          notes: string | null
          patient_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          doctor_id: string
          id?: string
          is_active?: boolean
          notes?: string | null
          patient_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          doctor_id?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_patient_assignments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          patient_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          patient_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          patient_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          failed_attempts: number | null
          id: string
          last_attempt_at: string | null
          locked_until: string | null
          otp_code: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          failed_attempts?: number | null
          id?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          otp_code: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          failed_attempts?: number | null
          id?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          otp_code?: string
          token?: string
          used?: boolean
        }
        Relationships: []
      }
      patients: {
        Row: {
          admission_date: string | null
          age: number
          allergies: string | null
          bilirubin: number | null
          cancer: boolean | null
          copd: boolean | null
          created_at: string
          creatinine: number | null
          current_medications: string | null
          diabetes: boolean | null
          diastolic_bp: number | null
          fio2: number | null
          gcs: number | null
          gender: string
          glucose: number | null
          heart_disease: boolean | null
          heart_rate: number | null
          hypertension: boolean | null
          id: string
          immunocompromised: boolean | null
          inr: number | null
          kidney_disease: boolean | null
          lactate: number | null
          liver_disease: boolean | null
          map_value: number | null
          ml_features: Json | null
          notes: string | null
          oxygen_support: string | null
          pao2: number | null
          patient_name: string
          phone: string | null
          platelet_count: number | null
          published_at: string | null
          published_by: string | null
          published_mortality_probability: number | null
          published_recommendations: Json | null
          published_risk_level: string | null
          published_sepsis_stage: string | null
          respiratory_rate: number | null
          sofa_score: number | null
          spo2: number | null
          status: string | null
          suspected_source: string | null
          systolic_bp: number | null
          temperature: number | null
          updated_at: string
          urine_output: number | null
          user_id: string
          vasopressor_dose: number | null
          vasopressor_flag: boolean | null
          vasopressor_type: string | null
          wbc_count: number | null
          weight: number | null
        }
        Insert: {
          admission_date?: string | null
          age: number
          allergies?: string | null
          bilirubin?: number | null
          cancer?: boolean | null
          copd?: boolean | null
          created_at?: string
          creatinine?: number | null
          current_medications?: string | null
          diabetes?: boolean | null
          diastolic_bp?: number | null
          fio2?: number | null
          gcs?: number | null
          gender: string
          glucose?: number | null
          heart_disease?: boolean | null
          heart_rate?: number | null
          hypertension?: boolean | null
          id?: string
          immunocompromised?: boolean | null
          inr?: number | null
          kidney_disease?: boolean | null
          lactate?: number | null
          liver_disease?: boolean | null
          map_value?: number | null
          ml_features?: Json | null
          notes?: string | null
          oxygen_support?: string | null
          pao2?: number | null
          patient_name: string
          phone?: string | null
          platelet_count?: number | null
          published_at?: string | null
          published_by?: string | null
          published_mortality_probability?: number | null
          published_recommendations?: Json | null
          published_risk_level?: string | null
          published_sepsis_stage?: string | null
          respiratory_rate?: number | null
          sofa_score?: number | null
          spo2?: number | null
          status?: string | null
          suspected_source?: string | null
          systolic_bp?: number | null
          temperature?: number | null
          updated_at?: string
          urine_output?: number | null
          user_id: string
          vasopressor_dose?: number | null
          vasopressor_flag?: boolean | null
          vasopressor_type?: string | null
          wbc_count?: number | null
          weight?: number | null
        }
        Update: {
          admission_date?: string | null
          age?: number
          allergies?: string | null
          bilirubin?: number | null
          cancer?: boolean | null
          copd?: boolean | null
          created_at?: string
          creatinine?: number | null
          current_medications?: string | null
          diabetes?: boolean | null
          diastolic_bp?: number | null
          fio2?: number | null
          gcs?: number | null
          gender?: string
          glucose?: number | null
          heart_disease?: boolean | null
          heart_rate?: number | null
          hypertension?: boolean | null
          id?: string
          immunocompromised?: boolean | null
          inr?: number | null
          kidney_disease?: boolean | null
          lactate?: number | null
          liver_disease?: boolean | null
          map_value?: number | null
          ml_features?: Json | null
          notes?: string | null
          oxygen_support?: string | null
          pao2?: number | null
          patient_name?: string
          phone?: string | null
          platelet_count?: number | null
          published_at?: string | null
          published_by?: string | null
          published_mortality_probability?: number | null
          published_recommendations?: Json | null
          published_risk_level?: string | null
          published_sepsis_stage?: string | null
          respiratory_rate?: number | null
          sofa_score?: number | null
          spo2?: number | null
          status?: string | null
          suspected_source?: string | null
          systolic_bp?: number | null
          temperature?: number | null
          updated_at?: string
          urine_output?: number | null
          user_id?: string
          vasopressor_dose?: number | null
          vasopressor_flag?: boolean | null
          vasopressor_type?: string | null
          wbc_count?: number | null
          weight?: number | null
        }
        Relationships: []
      }
      predictions: {
        Row: {
          confidence: number | null
          created_at: string
          feature_contributions: Json | null
          id: string
          mortality_probability: number
          patient_id: string
          predicted_by: string | null
          recommendations: Json | null
          risk_level: string
          sepsis_stage: string | null
          shap_values: Json | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          feature_contributions?: Json | null
          id?: string
          mortality_probability: number
          patient_id: string
          predicted_by?: string | null
          recommendations?: Json | null
          risk_level: string
          sepsis_stage?: string | null
          shap_values?: Json | null
        }
        Update: {
          confidence?: number | null
          created_at?: string
          feature_contributions?: Json | null
          id?: string
          mortality_probability?: number
          patient_id?: string
          predicted_by?: string | null
          recommendations?: Json | null
          risk_level?: string
          sepsis_stage?: string | null
          shap_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
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
      check_otp_lockout: {
        Args: { p_token: string }
        Returns: {
          is_locked: boolean
          locked_until: string
          remaining_attempts: number
        }[]
      }
      check_password_reset_rate_limit: {
        Args: { p_email: string }
        Returns: boolean
      }
      cleanup_expired_tokens: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_otp_failed_attempt: {
        Args: { p_token: string }
        Returns: undefined
      }
      is_doctor_assigned_to_patient: {
        Args: { p_doctor_id: string; p_patient_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor"
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
      app_role: ["patient", "doctor"],
    },
  },
} as const
