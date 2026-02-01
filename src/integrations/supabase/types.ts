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
      operations: {
        Row: {
          boleto: string
          cantidad: number | null
          chasis_motor: string | null
          cheque_transf: string | null
          cod_cliente: string | null
          created_at: string
          cta_cte: number | null
          cuota: string | null
          diferencia_cobrar: number | null
          fecha: string | null
          fecha_pago: string | null
          forma_pago: string | null
          id: string
          importe_ars: number | null
          importe_usd: number | null
          nombre_cliente: string | null
          observacion: string | null
          precio_unitario: number | null
          producto: string | null
          recibo: string | null
          saldo_final: number | null
          saldo_pesos: number | null
          tc_saldo: number | null
          tipo_cambio: number | null
          total_operacion: number | null
          updated_at: string
          usado: string | null
          valor_usado: number | null
          vendedor: string | null
          vto_cheque: string | null
        }
        Insert: {
          boleto: string
          cantidad?: number | null
          chasis_motor?: string | null
          cheque_transf?: string | null
          cod_cliente?: string | null
          created_at?: string
          cta_cte?: number | null
          cuota?: string | null
          diferencia_cobrar?: number | null
          fecha?: string | null
          fecha_pago?: string | null
          forma_pago?: string | null
          id?: string
          importe_ars?: number | null
          importe_usd?: number | null
          nombre_cliente?: string | null
          observacion?: string | null
          precio_unitario?: number | null
          producto?: string | null
          recibo?: string | null
          saldo_final?: number | null
          saldo_pesos?: number | null
          tc_saldo?: number | null
          tipo_cambio?: number | null
          total_operacion?: number | null
          updated_at?: string
          usado?: string | null
          valor_usado?: number | null
          vendedor?: string | null
          vto_cheque?: string | null
        }
        Update: {
          boleto?: string
          cantidad?: number | null
          chasis_motor?: string | null
          cheque_transf?: string | null
          cod_cliente?: string | null
          created_at?: string
          cta_cte?: number | null
          cuota?: string | null
          diferencia_cobrar?: number | null
          fecha?: string | null
          fecha_pago?: string | null
          forma_pago?: string | null
          id?: string
          importe_ars?: number | null
          importe_usd?: number | null
          nombre_cliente?: string | null
          observacion?: string | null
          precio_unitario?: number | null
          producto?: string | null
          recibo?: string | null
          saldo_final?: number | null
          saldo_pesos?: number | null
          tc_saldo?: number | null
          tipo_cambio?: number | null
          total_operacion?: number | null
          updated_at?: string
          usado?: string | null
          valor_usado?: number | null
          vendedor?: string | null
          vto_cheque?: string | null
        }
        Relationships: []
      }
      purchase_requests: {
        Row: {
          additionals: Json | null
          approval_token: string | null
          approved_at: string | null
          approved_by: string | null
          buyer_address: string | null
          buyer_email: string | null
          buyer_id_number: string | null
          buyer_id_type: string | null
          buyer_iva_condition: string | null
          buyer_locality: string | null
          buyer_name: string
          buyer_phone: string | null
          buyer_postal_code: string | null
          created_at: string
          dollar_reference: number | null
          estimated_delivery: string | null
          final_balance: number | null
          id: string
          observations: string | null
          payment_method: string | null
          price_ars: number | null
          price_usd: number | null
          rejection_reason: string | null
          request_number: string
          status: string | null
          supervisor_email: string | null
          total_additionals: number | null
          total_used: number | null
          unit_bodywork: string | null
          unit_brand: string | null
          unit_condition: string | null
          unit_model: string | null
          unit_quantity: number | null
          unit_type: string | null
          unit_year: string | null
          updated_at: string
          used_units: Json | null
          user_id: string | null
        }
        Insert: {
          additionals?: Json | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_id_number?: string | null
          buyer_id_type?: string | null
          buyer_iva_condition?: string | null
          buyer_locality?: string | null
          buyer_name: string
          buyer_phone?: string | null
          buyer_postal_code?: string | null
          created_at?: string
          dollar_reference?: number | null
          estimated_delivery?: string | null
          final_balance?: number | null
          id?: string
          observations?: string | null
          payment_method?: string | null
          price_ars?: number | null
          price_usd?: number | null
          rejection_reason?: string | null
          request_number: string
          status?: string | null
          supervisor_email?: string | null
          total_additionals?: number | null
          total_used?: number | null
          unit_bodywork?: string | null
          unit_brand?: string | null
          unit_condition?: string | null
          unit_model?: string | null
          unit_quantity?: number | null
          unit_type?: string | null
          unit_year?: string | null
          updated_at?: string
          used_units?: Json | null
          user_id?: string | null
        }
        Update: {
          additionals?: Json | null
          approval_token?: string | null
          approved_at?: string | null
          approved_by?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_id_number?: string | null
          buyer_id_type?: string | null
          buyer_iva_condition?: string | null
          buyer_locality?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          buyer_postal_code?: string | null
          created_at?: string
          dollar_reference?: number | null
          estimated_delivery?: string | null
          final_balance?: number | null
          id?: string
          observations?: string | null
          payment_method?: string | null
          price_ars?: number | null
          price_usd?: number | null
          rejection_reason?: string | null
          request_number?: string
          status?: string | null
          supervisor_email?: string | null
          total_additionals?: number | null
          total_used?: number | null
          unit_bodywork?: string | null
          unit_brand?: string | null
          unit_condition?: string | null
          unit_model?: string | null
          unit_quantity?: number | null
          unit_type?: string | null
          unit_year?: string | null
          updated_at?: string
          used_units?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
