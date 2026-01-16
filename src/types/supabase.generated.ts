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
      inventory_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          sequence: number | null
          shop_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          sequence?: number | null
          shop_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          sequence?: number | null
          shop_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_count_items: {
        Row: {
          actual_count: number | null
          count_id: string
          created_at: string | null
          created_by: string | null
          expected_count: number | null
          id: string
          item_id: string
          item_name: string
          notes: string | null
          updated_at: string | null
          updated_by: string | null
          variance: number | null
        }
        Insert: {
          actual_count?: number | null
          count_id: string
          created_at?: string | null
          created_by?: string | null
          expected_count?: number | null
          id?: string
          item_id: string
          item_name: string
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
        }
        Update: {
          actual_count?: number | null
          count_id?: string
          created_at?: string | null
          created_by?: string | null
          expected_count?: number | null
          id?: string
          item_id?: string
          item_name?: string
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          count_date: string
          count_type: string | null
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          shop_id: string
          status: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          count_date: string
          count_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          shop_id: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          count_date?: string
          count_type?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          shop_id?: string
          status?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          base_uom: string
          category_id: string | null
          cost_of_qty_received_to_date: number | null
          created_at: string | null
          created_by: string | null
          current_count: number | null
          description: string | null
          id: string
          name: string
          notes: string | null
          qty_received_to_date: number | null
          reorder_level: number | null
          shop_id: string
          unit_cost: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          base_uom?: string
          category_id?: string | null
          cost_of_qty_received_to_date?: number | null
          created_at?: string | null
          created_by?: string | null
          current_count?: number | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          qty_received_to_date?: number | null
          reorder_level?: number | null
          shop_id: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          base_uom?: string
          category_id?: string | null
          cost_of_qty_received_to_date?: number | null
          created_at?: string | null
          created_by?: string | null
          current_count?: number | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          qty_received_to_date?: number | null
          reorder_level?: number | null
          shop_id?: string
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          adjustment_reason_code: string | null
          adjustment_reason_other: string | null
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string
          item_name: string
          notes: string | null
          package_cost_per_unit: number | null
          package_quantity: number | null
          package_size_id: string | null
          quantity_in: number | null
          quantity_out: number | null
          reference: string | null
          shop_id: string
          supplier: string | null
          transaction_on: string | null
          transaction_type: string | null
          unit_cost: number | null
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          adjustment_reason_code?: string | null
          adjustment_reason_other?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id: string
          item_name: string
          notes?: string | null
          package_cost_per_unit?: number | null
          package_quantity?: number | null
          package_size_id?: string | null
          quantity_in?: number | null
          quantity_out?: number | null
          reference?: string | null
          shop_id: string
          supplier?: string | null
          transaction_on?: string | null
          transaction_type?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          adjustment_reason_code?: string | null
          adjustment_reason_other?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string
          item_name?: string
          notes?: string | null
          package_cost_per_unit?: number | null
          package_quantity?: number | null
          package_size_id?: string | null
          quantity_in?: number | null
          quantity_out?: number | null
          reference?: string | null
          shop_id?: string
          supplier?: string | null
          transaction_on?: string | null
          transaction_type?: string | null
          unit_cost?: number | null
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_package_size_id_fkey"
            columns: ["package_size_id"]
            isOneToOne: false
            referencedRelation: "package_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      modifier_groups: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_required: boolean
          max_select: number | null
          min_select: number
          name: string
          sequence: number
          shop_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          max_select?: number | null
          min_select?: number
          name: string
          sequence?: number
          shop_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_required?: boolean
          max_select?: number | null
          min_select?: number
          name?: string
          sequence?: number
          shop_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          created_at: string
          created_by: string | null
          default_price_adjustment: number
          id: string
          inventory_item_id: string | null
          is_default: boolean
          modifier_group_id: string
          name: string
          quantity: number
          sequence: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_price_adjustment?: number
          id?: string
          inventory_item_id?: string | null
          is_default?: boolean
          modifier_group_id: string
          name: string
          quantity?: number
          sequence?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_price_adjustment?: number
          id?: string
          inventory_item_id?: string | null
          is_default?: boolean
          modifier_group_id?: string
          name?: string
          quantity?: number
          sequence?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_addons: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          item_id: string | null
          name: string
          order_item_id: string
          price: number | null
          quantity: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          name: string
          order_item_id: string
          price?: number | null
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          item_id?: string | null
          name?: string
          order_item_id?: string
          price?: number | null
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_addons_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_item_modifiers: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          inventory_item_id: string | null
          modifier_group_id: string
          modifier_group_name: string
          modifier_id: string
          modifier_name: string
          order_item_id: string
          price_adjustment: number | null
          quantity: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          modifier_group_id: string
          modifier_group_name: string
          modifier_id: string
          modifier_name: string
          order_item_id: string
          price_adjustment?: number | null
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          modifier_group_id?: string
          modifier_group_name?: string
          modifier_id?: string
          modifier_name?: string
          order_item_id?: string
          price_adjustment?: number | null
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_item_modifiers_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          order_id: string
          product_category: string | null
          product_description: string | null
          product_id: string | null
          product_name: string
          product_unit_price: number
          quantity: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_id: string
          product_category?: string | null
          product_description?: string | null
          product_id?: string | null
          product_name: string
          product_unit_price: number
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          order_id?: string
          product_category?: string | null
          product_description?: string | null
          product_id?: string | null
          product_name?: string
          product_unit_price?: number
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          created_by: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_reference: string | null
          dispatched_by_id: string | null
          id: string
          order_date: string | null
          payment_amount_received: number | null
          payment_change: number | null
          payment_received: boolean | null
          payment_type_id: string | null
          served_by_id: string | null
          shop_id: string
          total_sale: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_reference?: string | null
          dispatched_by_id?: string | null
          id?: string
          order_date?: string | null
          payment_amount_received?: number | null
          payment_change?: number | null
          payment_received?: boolean | null
          payment_type_id?: string | null
          served_by_id?: string | null
          shop_id: string
          total_sale?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_reference?: string | null
          dispatched_by_id?: string | null
          id?: string
          order_date?: string | null
          payment_amount_received?: number | null
          payment_change?: number | null
          payment_received?: boolean | null
          payment_type_id?: string | null
          served_by_id?: string | null
          shop_id?: string
          total_sale?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_payment_type_id_fkey"
            columns: ["payment_type_id"]
            isOneToOne: false
            referencedRelation: "payment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      package_sizes: {
        Row: {
          cost_per_package: number | null
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          item_id: string
          package_name: string
          package_uom: string
          sequence: number | null
          shop_id: string
          units_per_package: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          cost_per_package?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          item_id: string
          package_name: string
          package_uom: string
          sequence?: number | null
          shop_id: string
          units_per_package: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          cost_per_package?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          item_id?: string
          package_name?: string
          package_uom?: string
          sequence?: number | null
          shop_id?: string
          units_per_package?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "package_sizes_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_sizes_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_types: {
        Row: {
          code: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          shop_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          shop_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          shop_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_types_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      product_addons: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          inventory_item_id: string | null
          item_cost: number | null
          item_name: string | null
          name: string
          price: number | null
          product_id: string
          quantity: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_cost?: number | null
          item_name?: string | null
          name: string
          price?: number | null
          product_id: string
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_cost?: number | null
          item_name?: string | null
          name?: string
          price?: number | null
          product_id?: string
          quantity?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_addons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          sequence: number | null
          shop_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          sequence?: number | null
          shop_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          sequence?: number | null
          shop_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      product_items: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          inventory_item_id: string | null
          item_name: string
          product_id: string
          quantity: number | null
          unit_cost: number | null
          uom: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name: string
          product_id: string
          quantity?: number | null
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_name?: string
          product_id?: string
          quantity?: number | null
          unit_cost?: number | null
          uom?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_items_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_group_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          modifier_group_id: string
          product_id: string
          sequence: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          modifier_group_id: string
          product_id: string
          sequence?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          modifier_group_id?: string
          product_id?: string
          sequence?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_group_links_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_group_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_required: boolean | null
          max_select: number | null
          min_select: number | null
          name: string
          product_id: string
          sequence: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_select?: number | null
          min_select?: number | null
          name: string
          product_id: string
          sequence?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_required?: boolean | null
          max_select?: number | null
          min_select?: number | null
          name?: string
          product_id?: string
          sequence?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifier_price_overrides: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          modifier_id: string
          price_adjustment: number
          product_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          modifier_id: string
          price_adjustment: number
          product_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          modifier_id?: string
          price_adjustment?: number
          product_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_price_overrides_modifier_id_fkey"
            columns: ["modifier_id"]
            isOneToOne: false
            referencedRelation: "modifiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_price_overrides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_modifiers: {
        Row: {
          created_at: string | null
          id: string
          inventory_item_id: string | null
          is_default: boolean | null
          modifier_group_id: string
          name: string
          price_adjustment: number | null
          quantity: number | null
          sequence: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          is_default?: boolean | null
          modifier_group_id: string
          name: string
          price_adjustment?: number | null
          quantity?: number | null
          sequence?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          inventory_item_id?: string | null
          is_default?: boolean | null
          modifier_group_id?: string
          name?: string
          price_adjustment?: number | null
          quantity?: number | null
          sequence?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_modifiers_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifiers_modifier_group_id_fkey"
            columns: ["modifier_group_id"]
            isOneToOne: false
            referencedRelation: "product_modifier_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number | null
          remarks: string | null
          shop_id: string
          tags: string[] | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number | null
          remarks?: string | null
          shop_id: string
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number | null
          remarks?: string | null
          shop_id?: string
          tags?: string[] | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          role: string | null
          shop_id: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          role?: string | null
          shop_id: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          role?: string | null
          shop_id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_users_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          created_at: string | null
          created_by: string | null
          currency_code: string | null
          description: string | null
          id: string
          image_url: string | null
          location: string | null
          name: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency_code?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          location?: string | null
          name?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          display_name: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_shop_admin: { Args: { check_shop_id: string }; Returns: boolean }
      is_shop_owner: { Args: { check_shop_id: string }; Returns: boolean }
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
