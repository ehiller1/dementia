export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      archetypes: {
        Row: {
          attributes: Json | null
          created_at: string
          description: string
          id: string
          name: string
          prompts: Json | null
          type: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          description: string
          id?: string
          name: string
          prompts?: Json | null
          type: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          prompts?: Json | null
          type?: string
        }
        Relationships: []
      }
      card_categories: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          is_formal: boolean
          name: string
          updated_at: string
        }
        Insert: {
          color: string
          created_at?: string
          description?: string | null
          id?: string
          is_formal?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          is_formal?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_connections: {
        Row: {
          bidirectional: boolean
          created_at: string
          id: string
          relationship_type: string
          source_card_id: string
          strength: number
          target_card_id: string
          updated_at: string
        }
        Insert: {
          bidirectional?: boolean
          created_at?: string
          id?: string
          relationship_type: string
          source_card_id: string
          strength: number
          target_card_id: string
          updated_at?: string
        }
        Update: {
          bidirectional?: boolean
          created_at?: string
          id?: string
          relationship_type?: string
          source_card_id?: string
          strength?: number
          target_card_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_connections_source_card_id_fkey"
            columns: ["source_card_id"]
            isOneToOne: false
            referencedRelation: "implementation_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "card_connections_target_card_id_fkey"
            columns: ["target_card_id"]
            isOneToOne: false
            referencedRelation: "implementation_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      card_conversations: {
        Row: {
          card_id: string
          content: string
          conversation_type: string
          id: string
          sender: string
          timestamp: string
        }
        Insert: {
          card_id: string
          content: string
          conversation_type: string
          id?: string
          sender: string
          timestamp?: string
        }
        Update: {
          card_id?: string
          content?: string
          conversation_type?: string
          id?: string
          sender?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_conversations_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "implementation_cards"
            referencedColumns: ["id"]
          },
        ]
      }
      church_avatars: {
        Row: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data: Json | null
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          avatar_name?: string
          avatar_point_of_view?: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      church_data: {
        Row: {
          church_id: string | null
          created_at: string
          data_type: string | null
          file_name: string | null
          file_path: string | null
          file_type: string | null
          upload_date: string | null
          UUID: string | null
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          data_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          upload_date?: string | null
          UUID?: string | null
        }
        Update: {
          church_id?: string | null
          created_at?: string
          data_type?: string | null
          file_name?: string | null
          file_path?: string | null
          file_type?: string | null
          upload_date?: string | null
          UUID?: string | null
        }
        Relationships: []
      }
      church_profile: {
        Row: {
          accomplish: string | null
          church_id: string | null
          community_description: string | null
          created_at: string
          dream: string | null
          id: number
          name: string | null
          number_of_active_members: number | null
          number_of_pledging_members: number | null
          parochial_report: string | null
        }
        Insert: {
          accomplish?: string | null
          church_id?: string | null
          community_description?: string | null
          created_at?: string
          dream?: string | null
          id?: number
          name?: string | null
          number_of_active_members?: number | null
          number_of_pledging_members?: number | null
          parochial_report?: string | null
        }
        Update: {
          accomplish?: string | null
          church_id?: string | null
          community_description?: string | null
          created_at?: string
          dream?: string | null
          id?: number
          name?: string | null
          number_of_active_members?: number | null
          number_of_pledging_members?: number | null
          parochial_report?: string | null
        }
        Relationships: []
      }
      community_avatars: {
        Row: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data: Json | null
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          avatar_name: string
          avatar_point_of_view: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          avatar_name?: string
          avatar_point_of_view?: string
          avatar_structured_data?: Json | null
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      community_research: {
        Row: {
          church_id: string | null
          created_at: string | null
          id: string
          notes: string
          updated_at: string | null
        }
        Insert: {
          church_id?: string | null
          created_at?: string | null
          id?: string
          notes: string
          updated_at?: string | null
        }
        Update: {
          church_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      Companion: {
        Row: {
          avatar_url: string | null
          companion: string | null
          companion_type: string | null
          knowledge_domains: string | null
          memory_threshold: string | null
          speech_pattern: string | null
          traits: string | null
          UUID: number
        }
        Insert: {
          avatar_url?: string | null
          companion?: string | null
          companion_type?: string | null
          knowledge_domains?: string | null
          memory_threshold?: string | null
          speech_pattern?: string | null
          traits?: string | null
          UUID: number
        }
        Update: {
          avatar_url?: string | null
          companion?: string | null
          companion_type?: string | null
          knowledge_domains?: string | null
          memory_threshold?: string | null
          speech_pattern?: string | null
          traits?: string | null
          UUID?: number
        }
        Relationships: []
      }
      Companion_parish: {
        Row: {
          avatar_url: string | null
          companion: string | null
          companion_type: string | null
          knowledge_domains: string | null
          memory_threshold: string | null
          speech_pattern: string | null
          traits: string | null
          UUID: string | null
        }
        Insert: {
          avatar_url?: string | null
          companion?: string | null
          companion_type?: string | null
          knowledge_domains?: string | null
          memory_threshold?: string | null
          speech_pattern?: string | null
          traits?: string | null
          UUID?: string | null
        }
        Update: {
          avatar_url?: string | null
          companion?: string | null
          companion_type?: string | null
          knowledge_domains?: string | null
          memory_threshold?: string | null
          speech_pattern?: string | null
          traits?: string | null
          UUID?: string | null
        }
        Relationships: []
      }
      compliance_violations: {
        Row: {
          detected_at: string | null
          id: string
          investment_id: string | null
          investor_id: string | null
          ministry_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          status: string | null
          violation_description: string
          violation_type: string
        }
        Insert: {
          detected_at?: string | null
          id?: string
          investment_id?: string | null
          investor_id?: string | null
          ministry_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          violation_description: string
          violation_type: string
        }
        Update: {
          detected_at?: string | null
          id?: string
          investment_id?: string | null
          investor_id?: string | null
          ministry_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          status?: string | null
          violation_description?: string
          violation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_violations_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_violations_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_history: {
        Row: {
          church_id: string | null
          conversation_history: Json | null
          conversation_page: string | null
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          church_id?: string | null
          conversation_history?: Json | null
          conversation_page?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          church_id?: string | null
          conversation_history?: Json | null
          conversation_page?: string | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      implementation_cards: {
        Row: {
          attributes: Json | null
          category_ids: string[] | null
          created_at: string
          description: string
          id: string
          name: string
          narrative_summary: string | null
          participants: number | null
          personality_POV: string | null
          position: Json | null
          response_themes: string | null
          type: string
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          category_ids?: string[] | null
          created_at?: string
          description: string
          id?: string
          name: string
          narrative_summary?: string | null
          participants?: number | null
          personality_POV?: string | null
          position?: Json | null
          response_themes?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          category_ids?: string[] | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          narrative_summary?: string | null
          participants?: number | null
          personality_POV?: string | null
          position?: Json | null
          response_themes?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      investment_holding_periods: {
        Row: {
          can_transfer: boolean | null
          created_at: string | null
          holding_end_date: string
          holding_start_date: string
          id: string
          investment_id: string | null
          transfer_restrictions: Json | null
        }
        Insert: {
          can_transfer?: boolean | null
          created_at?: string | null
          holding_end_date: string
          holding_start_date: string
          id?: string
          investment_id?: string | null
          transfer_restrictions?: Json | null
        }
        Update: {
          can_transfer?: boolean | null
          created_at?: string | null
          holding_end_date?: string
          holding_start_date?: string
          id?: string
          investment_id?: string | null
          transfer_restrictions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_holding_periods_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_data: Json | null
          interaction_type: string
          investment_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          investment_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          investment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_interactions_investment_id_fkey"
            columns: ["investment_id"]
            isOneToOne: false
            referencedRelation: "investments"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_limits: {
        Row: {
          calculation_basis: Json | null
          created_at: string | null
          effective_date: string | null
          expires_date: string | null
          id: string
          investor_id: string | null
          limit_amount: number
          limit_type: string
        }
        Insert: {
          calculation_basis?: Json | null
          created_at?: string | null
          effective_date?: string | null
          expires_date?: string | null
          id?: string
          investor_id?: string | null
          limit_amount: number
          limit_type: string
        }
        Update: {
          calculation_basis?: Json | null
          created_at?: string | null
          effective_date?: string | null
          expires_date?: string | null
          id?: string
          investor_id?: string | null
          limit_amount?: number
          limit_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_limits_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investments: {
        Row: {
          amount: number
          created_at: string
          id: string
          invested_at: string
          investor_id: string
          ministry_id: string
          payment_method: string
          status: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invested_at?: string
          investor_id: string
          ministry_id: string
          payment_method: string
          status?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invested_at?: string
          investor_id?: string
          ministry_id?: string
          payment_method?: string
          status?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investments_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investments_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_compliance: {
        Row: {
          annual_income: number | null
          compliance_status: string | null
          created_at: string | null
          id: string
          investment_limit: number
          investor_id: string | null
          kyc_documents: Json | null
          last_updated: string | null
          net_worth: number | null
          verification_date: string | null
          ytd_invested: number | null
        }
        Insert: {
          annual_income?: number | null
          compliance_status?: string | null
          created_at?: string | null
          id?: string
          investment_limit: number
          investor_id?: string | null
          kyc_documents?: Json | null
          last_updated?: string | null
          net_worth?: number | null
          verification_date?: string | null
          ytd_invested?: number | null
        }
        Update: {
          annual_income?: number | null
          compliance_status?: string | null
          created_at?: string | null
          id?: string
          investment_limit?: number
          investor_id?: string | null
          kyc_documents?: Json | null
          last_updated?: string | null
          net_worth?: number | null
          verification_date?: string | null
          ytd_invested?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_compliance_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          active_investments: number
          address: Json | null
          created_at: string
          email: string
          full_name: string
          id: string
          investor_type: string
          is_accredited: boolean
          kyc_status: string
          phone: string | null
          total_invested: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          active_investments?: number
          address?: Json | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          investor_type?: string
          is_accredited?: boolean
          kyc_status?: string
          phone?: string | null
          total_invested?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          active_investments?: number
          address?: Json | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          investor_type?: string
          is_accredited?: boolean
          kyc_status?: string
          phone?: string | null
          total_invested?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      message_history: {
        Row: {
          created_at: string
          id: number
          message_date: string | null
          message_history: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          message_date?: string | null
          message_history?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          message_date?: string | null
          message_history?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          order: number
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          order: number
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          order?: number
          role?: string
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
      ministries: {
        Row: {
          campaign_end_date: string
          campaign_start_date: string
          church_name: string
          created_at: string
          current_amount: number
          description: string
          diocese: string | null
          id: string
          impact_metrics: Json | null
          location: string | null
          media_urls: string[] | null
          minimum_investment: number
          mission_statement: string
          status: string
          target_amount: number
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          campaign_end_date: string
          campaign_start_date?: string
          church_name: string
          created_at?: string
          current_amount?: number
          description: string
          diocese?: string | null
          id?: string
          impact_metrics?: Json | null
          location?: string | null
          media_urls?: string[] | null
          minimum_investment: number
          mission_statement: string
          status?: string
          target_amount: number
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          campaign_end_date?: string
          campaign_start_date?: string
          church_name?: string
          created_at?: string
          current_amount?: number
          description?: string
          diocese?: string | null
          id?: string
          impact_metrics?: Json | null
          location?: string | null
          media_urls?: string[] | null
          minimum_investment?: number
          mission_statement?: string
          status?: string
          target_amount?: number
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ministry_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          media_urls: string[] | null
          ministry_id: string
          title: string
          update_type: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          ministry_id: string
          title: string
          update_type?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          media_urls?: string[] | null
          ministry_id?: string
          title?: string
          update_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ministry_updates_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      narrative_avatars: {
        Row: {
          avatar_name: string
          avatar_point_of_view: string
          created_at: string
          id: string
          image_url: string | null
        }
        Insert: {
          avatar_name: string
          avatar_point_of_view: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Update: {
          avatar_name?: string
          avatar_point_of_view?: string
          created_at?: string
          id?: string
          image_url?: string | null
        }
        Relationships: []
      }
      network_connections: {
        Row: {
          church_id: string | null
          church_similarity_data: Json
          community_similarity_data: Json
          created_at: string
          id: string
          plan_similarity_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          church_id?: string | null
          church_similarity_data?: Json
          community_similarity_data?: Json
          created_at?: string
          id?: string
          plan_similarity_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          church_id?: string | null
          church_similarity_data?: Json
          community_similarity_data?: Json
          created_at?: string
          id?: string
          plan_similarity_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          church_id: string | null
          church_name: string | null
          city: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          role: string | null
          state: string | null
        }
        Insert: {
          address?: string | null
          church_id?: string | null
          church_name?: string | null
          city?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          state?: string | null
        }
        Update: {
          address?: string | null
          church_id?: string | null
          church_name?: string | null
          city?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          role?: string | null
          state?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          prompt: string
          prompt_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt: string
          prompt_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt?: string
          prompt_type?: string
        }
        Relationships: []
      }
      research_categories: {
        Row: {
          category_group: string
          created_at: string
          id: string
          label: string
          page_type: string
          search_prompt: string
          updated_at: string
        }
        Insert: {
          category_group: string
          created_at?: string
          id?: string
          label: string
          page_type: string
          search_prompt: string
          updated_at?: string
        }
        Update: {
          category_group?: string
          created_at?: string
          id?: string
          label?: string
          page_type?: string
          search_prompt?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_library: {
        Row: {
          church_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          resource_type: string | null
          scenario_title: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          church_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          resource_type?: string | null
          scenario_title?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          church_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          resource_type?: string | null
          scenario_title?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      scenarios: {
        Row: {
          church_id: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      scenarios_avatar_mapping: {
        Row: {
          avatar_id: string
          avatar_type: string
          created_at: string
          id: string
          scenario_id: string
        }
        Insert: {
          avatar_id: string
          avatar_type: string
          created_at?: string
          id?: string
          scenario_id: string
        }
        Update: {
          avatar_id?: string
          avatar_type?: string
          created_at?: string
          id?: string
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenarios_avatar_mapping_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      sec_filings: {
        Row: {
          compliance_notes: string | null
          created_at: string | null
          filing_data: Json
          filing_date: string | null
          filing_status: string | null
          filing_type: string
          id: string
          ministry_id: string | null
          required_documents: Json | null
          submission_id: string | null
          updated_at: string | null
        }
        Insert: {
          compliance_notes?: string | null
          created_at?: string | null
          filing_data?: Json
          filing_date?: string | null
          filing_status?: string | null
          filing_type: string
          id?: string
          ministry_id?: string | null
          required_documents?: Json | null
          submission_id?: string | null
          updated_at?: string | null
        }
        Update: {
          compliance_notes?: string | null
          created_at?: string | null
          filing_data?: Json
          filing_date?: string | null
          filing_status?: string | null
          filing_type?: string
          id?: string
          ministry_id?: string | null
          required_documents?: Json | null
          submission_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sec_filings_ministry_id_fkey"
            columns: ["ministry_id"]
            isOneToOne: false
            referencedRelation: "ministries"
            referencedColumns: ["id"]
          },
        ]
      }
      section_avatars: {
        Row: {
          avatar_url: string | null
          created_at: string
          description: string | null
          id: string
          initial_message: string
          name: string
          page: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_message: string
          name: string
          page: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          initial_message?: string
          name?: string
          page?: string
          updated_at?: string
        }
        Relationships: []
      }
      survey: {
        Row: {
          church_id: number | null
          created_at: string
          id: number
          survey: Json | null
        }
        Insert: {
          church_id?: number | null
          created_at?: string
          id?: number
          survey?: Json | null
        }
        Update: {
          church_id?: number | null
          created_at?: string
          id?: number
          survey?: Json | null
        }
        Relationships: []
      }
      survey_responses: {
        Row: {
          created_at: string | null
          id: string
          question_id: string
          response: Json
          updated_at: string | null
          user_survey_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id: string
          response: Json
          updated_at?: string | null
          user_survey_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string
          response?: Json
          updated_at?: string | null
          user_survey_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_user_survey_id_fkey"
            columns: ["user_survey_id"]
            isOneToOne: false
            referencedRelation: "user_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_surveys: {
        Row: {
          completed_at: string | null
          id: string
          started_at: string | null
          status: string
          survey_template_id: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          survey_template_id?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          survey_template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_surveys_survey_template_id_fkey"
            columns: ["survey_template_id"]
            isOneToOne: false
            referencedRelation: "survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authenticate_and_get_profile: {
        Args: { user_email: string; password: string }
        Returns: {
          user_id: string
          username: string
          bio: string
        }[]
      }
      calculate_investment_limit: {
        Args: { annual_income: number; net_worth: number }
        Returns: number
      }
      check_investment_compliance: {
        Args: { p_investor_id: string; p_investment_amount: number }
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
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
