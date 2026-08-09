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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      acc_accountant_invites: {
        Row: {
          accepted_at: string | null
          accepted_user_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_accountant_invites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_accounting_periods: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          created_at: string
          end_date: string
          id: string
          org_id: string
          start_date: string
          status: Database["public"]["Enums"]["acc_period_status"]
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          org_id: string
          start_date: string
          status?: Database["public"]["Enums"]["acc_period_status"]
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          org_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["acc_period_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_accounting_periods_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_ap_bill_lines: {
        Row: {
          bill_id: string
          created_at: string
          description: string
          expense_account_id: string | null
          id: string
          line_no: number
          line_subtotal: number
          line_tax: number
          line_total: number
          quantity: number
          tax_rate: number
          unit_price: number
        }
        Insert: {
          bill_id: string
          created_at?: string
          description: string
          expense_account_id?: string | null
          id?: string
          line_no: number
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          bill_id?: string
          created_at?: string
          description?: string
          expense_account_id?: string | null
          id?: string
          line_no?: number
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          quantity?: number
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "acc_ap_bill_lines_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "acc_ap_aging"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "acc_ap_bill_lines_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "acc_ap_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_bill_lines_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_bill_lines_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      acc_ap_bills: {
        Row: {
          amount_paid: number
          bill_date: string
          bill_number: string
          created_at: string
          created_by: string | null
          currency: string
          due_date: string | null
          expense_id: string | null
          id: string
          journal_entry_id: string | null
          notes: string | null
          org_id: string
          posted_at: string | null
          reversal_entry_id: string | null
          status: Database["public"]["Enums"]["acc_ap_bill_status"]
          subtotal: number
          supplier_id: string
          supplier_reference: string | null
          tax_total: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          bill_date?: string
          bill_number: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          expense_id?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          org_id: string
          posted_at?: string | null
          reversal_entry_id?: string | null
          status?: Database["public"]["Enums"]["acc_ap_bill_status"]
          subtotal?: number
          supplier_id: string
          supplier_reference?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          bill_date?: string
          bill_number?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          due_date?: string | null
          expense_id?: string | null
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          org_id?: string
          posted_at?: string | null
          reversal_entry_id?: string | null
          status?: Database["public"]["Enums"]["acc_ap_bill_status"]
          subtotal?: number
          supplier_id?: string
          supplier_reference?: string | null
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_ap_bills_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_bills_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_bills_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_bills_reversal_entry_id_fkey"
            columns: ["reversal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "acc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_ap_payments: {
        Row: {
          amount: number
          bank_account_id: string
          bill_id: string
          created_at: string
          created_by: string | null
          id: string
          journal_entry_id: string | null
          method: string | null
          org_id: string
          payment_date: string
          posted_at: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          bill_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          method?: string | null
          org_id: string
          payment_date?: string
          posted_at?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          bill_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          journal_entry_id?: string | null
          method?: string | null
          org_id?: string
          payment_date?: string
          posted_at?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_ap_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_ap_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "acc_ap_aging"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "acc_ap_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "acc_ap_bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_ar_invoice_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          invoice_id: string
          line_no: number
          line_subtotal: number
          line_tax: number
          line_total: number
          quantity: number
          revenue_account_id: string | null
          tax_rate: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          line_no: number
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          quantity?: number
          revenue_account_id?: string | null
          tax_rate?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          line_no?: number
          line_subtotal?: number
          line_tax?: number
          line_total?: number
          quantity?: number
          revenue_account_id?: string | null
          tax_rate?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "acc_ar_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "acc_ar_aging"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "acc_ar_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "acc_ar_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoice_lines_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoice_lines_revenue_account_id_fkey"
            columns: ["revenue_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      acc_ar_invoices: {
        Row: {
          amount_paid: number
          client_invoice_id: string | null
          created_at: string
          created_by: string | null
          crm_company_id: string | null
          crm_contact_id: string | null
          crm_opportunity_id: string | null
          currency: string
          customer_id: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_number: string
          journal_entry_id: string | null
          notes: string | null
          org_id: string
          posted_at: string | null
          reversal_entry_id: string | null
          status: Database["public"]["Enums"]["acc_ar_invoice_status"]
          subscription_site_id: string | null
          subtotal: number
          tax_total: number
          total: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          client_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          crm_contact_id?: string | null
          crm_opportunity_id?: string | null
          currency?: string
          customer_id: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number: string
          journal_entry_id?: string | null
          notes?: string | null
          org_id: string
          posted_at?: string | null
          reversal_entry_id?: string | null
          status?: Database["public"]["Enums"]["acc_ar_invoice_status"]
          subscription_site_id?: string | null
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          client_invoice_id?: string | null
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          crm_contact_id?: string | null
          crm_opportunity_id?: string | null
          currency?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          journal_entry_id?: string | null
          notes?: string | null
          org_id?: string
          posted_at?: string | null
          reversal_entry_id?: string | null
          status?: Database["public"]["Enums"]["acc_ar_invoice_status"]
          subscription_site_id?: string | null
          subtotal?: number
          tax_total?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_ar_invoices_client_invoice_id_fkey"
            columns: ["client_invoice_id"]
            isOneToOne: false
            referencedRelation: "client_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_crm_opportunity_id_fkey"
            columns: ["crm_opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_deals_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_crm_opportunity_id_fkey"
            columns: ["crm_opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "acc_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_reversal_entry_id_fkey"
            columns: ["reversal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_subscription_site_id_fkey"
            columns: ["subscription_site_id"]
            isOneToOne: false
            referencedRelation: "subscription_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_ar_payments: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string
          created_by: string | null
          crm_company_id: string | null
          id: string
          invoice_id: string
          journal_entry_id: string | null
          method: string | null
          org_id: string
          payment_date: string
          posted_at: string | null
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          id?: string
          invoice_id: string
          journal_entry_id?: string | null
          method?: string | null
          org_id: string
          payment_date?: string
          posted_at?: string | null
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          id?: string
          invoice_id?: string
          journal_entry_id?: string | null
          method?: string | null
          org_id?: string
          payment_date?: string
          posted_at?: string | null
          reference?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_ar_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_payments_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_ar_payments_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "acc_ar_aging"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "acc_ar_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "acc_ar_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_bank_accounts: {
        Row: {
          account_number_last4: string | null
          coa_account_id: string
          created_at: string
          created_by: string | null
          currency: string
          id: string
          institution: string | null
          is_active: boolean
          name: string
          notes: string | null
          opening_balance: number
          opening_balance_date: string
          org_id: string
          updated_at: string
        }
        Insert: {
          account_number_last4?: string | null
          coa_account_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          institution?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          opening_balance?: number
          opening_balance_date?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          account_number_last4?: string | null
          coa_account_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          institution?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          opening_balance?: number
          opening_balance_date?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_bank_accounts_coa_account_id_fkey"
            columns: ["coa_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_bank_accounts_coa_account_id_fkey"
            columns: ["coa_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_bank_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_bank_reconciliations: {
        Row: {
          bank_account_id: string
          closing_balance: number
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          opening_balance: number
          org_id: string
          statement_date: string
          status: Database["public"]["Enums"]["acc_reconciliation_status"]
          updated_at: string
        }
        Insert: {
          bank_account_id: string
          closing_balance: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          opening_balance: number
          org_id: string
          statement_date: string
          status?: Database["public"]["Enums"]["acc_reconciliation_status"]
          updated_at?: string
        }
        Update: {
          bank_account_id?: string
          closing_balance?: number
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          opening_balance?: number
          org_id?: string
          statement_date?: string
          status?: Database["public"]["Enums"]["acc_reconciliation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_bank_reconciliations_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "acc_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_bank_reconciliations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          created_at: string
          created_by: string | null
          description: string
          external_id: string | null
          id: string
          journal_entry_id: string | null
          org_id: string
          reconciliation_id: string | null
          reference: string | null
          running_balance: number | null
          source: string
          status: Database["public"]["Enums"]["acc_bank_txn_status"]
          txn_date: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          created_at?: string
          created_by?: string | null
          description: string
          external_id?: string | null
          id?: string
          journal_entry_id?: string | null
          org_id: string
          reconciliation_id?: string | null
          reference?: string | null
          running_balance?: number | null
          source?: string
          status?: Database["public"]["Enums"]["acc_bank_txn_status"]
          txn_date: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          external_id?: string | null
          id?: string
          journal_entry_id?: string | null
          org_id?: string
          reconciliation_id?: string | null
          reference?: string | null
          running_balance?: number | null
          source?: string
          status?: Database["public"]["Enums"]["acc_bank_txn_status"]
          txn_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "acc_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_bank_transactions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_bank_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_bank_transactions_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "acc_bank_reconciliations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_chart_of_accounts: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          parent_account_id: string | null
          subtype: string | null
          type: Database["public"]["Enums"]["acc_account_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          parent_account_id?: string | null
          subtype?: string | null
          type: Database["public"]["Enums"]["acc_account_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          parent_account_id?: string | null
          subtype?: string | null
          type?: Database["public"]["Enums"]["acc_account_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_chart_of_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      acc_customers: {
        Row: {
          billing_address: string | null
          created_at: string
          created_by: string | null
          crm_company_id: string | null
          crm_contact_id: string | null
          currency: string
          default_ar_account_id: string | null
          default_revenue_account_id: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          crm_contact_id?: string | null
          currency?: string
          default_ar_account_id?: string | null
          default_revenue_account_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          crm_contact_id?: string | null
          currency?: string
          default_ar_account_id?: string | null
          default_revenue_account_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_customers_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_customers_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_customers_default_ar_account_id_fkey"
            columns: ["default_ar_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_customers_default_ar_account_id_fkey"
            columns: ["default_ar_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_customers_default_revenue_account_id_fkey"
            columns: ["default_revenue_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_customers_default_revenue_account_id_fkey"
            columns: ["default_revenue_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_depreciation_lines: {
        Row: {
          amount: number
          asset_id: string
          book_value_after: number
          book_value_before: number
          created_at: string
          id: string
          org_id: string
          run_id: string
        }
        Insert: {
          amount?: number
          asset_id: string
          book_value_after?: number
          book_value_before?: number
          created_at?: string
          id?: string
          org_id: string
          run_id: string
        }
        Update: {
          amount?: number
          asset_id?: string
          book_value_after?: number
          book_value_before?: number
          created_at?: string
          id?: string
          org_id?: string
          run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_depreciation_lines_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "acc_fixed_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_depreciation_lines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_depreciation_lines_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "acc_depreciation_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_depreciation_runs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          journal_entry_id: string | null
          notes: string | null
          org_id: string
          period_end: string
          posted_at: string | null
          reference: string | null
          status: Database["public"]["Enums"]["acc_depreciation_run_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          org_id: string
          period_end: string
          posted_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["acc_depreciation_run_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          journal_entry_id?: string | null
          notes?: string | null
          org_id?: string
          period_end?: string
          posted_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["acc_depreciation_run_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_depreciation_runs_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_depreciation_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_employees: {
        Row: {
          bank_account_number: string | null
          bank_sort_code: string | null
          created_at: string
          created_by: string
          default_hours: number
          email: string | null
          employment_end: string | null
          employment_start: string | null
          full_name: string
          id: string
          is_active: boolean
          job_title: string | null
          ni_number: string | null
          notes: string | null
          org_id: string
          pay_rate: number
          pay_type: Database["public"]["Enums"]["acc_pay_type"]
          tax_code: string | null
          updated_at: string
        }
        Insert: {
          bank_account_number?: string | null
          bank_sort_code?: string | null
          created_at?: string
          created_by?: string
          default_hours?: number
          email?: string | null
          employment_end?: string | null
          employment_start?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          ni_number?: string | null
          notes?: string | null
          org_id: string
          pay_rate?: number
          pay_type?: Database["public"]["Enums"]["acc_pay_type"]
          tax_code?: string | null
          updated_at?: string
        }
        Update: {
          bank_account_number?: string | null
          bank_sort_code?: string | null
          created_at?: string
          created_by?: string
          default_hours?: number
          email?: string | null
          employment_end?: string | null
          employment_start?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          job_title?: string | null
          ni_number?: string | null
          notes?: string | null
          org_id?: string
          pay_rate?: number
          pay_type?: Database["public"]["Enums"]["acc_pay_type"]
          tax_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_fixed_assets: {
        Row: {
          accum_depr_account_id: string | null
          accumulated_depreciation: number
          acquisition_entry_id: string | null
          asset_account_id: string | null
          asset_tag: string | null
          category: string | null
          created_at: string
          created_by: string
          depr_expense_account_id: string | null
          depreciation_method: Database["public"]["Enums"]["acc_depreciation_method"]
          disposal_date: string | null
          disposal_entry_id: string | null
          disposal_proceeds: number | null
          id: string
          last_depreciated_on: string | null
          name: string
          notes: string | null
          org_id: string
          purchase_cost: number
          purchase_date: string
          reducing_rate_pct: number | null
          salvage_value: number
          status: Database["public"]["Enums"]["acc_fixed_asset_status"]
          updated_at: string
          useful_life_months: number
        }
        Insert: {
          accum_depr_account_id?: string | null
          accumulated_depreciation?: number
          acquisition_entry_id?: string | null
          asset_account_id?: string | null
          asset_tag?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          depr_expense_account_id?: string | null
          depreciation_method?: Database["public"]["Enums"]["acc_depreciation_method"]
          disposal_date?: string | null
          disposal_entry_id?: string | null
          disposal_proceeds?: number | null
          id?: string
          last_depreciated_on?: string | null
          name: string
          notes?: string | null
          org_id: string
          purchase_cost?: number
          purchase_date: string
          reducing_rate_pct?: number | null
          salvage_value?: number
          status?: Database["public"]["Enums"]["acc_fixed_asset_status"]
          updated_at?: string
          useful_life_months?: number
        }
        Update: {
          accum_depr_account_id?: string | null
          accumulated_depreciation?: number
          acquisition_entry_id?: string | null
          asset_account_id?: string | null
          asset_tag?: string | null
          category?: string | null
          created_at?: string
          created_by?: string
          depr_expense_account_id?: string | null
          depreciation_method?: Database["public"]["Enums"]["acc_depreciation_method"]
          disposal_date?: string | null
          disposal_entry_id?: string | null
          disposal_proceeds?: number | null
          id?: string
          last_depreciated_on?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          purchase_cost?: number
          purchase_date?: string
          reducing_rate_pct?: number | null
          salvage_value?: number
          status?: Database["public"]["Enums"]["acc_fixed_asset_status"]
          updated_at?: string
          useful_life_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "acc_fixed_assets_accum_depr_account_id_fkey"
            columns: ["accum_depr_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_accum_depr_account_id_fkey"
            columns: ["accum_depr_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_acquisition_entry_id_fkey"
            columns: ["acquisition_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_asset_account_id_fkey"
            columns: ["asset_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_depr_expense_account_id_fkey"
            columns: ["depr_expense_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_depr_expense_account_id_fkey"
            columns: ["depr_expense_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_disposal_entry_id_fkey"
            columns: ["disposal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_fixed_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_fx_rates: {
        Row: {
          created_at: string
          created_by: string | null
          from_currency: string
          id: string
          org_id: string
          rate: number
          rate_date: string
          source: string | null
          to_currency: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_currency: string
          id?: string
          org_id: string
          rate: number
          rate_date: string
          source?: string | null
          to_currency: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_currency?: string
          id?: string
          org_id?: string
          rate?: number
          rate_date?: string
          source?: string | null
          to_currency?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_fx_rates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_journal_entries: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          entry_date: string
          id: string
          is_reversal: boolean
          org_id: string
          period_id: string | null
          posted_at: string | null
          reversed_by_entry_id: string | null
          source_id: string | null
          source_ref: string | null
          source_type: Database["public"]["Enums"]["acc_source_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          entry_date: string
          id?: string
          is_reversal?: boolean
          org_id: string
          period_id?: string | null
          posted_at?: string | null
          reversed_by_entry_id?: string | null
          source_id?: string | null
          source_ref?: string | null
          source_type?: Database["public"]["Enums"]["acc_source_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          entry_date?: string
          id?: string
          is_reversal?: boolean
          org_id?: string
          period_id?: string | null
          posted_at?: string | null
          reversed_by_entry_id?: string | null
          source_id?: string | null
          source_ref?: string | null
          source_type?: Database["public"]["Enums"]["acc_source_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_journal_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_journal_entries_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "acc_accounting_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_journal_entries_reversed_by_entry_id_fkey"
            columns: ["reversed_by_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_journal_lines: {
        Row: {
          account_id: string
          client_id: string | null
          created_at: string
          credit: number
          debit: number
          id: string
          journal_entry_id: string
          memo: string | null
          tax_code: string | null
        }
        Insert: {
          account_id: string
          client_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id: string
          memo?: string | null
          tax_code?: string | null
        }
        Update: {
          account_id?: string
          client_id?: string | null
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          journal_entry_id?: string
          memo?: string | null
          tax_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_organizations: {
        Row: {
          base_currency: string
          client_team_id: string | null
          created_at: string
          fiscal_year_start: string
          id: string
          name: string
          owner_user_id: string
          tax_id: string | null
          updated_at: string
          vat_scheme: string
        }
        Insert: {
          base_currency?: string
          client_team_id?: string | null
          created_at?: string
          fiscal_year_start?: string
          id?: string
          name: string
          owner_user_id: string
          tax_id?: string | null
          updated_at?: string
          vat_scheme?: string
        }
        Update: {
          base_currency?: string
          client_team_id?: string | null
          created_at?: string
          fiscal_year_start?: string
          id?: string
          name?: string
          owner_user_id?: string
          tax_id?: string | null
          updated_at?: string
          vat_scheme?: string
        }
        Relationships: []
      }
      acc_pay_runs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          journal_entry_id: string | null
          org_id: string
          paid_at: string | null
          pay_date: string
          payment_entry_id: string | null
          period_end: string
          period_start: string
          posted_at: string | null
          reference: string | null
          status: Database["public"]["Enums"]["acc_pay_run_status"]
          total_gross: number
          total_net: number
          total_ni_ee: number
          total_ni_er: number
          total_other_ded: number
          total_paye: number
          total_pension: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          journal_entry_id?: string | null
          org_id: string
          paid_at?: string | null
          pay_date: string
          payment_entry_id?: string | null
          period_end: string
          period_start: string
          posted_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["acc_pay_run_status"]
          total_gross?: number
          total_net?: number
          total_ni_ee?: number
          total_ni_er?: number
          total_other_ded?: number
          total_paye?: number
          total_pension?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          journal_entry_id?: string | null
          org_id?: string
          paid_at?: string | null
          pay_date?: string
          payment_entry_id?: string | null
          period_end?: string
          period_start?: string
          posted_at?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["acc_pay_run_status"]
          total_gross?: number
          total_net?: number
          total_ni_ee?: number
          total_ni_er?: number
          total_other_ded?: number
          total_paye?: number
          total_pension?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_pay_runs_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_pay_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_pay_runs_payment_entry_id_fkey"
            columns: ["payment_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_payslips: {
        Row: {
          created_at: string
          employee_id: string
          gross: number
          hours: number
          id: string
          net: number
          ni_ee: number
          ni_er: number
          notes: string | null
          org_id: string
          other_ded: number
          pay_run_id: string
          paye: number
          pension: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          gross?: number
          hours?: number
          id?: string
          net?: number
          ni_ee?: number
          ni_er?: number
          notes?: string | null
          org_id: string
          other_ded?: number
          pay_run_id: string
          paye?: number
          pension?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          gross?: number
          hours?: number
          id?: string
          net?: number
          ni_ee?: number
          ni_er?: number
          notes?: string | null
          org_id?: string
          other_ded?: number
          pay_run_id?: string
          paye?: number
          pension?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "acc_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_payslips_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_payslips_pay_run_id_fkey"
            columns: ["pay_run_id"]
            isOneToOne: false
            referencedRelation: "acc_pay_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_report_recalcs: {
        Row: {
          computed_at: string
          computed_by: string | null
          duration_ms: number | null
          id: string
          org_id: string
          params: Json | null
          report_name: string
          row_count: number | null
        }
        Insert: {
          computed_at?: string
          computed_by?: string | null
          duration_ms?: number | null
          id?: string
          org_id: string
          params?: Json | null
          report_name: string
          row_count?: number | null
        }
        Update: {
          computed_at?: string
          computed_by?: string | null
          duration_ms?: number | null
          id?: string
          org_id?: string
          params?: Json | null
          report_name?: string
          row_count?: number | null
        }
        Relationships: []
      }
      acc_suppliers: {
        Row: {
          billing_address: string | null
          created_at: string
          created_by: string | null
          currency: string
          default_ap_account_id: string | null
          default_expense_account_id: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          org_id: string
          phone: string | null
          tax_number: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_ap_account_id?: string | null
          default_expense_account_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          default_ap_account_id?: string | null
          default_expense_account_id?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          tax_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_suppliers_default_ap_account_id_fkey"
            columns: ["default_ap_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_suppliers_default_ap_account_id_fkey"
            columns: ["default_ap_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_suppliers_default_expense_account_id_fkey"
            columns: ["default_expense_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_suppliers_default_expense_account_id_fkey"
            columns: ["default_expense_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "acc_suppliers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_user_roles: {
        Row: {
          can_approve_payment: boolean
          can_close_period: boolean
          can_post_journal: boolean
          can_reopen_period: boolean
          created_at: string
          id: string
          org_id: string
          role: Database["public"]["Enums"]["acc_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve_payment?: boolean
          can_close_period?: boolean
          can_post_journal?: boolean
          can_reopen_period?: boolean
          created_at?: string
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["acc_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve_payment?: boolean
          can_close_period?: boolean
          can_post_journal?: boolean
          can_reopen_period?: boolean
          created_at?: string
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["acc_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_vat_returns: {
        Row: {
          created_at: string
          created_by: string
          id: string
          input_vat: number
          net_due: number
          notes: string | null
          org_id: string
          output_vat: number
          payment_amount: number | null
          payment_date: string | null
          payment_entry_id: string | null
          period_end: string
          period_start: string
          reference: string | null
          status: Database["public"]["Enums"]["acc_vat_return_status"]
          submission_entry_id: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          id?: string
          input_vat?: number
          net_due?: number
          notes?: string | null
          org_id: string
          output_vat?: number
          payment_amount?: number | null
          payment_date?: string | null
          payment_entry_id?: string | null
          period_end: string
          period_start: string
          reference?: string | null
          status?: Database["public"]["Enums"]["acc_vat_return_status"]
          submission_entry_id?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          input_vat?: number
          net_due?: number
          notes?: string | null
          org_id?: string
          output_vat?: number
          payment_amount?: number | null
          payment_date?: string | null
          payment_entry_id?: string | null
          period_end?: string
          period_start?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["acc_vat_return_status"]
          submission_entry_id?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_vat_returns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_vat_returns_payment_entry_id_fkey"
            columns: ["payment_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_vat_returns_submission_entry_id_fkey"
            columns: ["submission_entry_id"]
            isOneToOne: false
            referencedRelation: "acc_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      account_type_presets: {
        Row: {
          account_type: string
          hidden_features: Json
          suppress_prompts: boolean
          updated_at: string
          updated_by: string | null
          visible_features: Json
        }
        Insert: {
          account_type: string
          hidden_features?: Json
          suppress_prompts?: boolean
          updated_at?: string
          updated_by?: string | null
          visible_features?: Json
        }
        Update: {
          account_type?: string
          hidden_features?: Json
          suppress_prompts?: boolean
          updated_at?: string
          updated_by?: string | null
          visible_features?: Json
        }
        Relationships: []
      }
      ad_campaigns: {
        Row: {
          campaign_name: string
          created_at: string
          creative_type: string | null
          creative_url: string | null
          id: string
          last_updated_at: string | null
          monthly_budget: number | null
          notes: string | null
          objective: string | null
          platform: string
          start_date: string | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_name: string
          created_at?: string
          creative_type?: string | null
          creative_url?: string | null
          id?: string
          last_updated_at?: string | null
          monthly_budget?: number | null
          notes?: string | null
          objective?: string | null
          platform: string
          start_date?: string | null
          status?: string
          user_id: string
        }
        Update: {
          campaign_name?: string
          created_at?: string
          creative_type?: string | null
          creative_url?: string | null
          id?: string
          last_updated_at?: string | null
          monthly_budget?: number | null
          notes?: string | null
          objective?: string | null
          platform?: string
          start_date?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_controls: {
        Row: {
          can_create_accounts: boolean
          can_manage_admins: boolean
          hidden_tabs: string[]
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          can_create_accounts?: boolean
          can_manage_admins?: boolean
          hidden_tabs?: string[]
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          can_create_accounts?: boolean
          can_manage_admins?: boolean
          hidden_tabs?: string[]
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_events: {
        Row: {
          agent: string
          event_type: string
          id: number
          payload: Json
          run_id: string | null
          ts: string
        }
        Insert: {
          agent?: string
          event_type: string
          id?: never
          payload?: Json
          run_id?: string | null
          ts?: string
        }
        Update: {
          agent?: string
          event_type?: string
          id?: never
          payload?: Json
          run_id?: string | null
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_messages: {
        Row: {
          from_agent: string
          id: string
          is_model_generated: boolean
          payload: Json
          run_id: string | null
          task_id: string | null
          template_key: string
          to_agent: string | null
          ts: string
        }
        Insert: {
          from_agent: string
          id?: string
          is_model_generated?: boolean
          payload?: Json
          run_id?: string | null
          task_id?: string | null
          template_key?: string
          to_agent?: string | null
          ts?: string
        }
        Update: {
          from_agent?: string
          id?: string
          is_model_generated?: boolean
          payload?: Json
          run_id?: string | null
          task_id?: string | null
          template_key?: string
          to_agent?: string | null
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_messages_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_publish_stage: {
        Row: {
          content_b64: string
          created_at: string
          id: number
          path: string
          request_id: number | null
          run_id: string
        }
        Insert: {
          content_b64: string
          created_at?: string
          id?: never
          path: string
          request_id?: number | null
          run_id: string
        }
        Update: {
          content_b64?: string
          created_at?: string
          id?: never
          path?: string
          request_id?: number | null
          run_id?: string
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          claimed_by_bridge: string | null
          created_at: string
          current_agent: string | null
          error_summary: string | null
          fallback_reason: string | null
          fallback_used: boolean
          finished_at: string | null
          heartbeat_at: string | null
          id: string
          model_id: string | null
          resolved_by_rung: number | null
          retry_count: number
          started_at: string | null
          status: string
          task_id: string | null
          turns_used: number
        }
        Insert: {
          claimed_by_bridge?: string | null
          created_at?: string
          current_agent?: string | null
          error_summary?: string | null
          fallback_reason?: string | null
          fallback_used?: boolean
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          model_id?: string | null
          resolved_by_rung?: number | null
          retry_count?: number
          started_at?: string | null
          status?: string
          task_id?: string | null
          turns_used?: number
        }
        Update: {
          claimed_by_bridge?: string | null
          created_at?: string
          current_agent?: string | null
          error_summary?: string | null
          fallback_reason?: string | null
          fallback_used?: boolean
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          model_id?: string | null
          resolved_by_rung?: number | null
          retry_count?: number
          started_at?: string | null
          status?: string
          task_id?: string | null
          turns_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_claimed_by_bridge_fkey"
            columns: ["claimed_by_bridge"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string | null
          authorised_by_user_id: string
          brief: string
          client_id: string | null
          created_at: string
          created_by_user_id: string
          id: string
          kind: string
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          authorised_by_user_id: string
          brief: string
          client_id?: string | null
          created_at?: string
          created_by_user_id: string
          id?: string
          kind?: string
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          authorised_by_user_id?: string
          brief?: string
          client_id?: string | null
          created_at?: string
          created_by_user_id?: string
          id?: string
          kind?: string
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "agent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_team_members: {
        Row: {
          agent_id: string
          id: string
          position: number
          team_id: string
        }
        Insert: {
          agent_id: string
          id?: string
          position?: number
          team_id: string
        }
        Update: {
          agent_id?: string
          id?: string
          position?: number
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_team_members_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "agent_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_teams: {
        Row: {
          created_at: string
          description: string
          fallback_chain: string[]
          id: string
          model_policy: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string
          fallback_chain?: string[]
          id?: string
          model_policy?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          fallback_chain?: string[]
          id?: string
          model_policy?: string | null
          name?: string
        }
        Relationships: []
      }
      agents: {
        Row: {
          avatar_colour: string
          capability: string | null
          created_at: string
          desk_position: Json | null
          fallback_chain: string[]
          floor: number
          home_room: string | null
          id: string
          is_active: boolean
          is_deterministic: boolean
          model_default: string | null
          model_escalation: string | null
          model_pin: string | null
          name: string
          role_key: string
          role_label: string
          role_prompt: string
          strict_pin: boolean
          tool_scope: Json
          weekly_budget_pct: number | null
        }
        Insert: {
          avatar_colour?: string
          capability?: string | null
          created_at?: string
          desk_position?: Json | null
          fallback_chain?: string[]
          floor?: number
          home_room?: string | null
          id?: string
          is_active?: boolean
          is_deterministic?: boolean
          model_default?: string | null
          model_escalation?: string | null
          model_pin?: string | null
          name: string
          role_key: string
          role_label?: string
          role_prompt?: string
          strict_pin?: boolean
          tool_scope?: Json
          weekly_budget_pct?: number | null
        }
        Update: {
          avatar_colour?: string
          capability?: string | null
          created_at?: string
          desk_position?: Json | null
          fallback_chain?: string[]
          floor?: number
          home_room?: string | null
          id?: string
          is_active?: boolean
          is_deterministic?: boolean
          model_default?: string | null
          model_escalation?: string | null
          model_pin?: string | null
          name?: string
          role_key?: string
          role_label?: string
          role_prompt?: string
          strict_pin?: boolean
          tool_scope?: Json
          weekly_budget_pct?: number | null
        }
        Relationships: []
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_settings: {
        Row: {
          active_model: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_model: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_model?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          permissions: Json | null
          rate_limit: number | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          permissions?: Json | null
          rate_limit?: number | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          permissions?: Json | null
          rate_limit?: number | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      app_projects: {
        Row: {
          actual_hours: number | null
          admin_notes: string | null
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          features: Json | null
          id: string
          milestones: Json | null
          notes: string | null
          preview_url: string | null
          priority: string | null
          production_url: string | null
          project_name: string
          project_type: string
          repository_url: string | null
          start_date: string | null
          status: string
          target_completion_date: string | null
          tech_stack: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          admin_notes?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          features?: Json | null
          id?: string
          milestones?: Json | null
          notes?: string | null
          preview_url?: string | null
          priority?: string | null
          production_url?: string | null
          project_name: string
          project_type?: string
          repository_url?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          tech_stack?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          admin_notes?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          features?: Json | null
          id?: string
          milestones?: Json | null
          notes?: string | null
          preview_url?: string | null
          priority?: string | null
          production_url?: string | null
          project_name?: string
          project_type?: string
          repository_url?: string | null
          start_date?: string | null
          status?: string
          target_completion_date?: string | null
          tech_stack?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      asset_folders: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          parent_id: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_tag_assignments: {
        Row: {
          asset_id: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_tag_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "client_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asset_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "asset_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_tags: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      automation_rule_logs: {
        Row: {
          action_result: Json | null
          error_message: string | null
          executed_at: string
          id: string
          rule_id: string
          status: string
          trigger_data: Json | null
        }
        Insert: {
          action_result?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id: string
          status?: string
          trigger_data?: Json | null
        }
        Update: {
          action_result?: Json | null
          error_message?: string | null
          executed_at?: string
          id?: string
          rule_id?: string
          status?: string
          trigger_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_config: Json | null
          action_type: string
          conditions: Json | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          trigger_config: Json | null
          trigger_count: number
          trigger_event: string
          updated_at: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          conditions?: Json | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          trigger_config?: Json | null
          trigger_count?: number
          trigger_event: string
          updated_at?: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          conditions?: Json | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          trigger_config?: Json | null
          trigger_count?: number
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      automation_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_message: string | null
          id: string
          node_results: Json | null
          started_at: string | null
          status: string
          trigger_data: Json | null
          trigger_type: string | null
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          node_results?: Json | null
          started_at?: string | null
          status?: string
          trigger_data?: Json | null
          trigger_type?: string | null
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          node_results?: Json | null
          started_at?: string | null
          status?: string
          trigger_data?: Json | null
          trigger_type?: string | null
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: []
      }
      automation_schedules: {
        Row: {
          created_at: string
          cron_expression: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          run_count: number | null
          schedule_name: string
          updated_at: string
          user_id: string
          workflow_id: string | null
        }
        Insert: {
          created_at?: string
          cron_expression?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number | null
          schedule_name: string
          updated_at?: string
          user_id: string
          workflow_id?: string | null
        }
        Update: {
          created_at?: string
          cron_expression?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          run_count?: number | null
          schedule_name?: string
          updated_at?: string
          user_id?: string
          workflow_id?: string | null
        }
        Relationships: []
      }
      billing_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          performed_by: string | null
          team_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          team_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_audit_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      blocked_ips: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          created_at: string
          expires_at: string | null
          failed_attempts: number | null
          id: string
          ip_address: string
          is_auto_blocked: boolean | null
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          failed_attempts?: number | null
          id?: string
          ip_address: string
          is_auto_blocked?: boolean | null
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          created_at?: string
          expires_at?: string | null
          failed_attempts?: number | null
          id?: string
          ip_address?: string
          is_auto_blocked?: boolean | null
          reason?: string | null
        }
        Relationships: []
      }
      booking_availability: {
        Row: {
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean | null
          staff_id: string | null
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean | null
          staff_id?: string | null
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          staff_id?: string | null
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "booking_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_blocked_dates: {
        Row: {
          blocked_date: string
          created_at: string | null
          id: string
          reason: string | null
          staff_id: string | null
          user_id: string
        }
        Insert: {
          blocked_date: string
          created_at?: string | null
          id?: string
          reason?: string | null
          staff_id?: string | null
          user_id: string
        }
        Update: {
          blocked_date?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          staff_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_blocked_dates_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "booking_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_services: {
        Row: {
          buffer_minutes: number
          color: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          max_bookings_per_slot: number | null
          name: string
          price: number | null
          site_id: string | null
          sort_order: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          buffer_minutes?: number
          color?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_bookings_per_slot?: number | null
          name: string
          price?: number | null
          site_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          buffer_minutes?: number
          color?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          max_bookings_per_slot?: number | null
          name?: string
          price?: number | null
          site_id?: string | null
          sort_order?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_services_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_settings: {
        Row: {
          allow_cancellation: boolean | null
          allow_reschedule: boolean | null
          auto_confirm: boolean | null
          booking_notice_hours: number | null
          booking_page_enabled: boolean | null
          branding_color: string | null
          branding_logo: string | null
          business_name: string | null
          business_slug: string | null
          cancellation_hours: number | null
          confirmation_message: string | null
          created_at: string | null
          embed_enabled: boolean | null
          id: string
          max_advance_days: number | null
          notification_email: boolean | null
          notification_sms: boolean | null
          require_payment: boolean | null
          reschedule_hours: number | null
          stripe_account_id: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_cancellation?: boolean | null
          allow_reschedule?: boolean | null
          auto_confirm?: boolean | null
          booking_notice_hours?: number | null
          booking_page_enabled?: boolean | null
          branding_color?: string | null
          branding_logo?: string | null
          business_name?: string | null
          business_slug?: string | null
          cancellation_hours?: number | null
          confirmation_message?: string | null
          created_at?: string | null
          embed_enabled?: boolean | null
          id?: string
          max_advance_days?: number | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          require_payment?: boolean | null
          reschedule_hours?: number | null
          stripe_account_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_cancellation?: boolean | null
          allow_reschedule?: boolean | null
          auto_confirm?: boolean | null
          booking_notice_hours?: number | null
          booking_page_enabled?: boolean | null
          branding_color?: string | null
          branding_logo?: string | null
          business_name?: string | null
          business_slug?: string | null
          cancellation_hours?: number | null
          confirmation_message?: string | null
          created_at?: string | null
          embed_enabled?: boolean | null
          id?: string
          max_advance_days?: number | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          require_payment?: boolean | null
          reschedule_hours?: number | null
          stripe_account_id?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      booking_staff: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      booking_staff_services: {
        Row: {
          created_at: string | null
          id: string
          service_id: string
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_id: string
          staff_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_staff_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_staff_services_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "booking_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          cancellation_reason: string | null
          cancelled_at: string | null
          confirmation_sent: boolean | null
          created_at: string | null
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          duration_minutes: number
          end_time: string
          external_calendar_id: string | null
          id: string
          metadata: Json | null
          notes: string | null
          payment_intent_id: string | null
          payment_status: string | null
          price: number | null
          reminder_sent: boolean | null
          rescheduled_from: string | null
          service_id: string | null
          site_id: string | null
          source: string
          staff_id: string | null
          start_time: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          booking_date: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number
          end_time: string
          external_calendar_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          price?: number | null
          reminder_sent?: boolean | null
          rescheduled_from?: string | null
          service_id?: string | null
          site_id?: string | null
          source?: string
          staff_id?: string | null
          start_time: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          booking_date?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          confirmation_sent?: boolean | null
          created_at?: string | null
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number
          end_time?: string
          external_calendar_id?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          price?: number | null
          reminder_sent?: boolean | null
          rescheduled_from?: string | null
          service_id?: string | null
          site_id?: string | null
          source?: string
          staff_id?: string | null
          start_time?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "booking_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "booking_staff"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_settings: {
        Row: {
          accent_color: string | null
          company_name: string | null
          created_at: string
          custom_domain: string | null
          email_header_url: string | null
          id: string
          login_background_url: string | null
          logo_url: string | null
          primary_color: string | null
          report_template: string | null
          secondary_color: string | null
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          company_name?: string | null
          created_at?: string
          custom_domain?: string | null
          email_header_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          report_template?: string | null
          secondary_color?: string | null
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          company_name?: string | null
          created_at?: string
          custom_domain?: string | null
          email_header_url?: string | null
          id?: string
          login_background_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          report_template?: string | null
          secondary_color?: string | null
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_settings_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bridges: {
        Row: {
          cli_version: string | null
          created_at: string
          hostname: string | null
          id: string
          label: string
          last_heartbeat: string | null
          owner_user_id: string
          status: string
          throttled_until: string | null
          token_hash: string
        }
        Insert: {
          cli_version?: string | null
          created_at?: string
          hostname?: string | null
          id?: string
          label?: string
          last_heartbeat?: string | null
          owner_user_id: string
          status?: string
          throttled_until?: string | null
          token_hash: string
        }
        Update: {
          cli_version?: string | null
          created_at?: string
          hostname?: string | null
          id?: string
          label?: string
          last_heartbeat?: string | null
          owner_user_id?: string
          status?: string
          throttled_until?: string | null
          token_hash?: string
        }
        Relationships: []
      }
      build_artifacts: {
        Row: {
          client_id: string | null
          created_at: string
          custom_domain: string | null
          deployed_at: string | null
          id: string
          password_hash: string | null
          preview_url: string | null
          run_id: string | null
          status_badge: string
          vercel_deployment_id: string | null
          vercel_project_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          custom_domain?: string | null
          deployed_at?: string | null
          id?: string
          password_hash?: string | null
          preview_url?: string | null
          run_id?: string | null
          status_badge?: string
          vercel_deployment_id?: string | null
          vercel_project_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          custom_domain?: string | null
          deployed_at?: string | null
          id?: string
          password_hash?: string | null
          preview_url?: string | null
          run_id?: string | null
          status_badge?: string
          vercel_deployment_id?: string | null
          vercel_project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "build_artifacts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      build_guidelines: {
        Row: {
          body: string
          client_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          scope: string
          version: number
        }
        Insert: {
          body: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          scope?: string
          version?: number
        }
        Update: {
          body?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          scope?: string
          version?: number
        }
        Relationships: []
      }
      business_reports: {
        Row: {
          ai_analysis: Json | null
          charts_data: Json | null
          content: string | null
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          report_type: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          charts_data?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_type?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          charts_data?: Json | null
          content?: string | null
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          report_type?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cad_autosaves: {
        Row: {
          created_at: string
          drawing_data: Json
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          drawing_data?: Json
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          drawing_data?: Json
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cad_autosaves_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cad_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cad_project_versions: {
        Row: {
          created_at: string
          drawing_data: Json
          entity_count: number
          id: string
          project_id: string
          version_name: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          drawing_data?: Json
          entity_count?: number
          id?: string
          project_id: string
          version_name?: string | null
          version_number: number
        }
        Update: {
          created_at?: string
          drawing_data?: Json
          entity_count?: number
          id?: string
          project_id?: string
          version_name?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "cad_project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "cad_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      cad_projects: {
        Row: {
          created_at: string
          description: string | null
          drawing_data: Json
          entity_count: number
          folder: string | null
          id: string
          is_template: boolean
          layer_count: number
          name: string
          share_token: string | null
          shared_mode: string | null
          tags: string[] | null
          template_category: string | null
          thumbnail_url: string | null
          units: string
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          drawing_data?: Json
          entity_count?: number
          folder?: string | null
          id?: string
          is_template?: boolean
          layer_count?: number
          name?: string
          share_token?: string | null
          shared_mode?: string | null
          tags?: string[] | null
          template_category?: string | null
          thumbnail_url?: string | null
          units?: string
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          drawing_data?: Json
          entity_count?: number
          folder?: string | null
          id?: string
          is_template?: boolean
          layer_count?: number
          name?: string
          share_token?: string | null
          shared_mode?: string | null
          tags?: string[] | null
          template_category?: string | null
          thumbnail_url?: string | null
          units?: string
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      calculator_history: {
        Row: {
          created_at: string | null
          expression: string
          id: string
          result: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expression: string
          id?: string
          result: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expression?: string
          id?: string
          result?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_event_exceptions: {
        Row: {
          created_at: string
          event_id: string
          exception_date: string
          id: string
          is_cancelled: boolean
          modified_event_data: Json | null
        }
        Insert: {
          created_at?: string
          event_id: string
          exception_date: string
          id?: string
          is_cancelled?: boolean
          modified_event_data?: Json | null
        }
        Update: {
          created_at?: string
          event_id?: string
          exception_date?: string
          id?: string
          is_cancelled?: boolean
          modified_event_data?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_exceptions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attachments: Json | null
          attendees: Json | null
          calendar_id: string | null
          color: string
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_all_day: boolean
          is_recurring: boolean
          location: string | null
          meeting_link: string | null
          recurrence_rule: Json | null
          reminders: Json | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          attendees?: Json | null
          calendar_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean
          location?: string | null
          meeting_link?: string | null
          recurrence_rule?: Json | null
          reminders?: Json | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          attendees?: Json | null
          calendar_id?: string | null
          color?: string
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_all_day?: boolean
          is_recurring?: boolean
          location?: string | null
          meeting_link?: string | null
          recurrence_rule?: Json | null
          reminders?: Json | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      call_sessions: {
        Row: {
          call_type: string
          callee_id: string
          caller_id: string
          channel_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          call_type?: string
          callee_id: string
          caller_id: string
          channel_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          call_type?: string
          callee_id?: string
          caller_id?: string
          channel_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "comm_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      client_assets: {
        Row: {
          created_at: string
          description: string | null
          download_count: number | null
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          folder_id: string | null
          id: string
          is_encrypted: boolean | null
          is_starred: boolean | null
          last_accessed_at: string | null
          mime_type: string
          original_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_name: string
          file_path: string
          file_size?: number
          file_type: string
          folder_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_starred?: boolean | null
          last_accessed_at?: string | null
          mime_type: string
          original_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          folder_id?: string | null
          id?: string
          is_encrypted?: boolean | null
          is_starred?: boolean | null
          last_accessed_at?: string | null
          mime_type?: string
          original_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_assets_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "asset_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      client_billing: {
        Row: {
          add_ons: Json | null
          billing_cycle: string
          created_at: string
          id: string
          next_billing_date: string | null
          notes: string | null
          one_off_charges: Json | null
          payment_status: string | null
          plan_name: string
          plan_price: number
          services: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          add_ons?: Json | null
          billing_cycle?: string
          created_at?: string
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          one_off_charges?: Json | null
          payment_status?: string | null
          plan_name?: string
          plan_price?: number
          services?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          add_ons?: Json | null
          billing_cycle?: string
          created_at?: string
          id?: string
          next_billing_date?: string | null
          notes?: string | null
          one_off_charges?: Json | null
          payment_status?: string | null
          plan_name?: string
          plan_price?: number
          services?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_contracts: {
        Row: {
          created_at: string
          created_by: string | null
          crm_company_id: string | null
          crm_opportunity_id: string | null
          document_type: string | null
          document_url: string | null
          expires_at: string | null
          id: string
          notes: string | null
          signed_at: string | null
          status: string | null
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          crm_opportunity_id?: string | null
          document_type?: string | null
          document_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          signed_at?: string | null
          status?: string | null
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          crm_opportunity_id?: string | null
          document_type?: string | null
          document_url?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          signed_at?: string | null
          status?: string | null
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_contracts_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contracts_crm_opportunity_id_fkey"
            columns: ["crm_opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_deals_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contracts_crm_opportunity_id_fkey"
            columns: ["crm_opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_contracts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      client_invoices: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          crm_company_id: string | null
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string
          items: Json | null
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          status: string | null
          tax_amount: number | null
          team_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          tax_amount?: number | null
          team_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          crm_company_id?: string | null
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          status?: string | null
          tax_amount?: number | null
          team_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_invoices_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_invoices_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      client_onboarding: {
        Row: {
          account_created: boolean
          account_created_at: string | null
          assets_requested: boolean
          assets_requested_at: string | null
          checklist_items: Json | null
          client_email: string | null
          client_name: string
          company_name: string | null
          completed_at: string | null
          created_at: string
          deal_id: string | null
          id: string
          info_checklist_sent: boolean
          info_checklist_sent_at: string | null
          onboarding_notes: string | null
          portal_configured: boolean
          portal_configured_at: string | null
          status: string
          timeline_data: Json | null
          timeline_generated: boolean
          timeline_generated_at: string | null
          updated_at: string
          user_id: string
          welcome_sent: boolean
          welcome_sent_at: string | null
        }
        Insert: {
          account_created?: boolean
          account_created_at?: string | null
          assets_requested?: boolean
          assets_requested_at?: string | null
          checklist_items?: Json | null
          client_email?: string | null
          client_name: string
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          info_checklist_sent?: boolean
          info_checklist_sent_at?: string | null
          onboarding_notes?: string | null
          portal_configured?: boolean
          portal_configured_at?: string | null
          status?: string
          timeline_data?: Json | null
          timeline_generated?: boolean
          timeline_generated_at?: string | null
          updated_at?: string
          user_id: string
          welcome_sent?: boolean
          welcome_sent_at?: string | null
        }
        Update: {
          account_created?: boolean
          account_created_at?: string | null
          assets_requested?: boolean
          assets_requested_at?: string | null
          checklist_items?: Json | null
          client_email?: string | null
          client_name?: string
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          deal_id?: string | null
          id?: string
          info_checklist_sent?: boolean
          info_checklist_sent_at?: string | null
          onboarding_notes?: string | null
          portal_configured?: boolean
          portal_configured_at?: string | null
          status?: string
          timeline_data?: Json | null
          timeline_generated?: boolean
          timeline_generated_at?: string | null
          updated_at?: string
          user_id?: string
          welcome_sent?: boolean
          welcome_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_onboarding_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      client_pricing: {
        Row: {
          billing_frequency: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_recurring: boolean | null
          is_visible: boolean | null
          negotiated_price: number
          notes: string | null
          service_name: string
          service_type: string
          team_id: string
          updated_at: string
        }
        Insert: {
          billing_frequency?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          is_visible?: boolean | null
          negotiated_price: number
          notes?: string | null
          service_name: string
          service_type: string
          team_id: string
          updated_at?: string
        }
        Update: {
          billing_frequency?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          is_visible?: boolean | null
          negotiated_price?: number
          notes?: string | null
          service_name?: string
          service_type?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_pricing_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      client_teams: {
        Row: {
          created_at: string
          id: string
          primary_account_id: string
          team_code: string
          team_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          primary_account_id: string
          team_code: string
          team_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          primary_account_id?: string
          team_code?: string
          team_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cms_collections: {
        Row: {
          created_at: string
          description: string | null
          fields: Json
          icon: string | null
          id: string
          name: string
          site_id: string
          slug: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          name: string
          site_id: string
          slug: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fields?: Json
          icon?: string | null
          id?: string
          name?: string
          site_id?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_collections_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_entries: {
        Row: {
          collection_id: string
          created_at: string
          data: Json
          id: string
          published_at: string | null
          site_id: string
          slug: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          data?: Json
          id?: string
          published_at?: string | null
          site_id: string
          slug: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          data?: Json
          id?: string
          published_at?: string | null
          site_id?: string
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_entries_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "cms_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cms_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_channel_members: {
        Row: {
          channel_id: string
          id: string
          is_muted: boolean
          joined_at: string
          last_read_at: string | null
          notification_preference: string | null
          role: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          notification_preference?: string | null
          role?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          notification_preference?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "comm_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_channels: {
        Row: {
          channel_type: string
          color: string | null
          created_at: string
          created_by: string
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean
          is_default: boolean
          join_code: string | null
          name: string
          pinned_message_ids: string[] | null
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          channel_type?: string
          color?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          join_code?: string | null
          name: string
          pinned_message_ids?: string[] | null
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          channel_type?: string
          color?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          is_default?: boolean
          join_code?: string | null
          name?: string
          pinned_message_ids?: string[] | null
          settings?: Json | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      comm_messages: {
        Row: {
          attachments: Json | null
          channel_id: string
          content: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          is_pinned: boolean
          mentions: string[] | null
          message_type: string
          metadata: Json | null
          parent_id: string | null
          sender_id: string
          thread_count: number
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          channel_id: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          mentions?: string[] | null
          message_type?: string
          metadata?: Json | null
          parent_id?: string | null
          sender_id: string
          thread_count?: number
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          channel_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          is_pinned?: boolean
          mentions?: string[] | null
          message_type?: string
          metadata?: Json | null
          parent_id?: string | null
          sender_id?: string
          thread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "comm_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_presence: {
        Row: {
          custom_emoji: string | null
          custom_status: string | null
          id: string
          last_seen_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          custom_emoji?: string | null
          custom_status?: string | null
          id?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          custom_emoji?: string | null
          custom_status?: string | null
          id?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comm_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "comm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_read_receipts: {
        Row: {
          channel_id: string
          id: string
          last_read_at: string
          last_read_message_id: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          last_read_at?: string
          last_read_message_id?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          last_read_at?: string
          last_read_message_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_read_receipts_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "comm_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_read_receipts_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "comm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_user_settings: {
        Row: {
          compact_mode: boolean | null
          created_at: string
          email_digest: string | null
          id: string
          notification_sound: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          show_last_seen: boolean | null
          show_read_receipts: boolean | null
          show_typing_indicator: boolean | null
          theme_preference: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compact_mode?: boolean | null
          created_at?: string
          email_digest?: string | null
          id?: string
          notification_sound?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          show_last_seen?: boolean | null
          show_read_receipts?: boolean | null
          show_typing_indicator?: boolean | null
          theme_preference?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compact_mode?: boolean | null
          created_at?: string
          email_digest?: string | null
          id?: string
          notification_sound?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          show_last_seen?: boolean | null
          show_read_receipts?: boolean | null
          show_typing_indicator?: boolean | null
          theme_preference?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_requests: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          created_at: string
          delivered_content: string | null
          delivered_files: string[] | null
          description: string | null
          id: string
          priority: string | null
          reference_files: string[] | null
          reference_urls: string[] | null
          request_type: string
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          delivered_content?: string | null
          delivered_files?: string[] | null
          description?: string | null
          id?: string
          priority?: string | null
          reference_files?: string[] | null
          reference_urls?: string[] | null
          request_type: string
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          delivered_content?: string | null
          delivered_files?: string[] | null
          description?: string | null
          id?: string
          priority?: string | null
          reference_files?: string[] | null
          reference_urls?: string[] | null
          request_type?: string
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          assigned_admin_id: string | null
          closed_at: string | null
          created_at: string
          customer_id: string
          id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_admin_id?: string | null
          closed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_activity_participants: {
        Row: {
          communication_id: string
          contact_id: string | null
          created_at: string
          id: string
          role: string | null
          user_id: string | null
        }
        Insert: {
          communication_id: string
          contact_id?: string | null
          created_at?: string
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Update: {
          communication_id?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_activity_participants_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "crm_communications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activity_participants_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_call_logs: {
        Row: {
          admin_id: string
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          id: string
          notes: string | null
          org_id: string
          outcome: string | null
          phone: string
          source: string
          started_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          notes?: string | null
          org_id: string
          outcome?: string | null
          phone: string
          source?: string
          started_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          outcome?: string | null
          phone?: string
          source?: string
          started_at?: string
        }
        Relationships: []
      }
      crm_call_pushes: {
        Row: {
          call_id: string | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string | null
          handled_at: string | null
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          call_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          handled_at?: string | null
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          call_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string | null
          handled_at?: string | null
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_call_transcripts: {
        Row: {
          admin_id: string
          call_id: string
          content: string
          method: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          call_id: string
          content?: string
          method?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          call_id?: string
          content?: string
          method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_call_transcripts_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: true
            referencedRelation: "crm_call_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_communication_attachments: {
        Row: {
          communication_id: string
          content_type: string | null
          created_at: string
          file_url: string | null
          filename: string | null
          id: string
          platform_file_id: string | null
          size_bytes: number | null
        }
        Insert: {
          communication_id: string
          content_type?: string | null
          created_at?: string
          file_url?: string | null
          filename?: string | null
          id?: string
          platform_file_id?: string | null
          size_bytes?: number | null
        }
        Update: {
          communication_id?: string
          content_type?: string | null
          created_at?: string
          file_url?: string | null
          filename?: string | null
          id?: string
          platform_file_id?: string | null
          size_bytes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_communication_attachments_communication_id_fkey"
            columns: ["communication_id"]
            isOneToOne: false
            referencedRelation: "crm_communications"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_communications: {
        Row: {
          body: string | null
          cc_addresses: string[] | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          direction: Database["public"]["Enums"]["crm_comm_direction"]
          duration_seconds: number | null
          external_id: string | null
          external_source: string | null
          from_address: string | null
          id: string
          kind: Database["public"]["Enums"]["crm_comm_kind"]
          metadata: Json
          occurred_at: string
          opportunity_id: string | null
          org_id: string
          owner_id: string | null
          status: string | null
          subject: string | null
          tags: string[] | null
          to_addresses: string[] | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          cc_addresses?: string[] | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["crm_comm_direction"]
          duration_seconds?: number | null
          external_id?: string | null
          external_source?: string | null
          from_address?: string | null
          id?: string
          kind: Database["public"]["Enums"]["crm_comm_kind"]
          metadata?: Json
          occurred_at?: string
          opportunity_id?: string | null
          org_id: string
          owner_id?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          to_addresses?: string[] | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          cc_addresses?: string[] | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["crm_comm_direction"]
          duration_seconds?: number | null
          external_id?: string | null
          external_source?: string | null
          from_address?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["crm_comm_kind"]
          metadata?: Json
          occurred_at?: string
          opportunity_id?: string | null
          org_id?: string
          owner_id?: string | null
          status?: string | null
          subject?: string | null
          tags?: string[] | null
          to_addresses?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_communications_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_communications_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_communications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_deals_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_communications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_companies: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          country: string | null
          created_at: string
          domain: string | null
          email: string | null
          id: string
          industry: string | null
          legal_name: string | null
          lifecycle_stage_id: string | null
          linked_client_team_id: string | null
          linked_lead_id: string | null
          name: string
          notes: string | null
          org_id: string
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          region: string | null
          relationship_type: Database["public"]["Enums"]["crm_relationship_type"][]
          size: string | null
          source: string | null
          status: Database["public"]["Enums"]["crm_entity_status"]
          tags: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          lifecycle_stage_id?: string | null
          linked_client_team_id?: string | null
          linked_lead_id?: string | null
          name: string
          notes?: string | null
          org_id: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          relationship_type?: Database["public"]["Enums"]["crm_relationship_type"][]
          size?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["crm_entity_status"]
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          domain?: string | null
          email?: string | null
          id?: string
          industry?: string | null
          legal_name?: string | null
          lifecycle_stage_id?: string | null
          linked_client_team_id?: string | null
          linked_lead_id?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          region?: string | null
          relationship_type?: Database["public"]["Enums"]["crm_relationship_type"][]
          size?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["crm_entity_status"]
          tags?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          is_primary: boolean
          job_title: string | null
          last_name: string | null
          lifecycle_stage_id: string | null
          linked_lead_id: string | null
          mobile: string | null
          notes: string | null
          org_id: string
          owner_id: string | null
          phone: string | null
          relationship_type: Database["public"]["Enums"]["crm_relationship_type"][]
          source: string | null
          status: Database["public"]["Enums"]["crm_entity_status"]
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean
          job_title?: string | null
          last_name?: string | null
          lifecycle_stage_id?: string | null
          linked_lead_id?: string | null
          mobile?: string | null
          notes?: string | null
          org_id: string
          owner_id?: string | null
          phone?: string | null
          relationship_type?: Database["public"]["Enums"]["crm_relationship_type"][]
          source?: string | null
          status?: Database["public"]["Enums"]["crm_entity_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          is_primary?: boolean
          job_title?: string | null
          last_name?: string | null
          lifecycle_stage_id?: string | null
          linked_lead_id?: string | null
          mobile?: string | null
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          phone?: string | null
          relationship_type?: Database["public"]["Enums"]["crm_relationship_type"][]
          source?: string | null
          status?: Database["public"]["Enums"]["crm_entity_status"]
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deal_activities: {
        Row: {
          activity_type: string
          created_at: string
          deal_id: string
          description: string | null
          id: string
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          deal_id: string
          description?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          deal_id?: string
          description?: string | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_deal_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          actual_close_date: string | null
          company_name: string | null
          contact_name: string | null
          created_at: string
          currency: string
          deal_name: string
          deal_value: number
          description: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          notes: string | null
          probability: number
          stage: string
          tags: string[] | null
          updated_at: string
          user_id: string
          won: boolean | null
        }
        Insert: {
          actual_close_date?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          currency?: string
          deal_name: string
          deal_value?: number
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          stage?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
          won?: boolean | null
        }
        Update: {
          actual_close_date?: string | null
          company_name?: string | null
          contact_name?: string | null
          created_at?: string
          currency?: string
          deal_name?: string
          deal_value?: number
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          notes?: string | null
          probability?: number
          stage?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          won?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_financial_links: {
        Row: {
          amount: number | null
          created_at: string
          created_by: string | null
          currency: string | null
          entity_id: string
          entity_type: string
          finance_id: string
          finance_type: string
          id: string
          metadata: Json
          occurred_at: string | null
          org_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          entity_id: string
          entity_type: string
          finance_id: string
          finance_type: string
          id?: string
          metadata?: Json
          occurred_at?: string | null
          org_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          entity_id?: string
          entity_type?: string
          finance_id?: string
          finance_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string | null
          org_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crm_lifecycle_history: {
        Row: {
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          from_stage_id: string | null
          id: string
          note: string | null
          org_id: string
          to_stage_id: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          from_stage_id?: string | null
          id?: string
          note?: string | null
          org_id: string
          to_stage_id?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          from_stage_id?: string | null
          id?: string
          note?: string | null
          org_id?: string
          to_stage_id?: string | null
        }
        Relationships: []
      }
      crm_lifecycle_stages: {
        Row: {
          category: Database["public"]["Enums"]["crm_lifecycle_category"]
          color: string | null
          created_at: string
          id: string
          is_default: boolean
          name: string
          order_index: number
          org_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["crm_lifecycle_category"]
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          order_index?: number
          org_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["crm_lifecycle_category"]
          color?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          order_index?: number
          org_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_opportunities: {
        Row: {
          actual_close_date: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          currency: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lifecycle_stage_id: string | null
          notes: string | null
          org_id: string
          owner_id: string | null
          probability: number | null
          source: string | null
          stage: string
          status: Database["public"]["Enums"]["crm_entity_status"]
          tags: string[] | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          actual_close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lifecycle_stage_id?: string | null
          notes?: string | null
          org_id: string
          owner_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          status?: Database["public"]["Enums"]["crm_entity_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          actual_close_date?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lifecycle_stage_id?: string | null
          notes?: string | null
          org_id?: string
          owner_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: string
          status?: Database["public"]["Enums"]["crm_entity_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_org_members: {
        Row: {
          created_at: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          org_id?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_phone_links: {
        Row: {
          claimed_at: string | null
          created_at: string
          device_label: string | null
          id: string
          last_seen_at: string | null
          token: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          device_label?: string | null
          id?: string
          last_seen_at?: string | null
          token: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          device_label?: string | null
          id?: string
          last_seen_at?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_workflow_runs: {
        Row: {
          actions_executed: Json
          created_at: string
          entity_id: string | null
          entity_type: string | null
          error: string | null
          id: string
          org_id: string
          status: string
          trigger_payload: Json
          workflow_id: string | null
        }
        Insert: {
          actions_executed?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          id?: string
          org_id: string
          status?: string
          trigger_payload?: Json
          workflow_id?: string | null
        }
        Update: {
          actions_executed?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          error?: string | null
          id?: string
          org_id?: string
          status?: string
          trigger_payload?: Json
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "crm_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_workflows: {
        Row: {
          actions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          priority: number
          trigger_config: Json
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          priority?: number
          trigger_config?: Json
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          priority?: number
          trigger_config?: Json
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_uploads: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          notes: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_metrics_cache: {
        Row: {
          computed_at: string
          id: string
          metric_key: string
          metric_value: Json
          period: string
          user_id: string
        }
        Insert: {
          computed_at?: string
          id?: string
          metric_key: string
          metric_value?: Json
          period?: string
          user_id: string
        }
        Update: {
          computed_at?: string
          id?: string
          metric_key?: string
          metric_value?: Json
          period?: string
          user_id?: string
        }
        Relationships: []
      }
      designer_assets: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          site_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          site_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          site_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "designer_assets_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_components: {
        Row: {
          category: string | null
          created_at: string
          elements: Json
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          elements?: Json
          id?: string
          name: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          elements?: Json
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      designer_pages: {
        Row: {
          created_at: string
          elements: Json | null
          id: string
          is_homepage: boolean
          page_name: string
          page_settings: Json | null
          seo_description: string | null
          seo_title: string | null
          site_id: string
          slug: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          elements?: Json | null
          id?: string
          is_homepage?: boolean
          page_name?: string
          page_settings?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          site_id: string
          slug?: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          elements?: Json | null
          id?: string
          is_homepage?: boolean
          page_name?: string
          page_settings?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          site_id?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "designer_pages_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      designer_sites: {
        Row: {
          created_at: string
          description: string | null
          global_styles: Json | null
          id: string
          published_at: string | null
          published_url: string | null
          settings: Json | null
          site_name: string
          status: string
          template_id: string | null
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          global_styles?: Json | null
          id?: string
          published_at?: string | null
          published_url?: string | null
          settings?: Json | null
          site_name: string
          status?: string
          template_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          global_styles?: Json | null
          id?: string
          published_at?: string | null
          published_url?: string | null
          settings?: Json | null
          site_name?: string
          status?: string
          template_id?: string | null
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_comments: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: string
          is_resolved: boolean | null
          selected_text: string | null
          selection_from: number | null
          selection_to: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: string
          is_resolved?: boolean | null
          selected_text?: string | null
          selection_from?: number | null
          selection_to?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          is_resolved?: boolean | null
          selected_text?: string | null
          selection_from?: number | null
          selection_to?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "office_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          content: Json | null
          created_at: string
          document_id: string
          id: string
          title: string | null
          user_id: string
          version_number: number
          word_count: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          document_id: string
          id?: string
          title?: string | null
          user_id: string
          version_number?: number
          word_count?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          document_id?: string
          id?: string
          title?: string | null
          user_id?: string
          version_number?: number
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "office_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ecommerce_orders: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          id: string
          items: Json
          metadata: Json
          notes: string | null
          order_number: string
          payment_intent_id: string | null
          payment_provider: string
          payment_status: string
          shipping_address: Json | null
          shipping_cost: number
          status: string
          subtotal: number
          tax_amount: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          metadata?: Json
          notes?: string | null
          order_number?: string
          payment_intent_id?: string | null
          payment_provider?: string
          payment_status?: string
          shipping_address?: Json | null
          shipping_cost?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          id?: string
          items?: Json
          metadata?: Json
          notes?: string | null
          order_number?: string
          payment_intent_id?: string | null
          payment_provider?: string
          payment_status?: string
          shipping_address?: Json | null
          shipping_cost?: number
          status?: string
          subtotal?: number
          tax_amount?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ecommerce_settings: {
        Row: {
          brand_color: string
          checkout_accent: string
          checkout_cancel_url: string | null
          checkout_success_url: string | null
          contact_email: string | null
          created_at: string
          currency: string
          id: string
          logo_url: string | null
          metadata: Json
          payments_configured: boolean
          payments_provider: string
          payments_test_mode: boolean
          shipping_enabled: boolean
          shipping_flat_rate: number
          shipping_free_over: number | null
          store_name: string
          stripe_secret_key: string | null
          support_url: string | null
          tax_enabled: boolean
          tax_inclusive: boolean
          tax_rate: number
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_color?: string
          checkout_accent?: string
          checkout_cancel_url?: string | null
          checkout_success_url?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          payments_configured?: boolean
          payments_provider?: string
          payments_test_mode?: boolean
          shipping_enabled?: boolean
          shipping_flat_rate?: number
          shipping_free_over?: number | null
          store_name?: string
          stripe_secret_key?: string | null
          support_url?: string | null
          tax_enabled?: boolean
          tax_inclusive?: boolean
          tax_rate?: number
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_color?: string
          checkout_accent?: string
          checkout_cancel_url?: string | null
          checkout_success_url?: string | null
          contact_email?: string | null
          created_at?: string
          currency?: string
          id?: string
          logo_url?: string | null
          metadata?: Json
          payments_configured?: boolean
          payments_provider?: string
          payments_test_mode?: boolean
          shipping_enabled?: boolean
          shipping_flat_rate?: number
          shipping_free_over?: number | null
          store_name?: string
          stripe_secret_key?: string | null
          support_url?: string | null
          tax_enabled?: boolean
          tax_inclusive?: boolean
          tax_rate?: number
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          access_token: string | null
          color: string | null
          created_at: string
          display_name: string | null
          email_address: string
          error_message: string | null
          id: string
          imap_host: string | null
          imap_password: string | null
          imap_port: number | null
          imap_username: string | null
          is_active: boolean | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          smtp_host: string | null
          smtp_port: number | null
          status: string | null
          sync_cursor: string | null
          token_expires_at: string | null
          updated_at: string
          use_ssl: boolean | null
          user_id: string
        }
        Insert: {
          access_token?: string | null
          color?: string | null
          created_at?: string
          display_name?: string | null
          email_address: string
          error_message?: string | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          status?: string | null
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id: string
        }
        Update: {
          access_token?: string | null
          color?: string | null
          created_at?: string
          display_name?: string | null
          email_address?: string
          error_message?: string | null
          id?: string
          imap_host?: string | null
          imap_password?: string | null
          imap_port?: number | null
          imap_username?: string | null
          is_active?: boolean | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          smtp_host?: string | null
          smtp_port?: number | null
          status?: string | null
          sync_cursor?: string | null
          token_expires_at?: string | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          account_id: string | null
          attachments: Json | null
          bcc_addresses: Json | null
          body_html: string | null
          body_text: string | null
          cc_addresses: Json | null
          created_at: string
          id: string
          in_reply_to: string | null
          is_scheduled: boolean | null
          scheduled_at: string | null
          subject: string | null
          to_addresses: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string
          id?: string
          in_reply_to?: string | null
          is_scheduled?: boolean | null
          scheduled_at?: string | null
          subject?: string | null
          to_addresses?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          created_at?: string
          id?: string
          in_reply_to?: string | null
          is_scheduled?: boolean | null
          scheduled_at?: string | null
          subject?: string | null
          to_addresses?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_drafts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          account_id: string
          attachments: Json | null
          bcc_addresses: Json | null
          body_html: string | null
          body_text: string | null
          category: string | null
          cc_addresses: Json | null
          created_at: string
          date: string
          folder: string | null
          from_email: string | null
          from_name: string | null
          has_attachments: boolean | null
          id: string
          is_draft: boolean | null
          is_read: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          provider_message_id: string
          raw_headers: Json | null
          snippet: string | null
          subject: string | null
          thread_id: string | null
          to_addresses: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          cc_addresses?: Json | null
          created_at?: string
          date: string
          folder?: string | null
          from_email?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_draft?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          provider_message_id: string
          raw_headers?: Json | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          category?: string | null
          cc_addresses?: Json | null
          created_at?: string
          date?: string
          folder?: string | null
          from_email?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          is_draft?: boolean | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          provider_message_id?: string
          raw_headers?: Json | null
          snippet?: string | null
          subject?: string | null
          thread_id?: string | null
          to_addresses?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      enquiries: {
        Row: {
          additional_notes: string | null
          brand_colors: string | null
          budget: string | null
          business_address: string | null
          business_type: string | null
          company: string | null
          competitors: string | null
          created_at: string
          email: string
          employee_count: string | null
          first_name: string | null
          form_step: number | null
          has_existing_site: string | null
          how_did_you_hear: string | null
          id: string
          inspiration_sites: string | null
          interest: string | null
          is_draft: boolean | null
          last_name: string | null
          must_have_features: string[] | null
          name: string
          notes: string | null
          page_count: string | null
          phone: string | null
          primary_goal: string | null
          project_details: string | null
          resume_token: string | null
          selected_package: string | null
          social_media: string | null
          status: string
          timeline: string | null
          updated_at: string
          website: string | null
          years_in_business: string | null
        }
        Insert: {
          additional_notes?: string | null
          brand_colors?: string | null
          budget?: string | null
          business_address?: string | null
          business_type?: string | null
          company?: string | null
          competitors?: string | null
          created_at?: string
          email: string
          employee_count?: string | null
          first_name?: string | null
          form_step?: number | null
          has_existing_site?: string | null
          how_did_you_hear?: string | null
          id?: string
          inspiration_sites?: string | null
          interest?: string | null
          is_draft?: boolean | null
          last_name?: string | null
          must_have_features?: string[] | null
          name: string
          notes?: string | null
          page_count?: string | null
          phone?: string | null
          primary_goal?: string | null
          project_details?: string | null
          resume_token?: string | null
          selected_package?: string | null
          social_media?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          website?: string | null
          years_in_business?: string | null
        }
        Update: {
          additional_notes?: string | null
          brand_colors?: string | null
          budget?: string | null
          business_address?: string | null
          business_type?: string | null
          company?: string | null
          competitors?: string | null
          created_at?: string
          email?: string
          employee_count?: string | null
          first_name?: string | null
          form_step?: number | null
          has_existing_site?: string | null
          how_did_you_hear?: string | null
          id?: string
          inspiration_sites?: string | null
          interest?: string | null
          is_draft?: boolean | null
          last_name?: string | null
          must_have_features?: string[] | null
          name?: string
          notes?: string | null
          page_count?: string | null
          phone?: string | null
          primary_goal?: string | null
          project_details?: string | null
          resume_token?: string | null
          selected_package?: string | null
          social_media?: string | null
          status?: string
          timeline?: string | null
          updated_at?: string
          website?: string | null
          years_in_business?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          category_color: string | null
          created_at: string | null
          currency: string | null
          expense_date: string
          has_receipt: boolean | null
          id: string
          notes: string | null
          project: string | null
          receipt_url: string | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount?: number
          category?: string
          category_color?: string | null
          created_at?: string | null
          currency?: string | null
          expense_date?: string
          has_receipt?: boolean | null
          id?: string
          notes?: string | null
          project?: string | null
          receipt_url?: string | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          category_color?: string | null
          created_at?: string | null
          currency?: string | null
          expense_date?: string
          has_receipt?: boolean | null
          id?: string
          notes?: string | null
          project?: string | null
          receipt_url?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      file_registry: {
        Row: {
          content: string
          file_path: string
          id: string
          project_id: string
          sha: string
          updated_at: string
        }
        Insert: {
          content?: string
          file_path: string
          id?: string
          project_id: string
          sha: string
          updated_at?: string
        }
        Update: {
          content?: string
          file_path?: string
          id?: string
          project_id?: string
          sha?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_registry_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mesh_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      fleet_advice: {
        Row: {
          acted_automatically: boolean
          id: string
          level: string
          model_id: string | null
          rationale: string
          recommendation: string
          ts: string
        }
        Insert: {
          acted_automatically?: boolean
          id?: string
          level: string
          model_id?: string | null
          rationale: string
          recommendation: string
          ts?: string
        }
        Update: {
          acted_automatically?: boolean
          id?: string
          level?: string
          model_id?: string | null
          rationale?: string
          recommendation?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "fleet_advice_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      greeting_messages: {
        Row: {
          created_at: string
          created_by: string | null
          enabled: boolean
          id: string
          message: string
          updated_at: string
          updated_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          message?: string
          updated_at?: string
          updated_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          id?: string
          message?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hr_candidates: {
        Row: {
          applied_date: string
          created_at: string | null
          department: string
          email: string | null
          id: string
          name: string
          notes: string | null
          rating: number | null
          role: string
          stage: string
          user_id: string
        }
        Insert: {
          applied_date?: string
          created_at?: string | null
          department?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          rating?: number | null
          role: string
          stage?: string
          user_id: string
        }
        Update: {
          applied_date?: string
          created_at?: string | null
          department?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          rating?: number | null
          role?: string
          stage?: string
          user_id?: string
        }
        Relationships: []
      }
      hr_employees: {
        Row: {
          avatar: string | null
          created_at: string | null
          department: string
          email: string
          emergency_contact: string | null
          employee_id: string
          id: string
          leave_personal: number | null
          leave_sick: number | null
          leave_vacation: number | null
          location: string | null
          manager: string | null
          name: string
          performance: number | null
          phone: string | null
          role: string
          salary: number | null
          skills: string[] | null
          start_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string | null
          department?: string
          email: string
          emergency_contact?: string | null
          employee_id: string
          id?: string
          leave_personal?: number | null
          leave_sick?: number | null
          leave_vacation?: number | null
          location?: string | null
          manager?: string | null
          name: string
          performance?: number | null
          phone?: string | null
          role: string
          salary?: number | null
          skills?: string[] | null
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar?: string | null
          created_at?: string | null
          department?: string
          email?: string
          emergency_contact?: string | null
          employee_id?: string
          id?: string
          leave_personal?: number | null
          leave_sick?: number | null
          leave_vacation?: number | null
          location?: string | null
          manager?: string | null
          name?: string
          performance?: number | null
          phone?: string | null
          role?: string
          salary?: number | null
          skills?: string[] | null
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      hr_performance_reviews: {
        Row: {
          created_at: string | null
          employee_id: string | null
          employee_name: string
          feedback: string | null
          goals: Json | null
          id: string
          period: string
          rating: number | null
          review_date: string
          reviewer: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          employee_name: string
          feedback?: string | null
          goals?: Json | null
          id?: string
          period: string
          rating?: number | null
          review_date?: string
          reviewer: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          employee_name?: string
          feedback?: string | null
          goals?: Json | null
          id?: string
          period?: string
          rating?: number | null
          review_date?: string
          reviewer?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_performance_reviews_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_time_off_requests: {
        Row: {
          created_at: string | null
          days: number
          employee_id: string | null
          employee_name: string
          end_date: string
          id: string
          reason: string | null
          start_date: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          days?: number
          employee_id?: string | null
          employee_name: string
          end_date: string
          id?: string
          reason?: string | null
          start_date: string
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          days?: number
          employee_id?: string | null
          employee_name?: string
          end_date?: string
          id?: string
          reason?: string | null
          start_date?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hr_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      inv_companies: {
        Row: {
          address: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          thumbnail_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inv_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          manager_contact: string | null
          manager_name: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          manager_contact?: string | null
          manager_name?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          manager_contact?: string | null
          manager_name?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inv_products: {
        Row: {
          barcode: string | null
          category_id: string | null
          company_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          lead_time_days: number | null
          name: string
          reorder_level: number
          reorder_qty: number
          selling_price: number
          sku: string
          supplier_contact: string | null
          supplier_name: string | null
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          company_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lead_time_days?: number | null
          name: string
          reorder_level?: number
          reorder_qty?: number
          selling_price?: number
          sku: string
          supplier_contact?: string | null
          supplier_name?: string | null
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          company_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          lead_time_days?: number | null
          name?: string
          reorder_level?: number
          reorder_qty?: number
          selling_price?: number
          sku?: string
          supplier_contact?: string | null
          supplier_name?: string | null
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inv_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_products_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "inv_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_settings: {
        Row: {
          created_at: string
          currency: string
          id: string
          low_stock_notifications: boolean
          multi_location_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          low_stock_notifications?: boolean
          multi_location_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          low_stock_notifications?: boolean
          multi_location_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inv_stock_count_items: {
        Row: {
          count_id: string
          counted_qty: number | null
          created_at: string
          discrepancy: number | null
          expected_qty: number
          id: string
          product_id: string
        }
        Insert: {
          count_id: string
          counted_qty?: number | null
          created_at?: string
          discrepancy?: number | null
          expected_qty?: number
          id?: string
          product_id: string
        }
        Update: {
          count_id?: string
          counted_qty?: number | null
          created_at?: string
          discrepancy?: number | null
          expected_qty?: number
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_stock_count_items_count_id_fkey"
            columns: ["count_id"]
            isOneToOne: false
            referencedRelation: "inv_stock_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_stock_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inv_products"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_stock_counts: {
        Row: {
          created_at: string
          finalized_at: string | null
          id: string
          location_id: string | null
          name: string | null
          notes: string | null
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          location_id?: string | null
          name?: string | null
          notes?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          finalized_at?: string | null
          id?: string
          location_id?: string | null
          name?: string | null
          notes?: string | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_stock_counts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_stock_levels: {
        Row: {
          id: string
          last_counted_at: string | null
          location_id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          id?: string
          last_counted_at?: string | null
          location_id: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          id?: string
          last_counted_at?: string | null
          location_id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_stock_levels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_stock_levels_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inv_products"
            referencedColumns: ["id"]
          },
        ]
      }
      inv_stock_movements: {
        Row: {
          created_at: string
          id: string
          location_id: string | null
          movement_type: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          reference: string | null
          to_location_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location_id?: string | null
          movement_type: string
          notes?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          reference?: string | null
          to_location_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location_id?: string | null
          movement_type?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          reference?: string | null
          to_location_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inv_stock_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inv_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inv_stock_movements_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "inv_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_design: {
        Row: {
          design: Json
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          design?: Json
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          design?: Json
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_presets: {
        Row: {
          created_at: string
          id: string
          lines: Json
          name: string
          notes: string | null
          owner_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lines?: Json
          name: string
          notes?: string | null
          owner_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lines?: Json
          name?: string
          notes?: string | null
          owner_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      jarvis_ledger: {
        Row: {
          id: string
          model_id: string | null
          note: string | null
          ok: boolean
          prompt_head: string | null
          tier: number
          ts: string
          user_id: string | null
        }
        Insert: {
          id?: string
          model_id?: string | null
          note?: string | null
          ok?: boolean
          prompt_head?: string | null
          tier: number
          ts?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          model_id?: string | null
          note?: string | null
          ok?: boolean
          prompt_head?: string | null
          tier?: number
          ts?: string
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          id: string
          last_edited_by: string | null
          pinned: boolean
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number
        }
        Insert: {
          author_id: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          last_edited_by?: string | null
          pinned?: boolean
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          id?: string
          last_edited_by?: string | null
          pinned?: boolean
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: []
      }
      kpi_goals: {
        Row: {
          created_at: string
          current_value: number | null
          id: string
          metric_name: string
          notes: string | null
          period: string
          status: string
          target_value: number
          unit: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_value?: number | null
          id?: string
          metric_name: string
          notes?: string | null
          period?: string
          status?: string
          target_value: number
          unit?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_value?: number | null
          id?: string
          metric_name?: string
          notes?: string | null
          period?: string
          status?: string
          target_value?: number
          unit?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_imports: {
        Row: {
          added_count: number | null
          created_at: string
          duplicate_count: number | null
          id: string
          import_log: Json | null
          imported_by: string
          skipped_count: number | null
          source_type: Database["public"]["Enums"]["lead_source"]
          total_count: number | null
        }
        Insert: {
          added_count?: number | null
          created_at?: string
          duplicate_count?: number | null
          id?: string
          import_log?: Json | null
          imported_by: string
          skipped_count?: number | null
          source_type: Database["public"]["Enums"]["lead_source"]
          total_count?: number | null
        }
        Update: {
          added_count?: number | null
          created_at?: string
          duplicate_count?: number | null
          id?: string
          import_log?: Json | null
          imported_by?: string
          skipped_count?: number | null
          source_type?: Database["public"]["Enums"]["lead_source"]
          total_count?: number | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          lead_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          id: string
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status"]
          old_status: Database["public"]["Enums"]["lead_status"] | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          id?: string
          lead_id: string
          new_status: Database["public"]["Enums"]["lead_status"]
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          id?: string
          lead_id?: string
          new_status?: Database["public"]["Enums"]["lead_status"]
          old_status?: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_status_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          business_name: string | null
          category: string | null
          contact_name: string | null
          converted_client_id: string | null
          created_at: string
          email: string | null
          enquiry_data: Json | null
          enquiry_id: string | null
          google_rating: number | null
          id: string
          is_personal: boolean | null
          last_contacted_at: string | null
          location_city: string | null
          location_postcode: string | null
          personal_name: string | null
          phone: string | null
          review_count: number | null
          source: Database["public"]["Enums"]["lead_source"] | null
          status: Database["public"]["Enums"]["lead_status"] | null
          tags: Json | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          assigned_to?: string | null
          business_name?: string | null
          category?: string | null
          contact_name?: string | null
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          enquiry_data?: Json | null
          enquiry_id?: string | null
          google_rating?: number | null
          id?: string
          is_personal?: boolean | null
          last_contacted_at?: string | null
          location_city?: string | null
          location_postcode?: string | null
          personal_name?: string | null
          phone?: string | null
          review_count?: number | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: Json | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          assigned_to?: string | null
          business_name?: string | null
          category?: string | null
          contact_name?: string | null
          converted_client_id?: string | null
          created_at?: string
          email?: string | null
          enquiry_data?: Json | null
          enquiry_id?: string | null
          google_rating?: number | null
          id?: string
          is_personal?: boolean | null
          last_contacted_at?: string | null
          location_city?: string | null
          location_postcode?: string | null
          personal_name?: string | null
          phone?: string | null
          review_count?: number | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: Json | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_page_views: {
        Row: {
          country: string | null
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      memory_nodes: {
        Row: {
          agent: string | null
          depth: number
          detail: Json | null
          id: string
          kind: string
          model_id: string | null
          ok: boolean | null
          parent_id: string | null
          path: string
          project_id: string | null
          root_id: string | null
          source: string
          summary: string
          task_id: string | null
          title: string
          tokens_in: number | null
          tokens_out: number | null
          ts: string
        }
        Insert: {
          agent?: string | null
          depth?: number
          detail?: Json | null
          id?: string
          kind: string
          model_id?: string | null
          ok?: boolean | null
          parent_id?: string | null
          path: string
          project_id?: string | null
          root_id?: string | null
          source?: string
          summary: string
          task_id?: string | null
          title: string
          tokens_in?: number | null
          tokens_out?: number | null
          ts?: string
        }
        Update: {
          agent?: string | null
          depth?: number
          detail?: Json | null
          id?: string
          kind?: string
          model_id?: string | null
          ok?: boolean | null
          parent_id?: string | null
          path?: string
          project_id?: string | null
          root_id?: string | null
          source?: string
          summary?: string
          task_id?: string | null
          title?: string
          tokens_in?: number | null
          tokens_out?: number | null
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "memory_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      mesh_config: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      mesh_projects: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          status?: string
        }
        Relationships: []
      }
      mesh_worker_file_seen: {
        Row: {
          file_path: string
          project_id: string
          seen_at: string
          sha: string
          worker: string
        }
        Insert: {
          file_path: string
          project_id: string
          seen_at?: string
          sha: string
          worker: string
        }
        Update: {
          file_path?: string
          project_id?: string
          seen_at?: string
          sha?: string
          worker?: string
        }
        Relationships: [
          {
            foreignKeyName: "mesh_worker_file_seen_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mesh_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      model_health: {
        Row: {
          consecutive_failures: number
          cooldown_until: string | null
          error_rate: number
          median_latency_ms: number | null
          model_id: string
          parked: boolean
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number
          cooldown_until?: string | null
          error_rate?: number
          median_latency_ms?: number | null
          model_id: string
          parked?: boolean
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number
          cooldown_until?: string | null
          error_rate?: number
          median_latency_ms?: number | null
          model_id?: string
          parked?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "model_health_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: true
            referencedRelation: "model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      model_registry: {
        Row: {
          adapter: string
          adapter_config: Json
          capabilities: string[]
          concurrency: number
          context_window: number | null
          cost_class: string
          created_at: string
          display_name: string
          endpoint: string
          env_key: string
          id: string
          is_enabled: boolean
          limits_source: string
          max_output: number | null
          notes: string
          quality_rank: Json
          rpd: number | null
          rpm: number | null
          supports_json_mode: boolean | null
          supports_prompt_cache: boolean
          tpd: number | null
          tpm: number | null
          verified_at: string | null
        }
        Insert: {
          adapter: string
          adapter_config?: Json
          capabilities?: string[]
          concurrency?: number
          context_window?: number | null
          cost_class: string
          created_at?: string
          display_name: string
          endpoint?: string
          env_key?: string
          id: string
          is_enabled?: boolean
          limits_source?: string
          max_output?: number | null
          notes?: string
          quality_rank?: Json
          rpd?: number | null
          rpm?: number | null
          supports_json_mode?: boolean | null
          supports_prompt_cache?: boolean
          tpd?: number | null
          tpm?: number | null
          verified_at?: string | null
        }
        Update: {
          adapter?: string
          adapter_config?: Json
          capabilities?: string[]
          concurrency?: number
          context_window?: number | null
          cost_class?: string
          created_at?: string
          display_name?: string
          endpoint?: string
          env_key?: string
          id?: string
          is_enabled?: boolean
          limits_source?: string
          max_output?: number | null
          notes?: string
          quality_rank?: Json
          rpd?: number | null
          rpm?: number | null
          supports_json_mode?: boolean | null
          supports_prompt_cache?: boolean
          tpd?: number | null
          tpm?: number | null
          verified_at?: string | null
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_approvals: boolean
          email_deadlines: boolean
          email_file_uploads: boolean
          email_payments: boolean
          email_project_updates: boolean
          id: string
          in_app_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_approvals?: boolean
          email_deadlines?: boolean
          email_file_uploads?: boolean
          email_payments?: boolean
          email_project_updates?: boolean
          id?: string
          in_app_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_approvals?: boolean
          email_deadlines?: boolean
          email_file_uploads?: boolean
          email_payments?: boolean
          email_project_updates?: boolean
          id?: string
          in_app_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          is_email_sent: boolean
          is_read: boolean
          link: string | null
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          is_email_sent?: boolean
          is_read?: boolean
          link?: string | null
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          is_email_sent?: boolean
          is_read?: boolean
          link?: string | null
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      office_documents: {
        Row: {
          content: Json | null
          created_at: string
          document_type: string
          id: string
          is_starred: boolean | null
          is_template: boolean | null
          last_edited_by: string | null
          margins: Json | null
          page_orientation: string | null
          page_size: string | null
          shared_with: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          content?: Json | null
          created_at?: string
          document_type?: string
          id?: string
          is_starred?: boolean | null
          is_template?: boolean | null
          last_edited_by?: string | null
          margins?: Json | null
          page_orientation?: string | null
          page_size?: string | null
          shared_with?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          content?: Json | null
          created_at?: string
          document_type?: string
          id?: string
          is_starred?: boolean | null
          is_template?: boolean | null
          last_edited_by?: string | null
          margins?: Json | null
          page_orientation?: string | null
          page_size?: string | null
          shared_with?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      office_notebook_shares: {
        Row: {
          granted_at: string
          granted_by: string | null
          grantee_id: string
          notebook_id: string
          permission: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          grantee_id: string
          notebook_id: string
          permission?: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          grantee_id?: string
          notebook_id?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_notebook_shares_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "office_shared_notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      office_objects: {
        Row: {
          grid_x: number
          grid_y: number
          hotspot_binding: string | null
          hotspot_label: string | null
          id: string
          kit_ref: string
          room_id: string | null
          rotation: number
        }
        Insert: {
          grid_x?: number
          grid_y?: number
          hotspot_binding?: string | null
          hotspot_label?: string | null
          id?: string
          kit_ref: string
          room_id?: string | null
          rotation?: number
        }
        Update: {
          grid_x?: number
          grid_y?: number
          hotspot_binding?: string | null
          hotspot_label?: string | null
          id?: string
          kit_ref?: string
          room_id?: string | null
          rotation?: number
        }
        Relationships: [
          {
            foreignKeyName: "office_objects_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "office_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      office_poll_options: {
        Row: {
          created_at: string | null
          id: string
          poll_id: string
          sort_order: number | null
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          poll_id: string
          sort_order?: number | null
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          poll_id?: string
          sort_order?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "office_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      office_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          voter_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "office_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "office_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "office_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "office_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      office_polls: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          user_id?: string
        }
        Relationships: []
      }
      office_rooms: {
        Row: {
          bounds: Json | null
          floor: number
          id: string
          name: string
          purpose: string
        }
        Insert: {
          bounds?: Json | null
          floor: number
          id?: string
          name: string
          purpose?: string
        }
        Update: {
          bounds?: Json | null
          floor?: number
          id?: string
          name?: string
          purpose?: string
        }
        Relationships: []
      }
      office_shared_notebook_pages: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          images: Json
          locked: boolean
          notebook_id: string
          position: number
          starred: boolean
          tags: Json
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          images?: Json
          locked?: boolean
          notebook_id: string
          position?: number
          starred?: boolean
          tags?: Json
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          images?: Json
          locked?: boolean
          notebook_id?: string
          position?: number
          starred?: boolean
          tags?: Json
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "office_shared_notebook_pages_notebook_id_fkey"
            columns: ["notebook_id"]
            isOneToOne: false
            referencedRelation: "office_shared_notebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      office_shared_notebooks: {
        Row: {
          colour: string
          created_at: string
          id: string
          name: string
          owner_id: string
          pages: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          colour?: string
          created_at?: string
          id?: string
          name: string
          owner_id: string
          pages?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          colour?: string
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          pages?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      password_vault_configs: {
        Row: {
          created_at: string
          failed_attempts: number
          id: string
          is_locked: boolean
          last_failed_at: string | null
          master_key_encrypted: string
          master_key_hash: string
          password_hash: string
          security_questions: Json
          totp_secret_encrypted: string
          updated_at: string
          user_id: string
          vault_name: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          id?: string
          is_locked?: boolean
          last_failed_at?: string | null
          master_key_encrypted: string
          master_key_hash: string
          password_hash: string
          security_questions: Json
          totp_secret_encrypted: string
          updated_at?: string
          user_id: string
          vault_name?: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          id?: string
          is_locked?: boolean
          last_failed_at?: string | null
          master_key_encrypted?: string
          master_key_hash?: string
          password_hash?: string
          security_questions?: Json
          totp_secret_encrypted?: string
          updated_at?: string
          user_id?: string
          vault_name?: string
        }
        Relationships: []
      }
      password_vault_items: {
        Row: {
          category: string
          created_at: string
          has_2fa: boolean
          id: string
          notes_encrypted: string | null
          password_encrypted: string | null
          starred: boolean
          title_encrypted: string
          updated_at: string
          url_encrypted: string | null
          user_id: string
          username_encrypted: string | null
          vault_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          has_2fa?: boolean
          id?: string
          notes_encrypted?: string | null
          password_encrypted?: string | null
          starred?: boolean
          title_encrypted: string
          updated_at?: string
          url_encrypted?: string | null
          user_id: string
          username_encrypted?: string | null
          vault_id: string
        }
        Update: {
          category?: string
          created_at?: string
          has_2fa?: boolean
          id?: string
          notes_encrypted?: string | null
          password_encrypted?: string | null
          starred?: boolean
          title_encrypted?: string
          updated_at?: string
          url_encrypted?: string | null
          user_id?: string
          username_encrypted?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_vault_items_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "password_vault_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      pattern_memory: {
        Row: {
          created_at: string
          embedding: string | null
          id: string
          input_summary: string
          kind: string
          output: string
          uses: number
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          id?: string
          input_summary: string
          kind: string
          output: string
          uses?: number
        }
        Update: {
          created_at?: string
          embedding?: string | null
          id?: string
          input_summary?: string
          kind?: string
          output?: string
          uses?: number
        }
        Relationships: []
      }
      planner_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          parent_task_id: string | null
          priority: string
          progress: number | null
          sort_order: number | null
          start_date: string | null
          status: string
          tags: string[] | null
          team_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          sort_order?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          team_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          parent_task_id?: string | null
          priority?: string
          progress?: number | null
          sort_order?: number | null
          start_date?: string | null
          status?: string
          tags?: string[] | null
          team_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planner_tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "planner_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "planner_tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_files: {
        Row: {
          app_source: string
          created_at: string
          description: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          folder_path: string
          id: string
          is_starred: boolean
          is_trashed: boolean
          metadata: Json | null
          source_id: string | null
          source_route: string | null
          thumbnail_url: string | null
          trashed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_source: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          folder_path?: string
          id?: string
          is_starred?: boolean
          is_trashed?: boolean
          metadata?: Json | null
          source_id?: string | null
          source_route?: string | null
          thumbnail_url?: string | null
          trashed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_source?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          folder_path?: string
          id?: string
          is_starred?: boolean
          is_trashed?: boolean
          metadata?: Json | null
          source_id?: string | null
          source_route?: string | null
          thumbnail_url?: string | null
          trashed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_files_dedupe_backup: {
        Row: {
          app_source: string
          created_at: string
          description: string | null
          file_name: string
          file_size_bytes: number | null
          file_type: string
          folder_path: string
          id: string
          is_starred: boolean
          is_trashed: boolean
          metadata: Json | null
          source_id: string | null
          source_route: string | null
          thumbnail_url: string | null
          trashed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_source: string
          created_at?: string
          description?: string | null
          file_name: string
          file_size_bytes?: number | null
          file_type: string
          folder_path?: string
          id?: string
          is_starred?: boolean
          is_trashed?: boolean
          metadata?: Json | null
          source_id?: string | null
          source_route?: string | null
          thumbnail_url?: string | null
          trashed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_source?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string
          folder_path?: string
          id?: string
          is_starred?: boolean
          is_trashed?: boolean
          metadata?: Json | null
          source_id?: string | null
          source_route?: string | null
          thumbnail_url?: string | null
          trashed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_folders: {
        Row: {
          color: string | null
          created_at: string
          folder_name: string
          full_path: string
          icon: string | null
          id: string
          parent_path: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          folder_name: string
          full_path: string
          icon?: string | null
          id?: string
          parent_path?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          folder_name?: string
          full_path?: string
          icon?: string | null
          id?: string
          parent_path?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_op_log: {
        Row: {
          actor: string
          detail: string | null
          id: string
          match: Json | null
          op: string
          outcome: string
          payload_keys: string[] | null
          reason: string | null
          rows_affected: number | null
          table_name: string | null
          task_id: string | null
          ts: string
        }
        Insert: {
          actor: string
          detail?: string | null
          id?: string
          match?: Json | null
          op: string
          outcome: string
          payload_keys?: string[] | null
          reason?: string | null
          rows_affected?: number | null
          table_name?: string | null
          task_id?: string | null
          ts?: string
        }
        Update: {
          actor?: string
          detail?: string | null
          id?: string
          match?: Json | null
          op?: string
          outcome?: string
          payload_keys?: string[] | null
          reason?: string | null
          rows_affected?: number | null
          table_name?: string | null
          task_id?: string | null
          ts?: string
        }
        Relationships: []
      }
      platform_op_policy: {
        Row: {
          can_delete: boolean
          can_insert: boolean
          can_read: boolean
          can_update: boolean
          denied_columns: string[]
          max_rows: number
          notes: string | null
          table_name: string
        }
        Insert: {
          can_delete?: boolean
          can_insert?: boolean
          can_read?: boolean
          can_update?: boolean
          denied_columns?: string[]
          max_rows?: number
          notes?: string | null
          table_name: string
        }
        Update: {
          can_delete?: boolean
          can_insert?: boolean
          can_read?: boolean
          can_update?: boolean
          denied_columns?: string[]
          max_rows?: number
          notes?: string | null
          table_name?: string
        }
        Relationships: []
      }
      platform_owners: {
        Row: {
          added_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_secrets: {
        Row: {
          created_at: string
          name: string
          note: string | null
          rotated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          name: string
          note?: string | null
          rotated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          name?: string
          note?: string | null
          rotated_at?: string
          value?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          channel_id: string | null
          created_at: string
          id: string
          message_id: string | null
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string
          id?: string
          message_id?: string | null
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "comm_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "comm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      pomodoro_sessions: {
        Row: {
          completed_at: string
          duration_minutes: number
          id: string
          session_type: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          duration_minutes?: number
          id?: string
          session_type?: string
          user_id?: string
        }
        Relationships: []
      }
      preview_login_attempts: {
        Row: {
          attempted_at: string
          id: number
          ip_hash: string
          preview_id: string | null
          succeeded: boolean
        }
        Insert: {
          attempted_at?: string
          id?: number
          ip_hash: string
          preview_id?: string | null
          succeeded?: boolean
        }
        Update: {
          attempted_at?: string
          id?: number
          ip_hash?: string
          preview_id?: string | null
          succeeded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "preview_login_attempts_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "previews"
            referencedColumns: ["id"]
          },
        ]
      }
      preview_path_redirects: {
        Row: {
          created_at: string
          expires_at: string
          old_path: string
          preview_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          old_path: string
          preview_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          old_path?: string
          preview_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "preview_path_redirects_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "previews"
            referencedColumns: ["id"]
          },
        ]
      }
      preview_reserved_paths: {
        Row: {
          path: string
        }
        Insert: {
          path: string
        }
        Update: {
          path?: string
        }
        Relationships: []
      }
      preview_versions: {
        Row: {
          file_count: number
          id: string
          preview_id: string
          size_bytes: number
          storage_prefix: string
          uploaded_at: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          file_count?: number
          id?: string
          preview_id: string
          size_bytes?: number
          storage_prefix: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          file_count?: number
          id?: string
          preview_id?: string
          size_bytes?: number
          storage_prefix?: string
          uploaded_at?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "preview_versions_preview_id_fkey"
            columns: ["preview_id"]
            isOneToOne: false
            referencedRelation: "previews"
            referencedColumns: ["id"]
          },
        ]
      }
      previews: {
        Row: {
          client_name: string
          contact_id: string | null
          created_at: string
          created_by: string | null
          current_version_id: string | null
          expires_at: string | null
          id: string
          last_viewed_at: string | null
          password_hash: string
          password_version: number
          path: string
          size_bytes: number
          status: string
          storage_prefix: string
          updated_at: string
          view_count: number
        }
        Insert: {
          client_name: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          password_hash: string
          password_version?: number
          path: string
          size_bytes?: number
          status?: string
          storage_prefix: string
          updated_at?: string
          view_count?: number
        }
        Update: {
          client_name?: string
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          current_version_id?: string | null
          expires_at?: string | null
          id?: string
          last_viewed_at?: string | null
          password_hash?: string
          password_version?: number
          path?: string
          size_bytes?: number
          status?: string
          storage_prefix?: string
          updated_at?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "previews_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "previews_current_version_fk"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "preview_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          site_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          site_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          site_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          compare_at_price: number | null
          created_at: string
          id: string
          image_url: string | null
          inventory_count: number | null
          is_default: boolean | null
          name: string
          options: Json | null
          price: number | null
          product_id: string
          sku: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_default?: boolean | null
          name: string
          options?: Json | null
          price?: number | null
          product_id: string
          sku?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_default?: boolean | null
          name?: string
          options?: Json | null
          price?: number | null
          product_id?: string
          sku?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: Json | null
          inventory_count: number | null
          is_digital: boolean | null
          is_featured: boolean | null
          metadata: Json | null
          name: string
          price: number
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          site_id: string | null
          sku: string | null
          slug: string
          sort_order: number | null
          status: string
          tags: string[] | null
          track_inventory: boolean | null
          updated_at: string
          user_id: string
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name: string
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          site_id?: string | null
          sku?: string | null
          slug: string
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string
          user_id: string
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json | null
          inventory_count?: number | null
          is_digital?: boolean | null
          is_featured?: boolean | null
          metadata?: Json | null
          name?: string
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          site_id?: string | null
          sku?: string | null
          slug?: string
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string
          user_id?: string
          weight?: number | null
          weight_unit?: string | null
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
            foreignKeyName: "products_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string
          avatar_url: string | null
          backup_codes: Json | null
          company: string | null
          created_at: string
          customer_id: string | null
          domain_name: string | null
          email: string | null
          email_verified: boolean | null
          enquiry_data: Json | null
          enquiry_id: string | null
          full_name: string | null
          hosting_provider: string | null
          id: string
          industry: string | null
          is_owner: boolean
          known_ips: string[] | null
          last_updated_at: string | null
          notes: string | null
          page_count: string | null
          phone: string | null
          plan: string | null
          preview_url: string | null
          site_files_url: string | null
          site_published_at: string | null
          ssl_status: string | null
          status: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          two_factor_verified_at: string | null
          updated_at: string
          user_id: string
          verification_expires_at: string | null
          verification_resend_count: number | null
          verification_resend_reset_at: string | null
          verification_sent_at: string | null
          verification_token: string | null
          version_history: Json | null
          website_status: string | null
        }
        Insert: {
          account_type?: string
          avatar_url?: string | null
          backup_codes?: Json | null
          company?: string | null
          created_at?: string
          customer_id?: string | null
          domain_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          enquiry_data?: Json | null
          enquiry_id?: string | null
          full_name?: string | null
          hosting_provider?: string | null
          id?: string
          industry?: string | null
          is_owner?: boolean
          known_ips?: string[] | null
          last_updated_at?: string | null
          notes?: string | null
          page_count?: string | null
          phone?: string | null
          plan?: string | null
          preview_url?: string | null
          site_files_url?: string | null
          site_published_at?: string | null
          ssl_status?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified_at?: string | null
          updated_at?: string
          user_id: string
          verification_expires_at?: string | null
          verification_resend_count?: number | null
          verification_resend_reset_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
          version_history?: Json | null
          website_status?: string | null
        }
        Update: {
          account_type?: string
          avatar_url?: string | null
          backup_codes?: Json | null
          company?: string | null
          created_at?: string
          customer_id?: string | null
          domain_name?: string | null
          email?: string | null
          email_verified?: boolean | null
          enquiry_data?: Json | null
          enquiry_id?: string | null
          full_name?: string | null
          hosting_provider?: string | null
          id?: string
          industry?: string | null
          is_owner?: boolean
          known_ips?: string[] | null
          last_updated_at?: string | null
          notes?: string | null
          page_count?: string | null
          phone?: string | null
          plan?: string | null
          preview_url?: string | null
          site_files_url?: string | null
          site_published_at?: string | null
          ssl_status?: string | null
          status?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          two_factor_verified_at?: string | null
          updated_at?: string
          user_id?: string
          verification_expires_at?: string | null
          verification_resend_count?: number | null
          verification_resend_reset_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
          version_history?: Json | null
          website_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_enquiry_id_fkey"
            columns: ["enquiry_id"]
            isOneToOne: false
            referencedRelation: "enquiries"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          acceptance_token: string | null
          accepted_at: string | null
          accepted_by_email: string | null
          accepted_by_name: string | null
          accepted_ip: string | null
          client_company: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          crm_company_id: string | null
          crm_contact_id: string | null
          crm_opportunity_id: string | null
          currency: string | null
          deal_id: string | null
          id: string
          introduction: string | null
          lead_id: string | null
          notes: string | null
          pricing_items: Json | null
          proposal_number: string
          scope_items: Json | null
          sent_at: string | null
          status: string
          template_type: string
          terms: string | null
          title: string
          total_amount: number | null
          updated_at: string
          user_id: string
          valid_until: string | null
        }
        Insert: {
          acceptance_token?: string | null
          accepted_at?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          accepted_ip?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          crm_company_id?: string | null
          crm_contact_id?: string | null
          crm_opportunity_id?: string | null
          currency?: string | null
          deal_id?: string | null
          id?: string
          introduction?: string | null
          lead_id?: string | null
          notes?: string | null
          pricing_items?: Json | null
          proposal_number: string
          scope_items?: Json | null
          sent_at?: string | null
          status?: string
          template_type?: string
          terms?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
          valid_until?: string | null
        }
        Update: {
          acceptance_token?: string | null
          accepted_at?: string | null
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          accepted_ip?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          crm_company_id?: string | null
          crm_contact_id?: string | null
          crm_opportunity_id?: string | null
          currency?: string | null
          deal_id?: string | null
          id?: string
          introduction?: string | null
          lead_id?: string | null
          notes?: string | null
          pricing_items?: Json | null
          proposal_number?: string
          scope_items?: Json | null
          sent_at?: string | null
          status?: string
          template_type?: string
          terms?: string | null
          title?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_crm_company_id_fkey"
            columns: ["crm_company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_crm_contact_id_fkey"
            columns: ["crm_contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_crm_opportunity_id_fkey"
            columns: ["crm_opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_deals_compat"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_crm_opportunity_id_fkey"
            columns: ["crm_opportunity_id"]
            isOneToOne: false
            referencedRelation: "crm_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          attempts: number
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          key: string
          user_id: string | null
          window_start: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          key: string
          user_id?: string | null
          window_start?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          key?: string
          user_id?: string | null
          window_start?: string
        }
        Relationships: []
      }
      rbac_audit_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          entity_id: string | null
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
          performed_by: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          performed_by?: string | null
        }
        Relationships: []
      }
      rbac_permissions: {
        Row: {
          action: string
          created_at: string
          granted: boolean
          id: string
          module: string
          role_id: string
        }
        Insert: {
          action: string
          created_at?: string
          granted?: boolean
          id?: string
          module: string
          role_id: string
        }
        Update: {
          action?: string
          created_at?: string
          granted?: boolean
          id?: string
          module?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rbac_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rbac_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      rbac_roles: {
        Row: {
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          hoist: boolean | null
          icon: string | null
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          position: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hoist?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          position?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hoist?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          position?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rbac_user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rbac_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "rbac_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_allocations: {
        Row: {
          assigned_to: string
          created_at: string
          deal_id: string | null
          hours_allocated: number
          hours_spent: number
          id: string
          priority: string | null
          project_id: string | null
          status: string | null
          task_description: string | null
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          assigned_to: string
          created_at?: string
          deal_id?: string | null
          hours_allocated?: number
          hours_spent?: number
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          task_description?: string | null
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          assigned_to?: string
          created_at?: string
          deal_id?: string | null
          hours_allocated?: number
          hours_spent?: number
          id?: string
          priority?: string | null
          project_id?: string | null
          status?: string | null
          task_description?: string | null
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_allocations_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_allocations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "app_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      response_cache: {
        Row: {
          created_at: string
          expires_at: string
          hits: number
          input_hash: string
          model: string
          output: string
          tokens_saved: number
        }
        Insert: {
          created_at?: string
          expires_at: string
          hits?: number
          input_hash: string
          model: string
          output: string
          tokens_saved?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          hits?: number
          input_hash?: string
          model?: string
          output?: string
          tokens_saved?: number
        }
        Relationships: []
      }
      saved_templates: {
        Row: {
          category: string
          created_at: string
          description: string
          elements: Json
          id: string
          is_public: boolean
          name: string
          pages: Json | null
          thumbnail: string | null
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          elements?: Json
          id?: string
          is_public?: boolean
          name: string
          pages?: Json | null
          thumbnail?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          elements?: Json
          id?: string
          is_public?: boolean
          name?: string
          pages?: Json | null
          thumbnail?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_logs: {
        Row: {
          actual_role: string | null
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          portal_attempted: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          actual_role?: string | null
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          portal_attempted?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          actual_role?: string | null
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          portal_attempted?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      site_bookings: {
        Row: {
          booking_date: string
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          duration_minutes: number | null
          end_time: string | null
          id: string
          notes: string | null
          payment_intent_id: string | null
          price: number | null
          service_name: string
          site_id: string
          start_time: string
          status: string | null
          updated_at: string
          user_id: string
          visitor_id: string | null
        }
        Insert: {
          booking_date: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          payment_intent_id?: string | null
          price?: number | null
          service_name: string
          site_id: string
          start_time: string
          status?: string | null
          updated_at?: string
          user_id: string
          visitor_id?: string | null
        }
        Update: {
          booking_date?: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          id?: string
          notes?: string | null
          payment_intent_id?: string | null
          price?: number | null
          service_name?: string
          site_id?: string
          start_time?: string
          status?: string | null
          updated_at?: string
          user_id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_bookings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_bookings_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "site_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      site_business_settings: {
        Row: {
          booking_days: string[]
          booking_end_time: string
          booking_slot_duration: number
          booking_start_time: string
          created_at: string
          id: string
          site_id: string
          updated_at: string
        }
        Insert: {
          booking_days?: string[]
          booking_end_time?: string
          booking_slot_duration?: number
          booking_start_time?: string
          created_at?: string
          id?: string
          site_id: string
          updated_at?: string
        }
        Update: {
          booking_days?: string[]
          booking_end_time?: string
          booking_slot_duration?: number
          booking_start_time?: string
          created_at?: string
          id?: string
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_business_settings_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_carts: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          items: Json
          session_id: string
          site_id: string
          status: string | null
          subtotal: number | null
          updated_at: string
          visitor_email: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          items?: Json
          session_id: string
          site_id: string
          status?: string | null
          subtotal?: number | null
          updated_at?: string
          visitor_email?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          items?: Json
          session_id?: string
          site_id?: string
          status?: string | null
          subtotal?: number | null
          updated_at?: string
          visitor_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_carts_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          created_at: string
          data: Json
          id: string
          section_key: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          section_key: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          section_key?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_deployments: {
        Row: {
          build_log: Json | null
          created_at: string
          custom_domain: string | null
          deployed_at: string | null
          file_count: number | null
          id: string
          live_url: string | null
          page_count: number | null
          site_id: string
          status: string
          storage_path: string | null
          subdomain: string | null
          total_size_bytes: number | null
          updated_at: string
          user_id: string
          version_number: number
        }
        Insert: {
          build_log?: Json | null
          created_at?: string
          custom_domain?: string | null
          deployed_at?: string | null
          file_count?: number | null
          id?: string
          live_url?: string | null
          page_count?: number | null
          site_id: string
          status?: string
          storage_path?: string | null
          subdomain?: string | null
          total_size_bytes?: number | null
          updated_at?: string
          user_id: string
          version_number?: number
        }
        Update: {
          build_log?: Json | null
          created_at?: string
          custom_domain?: string | null
          deployed_at?: string | null
          file_count?: number | null
          id?: string
          live_url?: string | null
          page_count?: number | null
          site_id?: string
          status?: string
          storage_path?: string | null
          subdomain?: string | null
          total_size_bytes?: number | null
          updated_at?: string
          user_id?: string
          version_number?: number
        }
        Relationships: []
      }
      site_domains: {
        Row: {
          created_at: string
          dns_instructions: Json | null
          dns_verified: boolean | null
          domain_name: string
          domain_type: string
          id: string
          site_id: string
          ssl_active: boolean | null
          status: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          dns_instructions?: Json | null
          dns_verified?: boolean | null
          domain_name: string
          domain_type?: string
          id?: string
          site_id: string
          ssl_active?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          dns_instructions?: Json | null
          dns_verified?: boolean | null
          domain_name?: string
          domain_type?: string
          id?: string
          site_id?: string
          ssl_active?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      site_form_submissions: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          form_id: string
          form_name: string
          id: string
          ip_hash: string | null
          is_read: boolean
          is_spam: boolean
          page_slug: string
          payload: Json
          referer: string | null
          site_id: string
          submitted_at: string
          user_agent: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          form_id?: string
          form_name?: string
          id?: string
          ip_hash?: string | null
          is_read?: boolean
          is_spam?: boolean
          page_slug?: string
          payload?: Json
          referer?: string | null
          site_id: string
          submitted_at?: string
          user_agent?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          form_id?: string
          form_name?: string
          id?: string
          ip_hash?: string | null
          is_read?: boolean
          is_spam?: boolean
          page_slug?: string
          payload?: Json
          referer?: string | null
          site_id?: string
          submitted_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_form_submissions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          currency: string | null
          customer_email: string | null
          customer_name: string | null
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_intent_id: string | null
          shipping_address: Json | null
          shipping_amount: number | null
          site_id: string
          status: string | null
          subtotal: number
          tax_amount: number | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number: string
          payment_intent_id?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          site_id: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          customer_name?: string | null
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_intent_id?: string | null
          shipping_address?: Json | null
          shipping_amount?: number | null
          site_id?: string
          status?: string | null
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_orders_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_products: {
        Row: {
          category: string | null
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string | null
          id: string
          images: Json | null
          inv_product_id: string | null
          inventory_count: number | null
          name: string
          price: number
          site_id: string
          slug: string
          sort_order: number | null
          status: string
          tags: string[] | null
          track_inventory: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json | null
          inv_product_id?: string | null
          inventory_count?: number | null
          name: string
          price?: number
          site_id: string
          slug: string
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          images?: Json | null
          inv_product_id?: string | null
          inventory_count?: number | null
          name?: string
          price?: number
          site_id?: string
          slug?: string
          sort_order?: number | null
          status?: string
          tags?: string[] | null
          track_inventory?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_products_inv_product_id_fkey"
            columns: ["inv_product_id"]
            isOneToOne: false
            referencedRelation: "inv_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_products_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visitor_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          session_token: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          session_token: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          session_token?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visitor_sessions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "site_visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visitors: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_verified: boolean | null
          last_login_at: string | null
          metadata: Json | null
          password_hash: string | null
          phone: string | null
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_login_at?: string | null
          metadata?: Json | null
          password_hash?: string | null
          phone?: string | null
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          last_login_at?: string | null
          metadata?: Json | null
          password_hash?: string | null
          phone?: string | null
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_visitors_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "designer_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      social_media_accounts: {
        Row: {
          account_handle: string
          account_name: string | null
          created_at: string
          id: string
          managed_by: string | null
          notes: string | null
          platform: string
          posting_frequency: string | null
          profile_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_handle: string
          account_name?: string | null
          created_at?: string
          id?: string
          managed_by?: string | null
          notes?: string | null
          platform: string
          posting_frequency?: string | null
          profile_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_handle?: string
          account_name?: string | null
          created_at?: string
          id?: string
          managed_by?: string | null
          notes?: string | null
          platform?: string
          posting_frequency?: string | null
          profile_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_media_posts: {
        Row: {
          account_id: string
          content: string | null
          created_at: string
          id: string
          media_type: string | null
          media_url: string | null
          notes: string | null
          posted_at: string | null
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          notes?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          content?: string | null
          created_at?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          notes?: string | null
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_media_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      splash_screens: {
        Row: {
          config: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          origin: string
          surface: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          origin?: string
          surface?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          origin?: string
          surface?: string
          updated_at?: string
        }
        Relationships: []
      }
      sticky_walls: {
        Row: {
          created_at: string
          id: string
          is_starred: boolean
          name: string
          notes: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_starred?: boolean
          name?: string
          notes?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_starred?: boolean
          name?: string
          notes?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      storage_quotas: {
        Row: {
          created_at: string
          id: string
          quota_bytes: number
          updated_at: string
          used_bytes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quota_bytes?: number
          updated_at?: string
          used_bytes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quota_bytes?: number
          updated_at?: string
          used_bytes?: number
          user_id?: string
        }
        Relationships: []
      }
      subscription_site_events: {
        Row: {
          actor: string | null
          actor_user_id: string | null
          detail: Json | null
          event_type: string
          id: string
          occurred_at: string
          subscription_site_id: string
        }
        Insert: {
          actor?: string | null
          actor_user_id?: string | null
          detail?: Json | null
          event_type: string
          id?: string
          occurred_at?: string
          subscription_site_id: string
        }
        Update: {
          actor?: string | null
          actor_user_id?: string | null
          detail?: Json | null
          event_type?: string
          id?: string
          occurred_at?: string
          subscription_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_site_events_subscription_site_id_fkey"
            columns: ["subscription_site_id"]
            isOneToOne: false
            referencedRelation: "subscription_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_sites: {
        Row: {
          acc_customer_id: string | null
          acc_org_id: string | null
          acc_revenue_account_id: string | null
          account_manager_user_id: string | null
          auto_invoice: boolean
          billing_amount: number | null
          billing_currency: string | null
          billing_cycle: string | null
          client_company_id: string | null
          client_name: string | null
          created_at: string
          hero_image_url: string | null
          hosting_provider: string | null
          hosting_status: string
          id: string
          is_hosted_only: boolean
          last_invoiced_on: string | null
          next_billing_date: string | null
          next_renewal_date: string | null
          notes: string | null
          owner_user_id: string
          site_name: string
          site_url: string | null
          status: string
          subscription_start_date: string | null
          template_used: string | null
          updated_at: string
        }
        Insert: {
          acc_customer_id?: string | null
          acc_org_id?: string | null
          acc_revenue_account_id?: string | null
          account_manager_user_id?: string | null
          auto_invoice?: boolean
          billing_amount?: number | null
          billing_currency?: string | null
          billing_cycle?: string | null
          client_company_id?: string | null
          client_name?: string | null
          created_at?: string
          hero_image_url?: string | null
          hosting_provider?: string | null
          hosting_status?: string
          id?: string
          is_hosted_only?: boolean
          last_invoiced_on?: string | null
          next_billing_date?: string | null
          next_renewal_date?: string | null
          notes?: string | null
          owner_user_id: string
          site_name: string
          site_url?: string | null
          status?: string
          subscription_start_date?: string | null
          template_used?: string | null
          updated_at?: string
        }
        Update: {
          acc_customer_id?: string | null
          acc_org_id?: string | null
          acc_revenue_account_id?: string | null
          account_manager_user_id?: string | null
          auto_invoice?: boolean
          billing_amount?: number | null
          billing_currency?: string | null
          billing_cycle?: string | null
          client_company_id?: string | null
          client_name?: string | null
          created_at?: string
          hero_image_url?: string | null
          hosting_provider?: string | null
          hosting_status?: string
          id?: string
          is_hosted_only?: boolean
          last_invoiced_on?: string | null
          next_billing_date?: string | null
          next_renewal_date?: string | null
          notes?: string | null
          owner_user_id?: string
          site_name?: string
          site_url?: string | null
          status?: string
          subscription_start_date?: string | null
          template_used?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_sites_acc_customer_id_fkey"
            columns: ["acc_customer_id"]
            isOneToOne: false
            referencedRelation: "acc_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_sites_acc_org_id_fkey"
            columns: ["acc_org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_sites_acc_revenue_account_id_fkey"
            columns: ["acc_revenue_account_id"]
            isOneToOne: false
            referencedRelation: "acc_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_sites_acc_revenue_account_id_fkey"
            columns: ["acc_revenue_account_id"]
            isOneToOne: false
            referencedRelation: "acc_trial_balance"
            referencedColumns: ["account_id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_conversation_id: string | null
          created_at: string
          id: string
          message: string
          message_id: string | null
          priority: string
          reference_id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_conversation_id?: string | null
          created_at?: string
          id?: string
          message: string
          message_id?: string | null
          priority?: string
          reference_id: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_conversation_id?: string | null
          created_at?: string
          id?: string
          message?: string
          message_id?: string | null
          priority?: string
          reference_id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_ai_conversation_id_fkey"
            columns: ["ai_conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      task_queue: {
        Row: {
          attempts: number
          authorised_owner: string | null
          batch_key: string | null
          capability: string
          created_at: string
          dedupe_hash: string | null
          error: string | null
          id: string
          locked_at: string | null
          locked_by: string | null
          max_attempts: number
          payload: Json
          pinned_model: string | null
          priority: number
          project_id: string | null
          prompt: string
          resolved_by_rung: number | null
          result: Json | null
          run_after: string | null
          status: string
          strict_pin: boolean
          title: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          authorised_owner?: string | null
          batch_key?: string | null
          capability: string
          created_at?: string
          dedupe_hash?: string | null
          error?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          pinned_model?: string | null
          priority?: number
          project_id?: string | null
          prompt?: string
          resolved_by_rung?: number | null
          result?: Json | null
          run_after?: string | null
          status?: string
          strict_pin?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          authorised_owner?: string | null
          batch_key?: string | null
          capability?: string
          created_at?: string
          dedupe_hash?: string | null
          error?: string | null
          id?: string
          locked_at?: string | null
          locked_by?: string | null
          max_attempts?: number
          payload?: Json
          pinned_model?: string | null
          priority?: number
          project_id?: string | null
          prompt?: string
          resolved_by_rung?: number | null
          result?: Json | null
          run_after?: string | null
          status?: string
          strict_pin?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_queue_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "mesh_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      team_branding: {
        Row: {
          default_logo_url: string | null
          id: string
          manager_id: string
          updated_at: string
        }
        Insert: {
          default_logo_url?: string | null
          id?: string
          manager_id: string
          updated_at?: string
        }
        Update: {
          default_logo_url?: string | null
          id?: string
          manager_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_inbox_settings: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          is_available: boolean
          is_primary: boolean
          last_active_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          is_available?: boolean
          is_primary?: boolean
          last_active_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          is_available?: boolean
          is_primary?: boolean
          last_active_at?: string | null
        }
        Relationships: []
      }
      team_memberships: {
        Row: {
          display_name: string | null
          id: string
          invited_by: string | null
          joined_at: string
          member_role: string
          team_id: string
          user_id: string
        }
        Insert: {
          display_name?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          member_role?: string
          team_id: string
          user_id: string
        }
        Update: {
          display_name?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string
          member_role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "client_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      time_entries: {
        Row: {
          billable: boolean | null
          client: string | null
          created_at: string | null
          duration_minutes: number
          id: string
          notes: string | null
          project: string
          project_color: string | null
          rate: number | null
          start_time: string
          tags: string[] | null
          task: string
          user_id: string
        }
        Insert: {
          billable?: boolean | null
          client?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          project?: string
          project_color?: string | null
          rate?: number | null
          start_time?: string
          tags?: string[] | null
          task?: string
          user_id: string
        }
        Update: {
          billable?: boolean | null
          client?: string | null
          created_at?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          project?: string
          project_color?: string | null
          rate?: number | null
          start_time?: string
          tags?: string[] | null
          task?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_invocations: {
        Row: {
          agent_id: string | null
          approved_by_user_id: string | null
          args_redacted: Json
          id: string
          result_status: string | null
          run_id: string | null
          tier: string
          tool: string
          ts: string
          undone_at: string | null
        }
        Insert: {
          agent_id?: string | null
          approved_by_user_id?: string | null
          args_redacted?: Json
          id?: string
          result_status?: string | null
          run_id?: string | null
          tier: string
          tool: string
          ts?: string
          undone_at?: string | null
        }
        Update: {
          agent_id?: string | null
          approved_by_user_id?: string | null
          args_redacted?: Json
          id?: string
          result_status?: string | null
          run_id?: string | null
          tier?: string
          tool?: string
          ts?: string
          undone_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tool_invocations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_invocations_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_attempts: {
        Row: {
          attempt_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          attempt_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          attempt_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      two_factor_challenges: {
        Row: {
          expires_at: string
          passed_at: string
          session_id: string
          user_id: string
        }
        Insert: {
          expires_at?: string
          passed_at?: string
          session_id: string
          user_id: string
        }
        Update: {
          expires_at?: string
          passed_at?: string
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          calls: number
          cost_class: string
          date: string
          headers_seen: boolean
          model_id: string
          ok_calls: number
          rl_remaining_requests: number | null
          rl_reset_at: string | null
          tokens_in: number
          tokens_out: number
          updated_at: string
        }
        Insert: {
          calls?: number
          cost_class?: string
          date: string
          headers_seen?: boolean
          model_id: string
          ok_calls?: number
          rl_remaining_requests?: number | null
          rl_reset_at?: string | null
          tokens_in?: number
          tokens_out?: number
          updated_at?: string
        }
        Update: {
          calls?: number
          cost_class?: string
          date?: string
          headers_seen?: boolean
          model_id?: string
          ok_calls?: number
          rl_remaining_requests?: number | null
          rl_reset_at?: string | null
          tokens_in?: number
          tokens_out?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_counters_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "model_registry"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_ledger: {
        Row: {
          agent: string
          agent_id: string | null
          bridge_id: string | null
          id: number
          input_tokens: number
          model: string
          output_tokens: number
          owner_user_id: string
          run_id: string | null
          ts: string
        }
        Insert: {
          agent?: string
          agent_id?: string | null
          bridge_id?: string | null
          id?: never
          input_tokens?: number
          model?: string
          output_tokens?: number
          owner_user_id: string
          run_id?: string | null
          ts?: string
        }
        Update: {
          agent?: string
          agent_id?: string | null
          bridge_id?: string | null
          id?: never
          input_tokens?: number
          model?: string
          output_tokens?: number
          owner_user_id?: string
          run_id?: string | null
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_ledger_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_ledger_bridge_id_fkey"
            columns: ["bridge_id"]
            isOneToOne: false
            referencedRelation: "bridges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_ledger_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          feature_name: string
          id: string
          user_id: string
          visited_at: string
        }
        Insert: {
          feature_name: string
          id?: string
          user_id: string
          visited_at?: string
        }
        Update: {
          feature_name?: string
          id?: string
          user_id?: string
          visited_at?: string
        }
        Relationships: []
      }
      user_branding: {
        Row: {
          hide_platform_badge: boolean
          id: string
          logo_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          hide_platform_badge?: boolean
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          hide_platform_badge?: boolean
          id?: string
          logo_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_calendars: {
        Row: {
          color: string
          created_at: string
          id: string
          is_default: boolean
          is_visible: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_visible?: boolean
          name?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_default?: boolean
          is_visible?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_connections: {
        Row: {
          connected_at: string | null
          created_at: string
          credentials: Json
          id: string
          is_connected: boolean
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string | null
          created_at?: string
          credentials?: Json
          id?: string
          is_connected?: boolean
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string | null
          created_at?: string
          credentials?: Json
          id?: string
          is_connected?: boolean
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_onboarding: {
        Row: {
          checked_calendar: boolean
          completed_at: string | null
          completed_profile: boolean
          created_at: string
          dismissed: boolean
          explored_website: boolean
          id: string
          sent_message: boolean
          updated_at: string
          uploaded_file: boolean
          user_id: string
        }
        Insert: {
          checked_calendar?: boolean
          completed_at?: string | null
          completed_profile?: boolean
          created_at?: string
          dismissed?: boolean
          explored_website?: boolean
          id?: string
          sent_message?: boolean
          updated_at?: string
          uploaded_file?: boolean
          user_id: string
        }
        Update: {
          checked_calendar?: boolean
          completed_at?: string | null
          completed_profile?: boolean
          created_at?: string
          dismissed?: boolean
          explored_website?: boolean
          id?: string
          sent_message?: boolean
          updated_at?: string
          uploaded_file?: boolean
          user_id?: string
        }
        Relationships: []
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_sidebar_layout: {
        Row: {
          id: string
          layout_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_configs: {
        Row: {
          created_at: string
          failed_attempts: number
          id: string
          is_locked: boolean
          last_failed_at: string | null
          master_key_hash: string
          password_hash: string
          security_questions: Json
          totp_secret_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          id?: string
          is_locked?: boolean
          last_failed_at?: string | null
          master_key_hash: string
          password_hash: string
          security_questions?: Json
          totp_secret_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          id?: string
          is_locked?: boolean
          last_failed_at?: string | null
          master_key_hash?: string
          password_hash?: string
          security_questions?: Json
          totp_secret_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vault_items: {
        Row: {
          content_encrypted: string | null
          created_at: string
          description_encrypted: string | null
          file_path: string | null
          file_size: number | null
          id: string
          item_type: string
          mime_type: string | null
          name_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content_encrypted?: string | null
          created_at?: string
          description_encrypted?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          item_type?: string
          mime_type?: string | null
          name_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content_encrypted?: string | null
          created_at?: string
          description_encrypted?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          item_type?: string
          mime_type?: string | null
          name_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whitelisted_ips: {
        Row: {
          added_by: string | null
          created_at: string
          id: string
          ip_address: string
          notes: string | null
        }
        Insert: {
          added_by?: string | null
          created_at?: string
          id?: string
          ip_address: string
          notes?: string | null
        }
        Update: {
          added_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          notes?: string | null
        }
        Relationships: []
      }
      wiki_pages: {
        Row: {
          category: string
          content: string | null
          created_at: string | null
          id: string
          is_starred: boolean | null
          last_edited_by: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_starred?: boolean | null
          last_edited_by?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string | null
          id?: string
          is_starred?: boolean | null
          last_edited_by?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          duration_ms: number | null
          error: string | null
          id: string
          node_results: Json | null
          started_at: string
          status: string
          trigger_data: Json | null
          user_id: string
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          node_results?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          user_id: string
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          node_results?: Json | null
          started_at?: string
          status?: string
          trigger_data?: Json | null
          user_id?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          connections: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          nodes: Json
          run_count: number
          template_id: string | null
          updated_at: string
          user_id: string
          viewport: Json | null
          workflow_type: string
        }
        Insert: {
          connections?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          nodes?: Json
          run_count?: number
          template_id?: string | null
          updated_at?: string
          user_id: string
          viewport?: Json | null
          workflow_type?: string
        }
        Update: {
          connections?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          nodes?: Json
          run_count?: number
          template_id?: string | null
          updated_at?: string
          user_id?: string
          viewport?: Json | null
          workflow_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      acc_ap_aging: {
        Row: {
          amount_paid: number | null
          balance: number | null
          bill_date: string | null
          bill_id: string | null
          bill_number: string | null
          bucket: string | null
          days_overdue: number | null
          due_date: string | null
          org_id: string | null
          supplier_id: string | null
          supplier_name: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_ap_bills_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ap_bills_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "acc_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_ar_aging: {
        Row: {
          amount_paid: number | null
          balance: number | null
          bucket: string | null
          customer_id: string | null
          customer_name: string | null
          days_overdue: number | null
          due_date: string | null
          invoice_date: string | null
          invoice_id: string | null
          invoice_number: string | null
          org_id: string | null
          total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_ar_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "acc_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_ar_invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      acc_trial_balance: {
        Row: {
          account_code: string | null
          account_id: string | null
          account_name: string | null
          account_subtype: string | null
          account_type: Database["public"]["Enums"]["acc_account_type"] | null
          balance: number | null
          org_id: string | null
          total_credit: number | null
          total_debit: number | null
        }
        Relationships: [
          {
            foreignKeyName: "acc_chart_of_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "acc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_deals_compat: {
        Row: {
          actual_close_date: string | null
          amount: number | null
          assigned_to: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          deal_status: string | null
          description: string | null
          expected_close_date: string | null
          id: string | null
          notes: string | null
          org_id: string | null
          probability: number | null
          source: string | null
          stage: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          actual_close_date?: string | null
          amount?: number | null
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deal_status?: never
          description?: string | null
          expected_close_date?: string | null
          id?: string | null
          notes?: string | null
          org_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_close_date?: string | null
          amount?: number | null
          assigned_to?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          deal_status?: never
          description?: string | null
          expected_close_date?: string | null
          id?: string | null
          notes?: string | null
          org_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: string | null
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_opportunities_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "crm_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_opportunities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      acc_account_by_code: {
        Args: { _code: string; _org_id: string }
        Returns: string
      }
      acc_asset_monthly_depreciation: {
        Args: { _asset_id: string; _period_end: string }
        Returns: number
      }
      acc_calculate_vat: {
        Args: { _end: string; _org_id: string; _start: string }
        Returns: {
          input_vat: number
          net_due: number
          output_vat: number
        }[]
      }
      acc_complete_bank_reconciliation: {
        Args: { _recon_id: string }
        Returns: undefined
      }
      acc_create_depreciation_run: {
        Args: { _org_id: string; _period_end: string }
        Returns: string
      }
      acc_create_journal_from_bank_transaction: {
        Args: { _contra_account_id: string; _memo?: string; _txn_id: string }
        Returns: string
      }
      acc_dispose_asset: {
        Args: {
          _asset_id: string
          _bank_account_id: string
          _disposal_date: string
          _proceeds: number
        }
        Returns: string
      }
      acc_ensure_fx_accounts: { Args: { _org_id: string }; Returns: undefined }
      acc_get_fx_rate: {
        Args: { _date: string; _from: string; _org_id: string; _to: string }
        Returns: number
      }
      acc_is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      acc_match_bank_transaction: {
        Args: { _entry_id: string; _txn_id: string }
        Returns: undefined
      }
      acc_pay_pay_run: {
        Args: {
          _bank_account_id: string
          _pay_run_id: string
          _payment_date: string
        }
        Returns: string
      }
      acc_pay_vat_return: {
        Args: {
          _amount: number
          _bank_account_id: string
          _payment_date: string
          _return_id: string
        }
        Returns: string
      }
      acc_post_ap_bill: { Args: { _bill_id: string }; Returns: string }
      acc_post_ap_payment: { Args: { _payment_id: string }; Returns: string }
      acc_post_ar_invoice: { Args: { _invoice_id: string }; Returns: string }
      acc_post_ar_payment: { Args: { _payment_id: string }; Returns: string }
      acc_post_asset_acquisition: {
        Args: { _asset_id: string; _bank_account_id: string }
        Returns: string
      }
      acc_post_depreciation_run: { Args: { _run_id: string }; Returns: string }
      acc_post_fx_revaluation: {
        Args: { _as_of: string; _org_id: string; _user_id: string }
        Returns: string
      }
      acc_post_pay_run: { Args: { _pay_run_id: string }; Returns: string }
      acc_recalc_pay_run: { Args: { _pay_run_id: string }; Returns: undefined }
      acc_seed_default_coa: { Args: { _org_id: string }; Returns: undefined }
      acc_submit_vat_return: { Args: { _return_id: string }; Returns: string }
      acc_unmatch_bank_transaction: {
        Args: { _txn_id: string }
        Returns: undefined
      }
      acc_void_ap_bill: { Args: { _bill_id: string }; Returns: string }
      acc_void_ar_invoice: { Args: { _invoice_id: string }; Returns: string }
      am_i_platform_owner: { Args: never; Returns: boolean }
      bridge_claim_task: { Args: { p_bridge: string }; Returns: Json }
      bridge_publish_result: { Args: { p_request: number }; Returns: Json }
      bridge_publish_staged: {
        Args: {
          p_client: string
          p_password: string
          p_run: string
          p_slug: string
        }
        Returns: number
      }
      can_read_note_image: { Args: { p_path: string }; Returns: boolean }
      can_view_rbac_role: {
        Args: { _role_id: string; _user_id: string }
        Returns: boolean
      }
      check_ip_blocked: {
        Args: { p_ip_address: string }
        Returns: {
          blocked: boolean
          expires_at: string
          reason: string
        }[]
      }
      check_ip_whitelisted: { Args: { p_ip_address: string }; Returns: boolean }
      check_verification_resend_limit: {
        Args: { p_user_id: string }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      crm_accounting_org: { Args: never; Returns: string }
      crm_entity_financials: {
        Args: { _entity_id: string; _entity_type: string }
        Returns: {
          amount: number
          currency: string
          finance_id: string
          finance_type: string
          occurred_at: string
          reference: string
          status: string
        }[]
      }
      crm_entity_lifetime_value: {
        Args: { _entity_id: string; _entity_type: string }
        Returns: {
          currency: string
          invoiced: number
          outstanding: number
          paid: number
        }[]
      }
      crm_execute_workflow_actions: {
        Args: {
          _entity_id: string
          _entity_type: string
          _payload: Json
          _workflow_id: string
        }
        Returns: Json
      }
      crm_generate_invoice: {
        Args: {
          _amount?: number
          _description?: string
          _due_date?: string
          _entity_id: string
          _entity_type: string
          _post?: boolean
          _tax_rate?: number
        }
        Returns: {
          invoice_id: string
          invoice_number: string
          status: string
          total: number
        }[]
      }
      crm_generate_invoice_core: {
        Args: {
          _actor?: string
          _amount?: number
          _description?: string
          _due_date?: string
          _entity_id: string
          _entity_type: string
          _source?: string
          _tax_rate?: number
        }
        Returns: string
      }
      crm_generate_invoice_v2: {
        Args: {
          _due_date?: string
          _entity_id: string
          _entity_type: string
          _lines: Json
          _notes?: string
          _post?: boolean
        }
        Returns: {
          invoice_id: string
          invoice_number: string
          status: string
          subtotal: number
          tax_total: number
          total: number
        }[]
      }
      crm_is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      crm_log_communication: {
        Args: {
          _body?: string
          _company_id?: string
          _contact_id?: string
          _direction?: string
          _from_address?: string
          _kind: string
          _metadata?: Json
          _occurred_at?: string
          _opportunity_id?: string
          _subject?: string
          _to_addresses?: string[]
        }
        Returns: string
      }
      crm_next_invoice_number: { Args: { _org: string }; Returns: string }
      crm_run_workflow: {
        Args: {
          _entity_id: string
          _entity_type: string
          _payload?: Json
          _workflow_id: string
        }
        Returns: Json
      }
      crm_set_lifecycle_stage: {
        Args: {
          _entity_id: string
          _entity_type: string
          _new_stage_id: string
          _note?: string
        }
        Returns: undefined
      }
      crm_timeline: {
        Args: {
          _before?: string
          _entity_id: string
          _entity_type: string
          _limit?: number
        }
        Returns: {
          actor_id: string
          body: string
          direction: string
          event_id: string
          event_type: string
          kind: string
          metadata: Json
          occurred_at: string
          subject: string
        }[]
      }
      decrypt_pii: { Args: { p_encrypted_value: string }; Returns: string }
      encrypt_pii: { Args: { p_value: string }; Returns: string }
      generate_customer_id: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_join_code: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_proposal_number: { Args: never; Returns: string }
      generate_team_code: { Args: never; Returns: string }
      generate_ticket_reference: { Args: never; Returns: string }
      generate_verification_token: {
        Args: { p_user_id: string }
        Returns: string
      }
      get_available_admin_id: { Args: never; Returns: string }
      get_blocked_ips_decrypted: {
        Args: never
        Returns: {
          blocked_at: string
          blocked_by: string
          expires_at: string
          failed_attempts: number
          id: string
          ip_address: string
          is_auto_blocked: boolean
          reason: string
        }[]
      }
      get_email_account_secrets: {
        Args: { p_account_id: string }
        Returns: {
          access_token: string
          imap_password: string
          refresh_token: string
        }[]
      }
      get_enquiry_draft: {
        Args: { _resume_token: string }
        Returns: {
          additional_notes: string | null
          brand_colors: string | null
          budget: string | null
          business_address: string | null
          business_type: string | null
          company: string | null
          competitors: string | null
          created_at: string
          email: string
          employee_count: string | null
          first_name: string | null
          form_step: number | null
          has_existing_site: string | null
          how_did_you_hear: string | null
          id: string
          inspiration_sites: string | null
          interest: string | null
          is_draft: boolean | null
          last_name: string | null
          must_have_features: string[] | null
          name: string
          notes: string | null
          page_count: string | null
          phone: string | null
          primary_goal: string | null
          project_details: string | null
          resume_token: string | null
          selected_package: string | null
          social_media: string | null
          status: string
          timeline: string | null
          updated_at: string
          website: string | null
          years_in_business: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "enquiries"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_primary_admin_id: { Args: never; Returns: string }
      get_security_logs_decrypted: {
        Args: { p_limit?: number }
        Returns: {
          actual_role: string
          created_at: string
          details: Json
          event_type: string
          id: string
          ip_address: string
          portal_attempted: string
          user_agent: string
          user_id: string
        }[]
      }
      get_shared_cad_project: {
        Args: { _share_token: string }
        Returns: {
          created_at: string
          description: string | null
          drawing_data: Json
          entity_count: number
          folder: string | null
          id: string
          is_template: boolean
          layer_count: number
          name: string
          share_token: string | null
          shared_mode: string | null
          tags: string[] | null
          template_category: string | null
          thumbnail_url: string | null
          units: string
          updated_at: string
          user_id: string
          version: number
        }[]
        SetofOptions: {
          from: "*"
          to: "cad_projects"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_user_accessible_modules: {
        Args: { _user_id: string }
        Returns: string[]
      }
      get_whitelisted_ips_decrypted: {
        Args: never
        Returns: {
          added_by: string
          created_at: string
          id: string
          ip_address: string
          notes: string
        }[]
      }
      has_rbac_permission: {
        Args: { _action: string; _module: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_verification_resend: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      is_channel_member: { Args: { p_channel_id: string }; Returns: boolean }
      is_owner: { Args: { row_user_id: string }; Returns: boolean }
      is_platform_owner: { Args: { _user_id: string }; Returns: boolean }
      is_team_member: { Args: { p_team_id: string }; Returns: boolean }
      is_team_owner: { Args: { _user_id: string }; Returns: boolean }
      issuer_invoice_design: { Args: never; Returns: Json }
      jarvis_budget: { Args: never; Returns: Json }
      jarvis_context: { Args: never; Returns: Json }
      jarvis_log_turn: {
        Args: {
          p_head: string
          p_model: string
          p_note?: string
          p_ok: boolean
          p_tier: number
          p_user: string
        }
        Returns: undefined
      }
      lookup_team_by_code: {
        Args: { p_code: string }
        Returns: {
          id: string
          team_name: string
        }[]
      }
      memory_add: {
        Args: {
          p_agent?: string
          p_detail?: Json
          p_kind: string
          p_model?: string
          p_ok?: boolean
          p_parent: string
          p_project?: string
          p_source?: string
          p_summary: string
          p_task?: string
          p_title: string
          p_tokens_in?: number
          p_tokens_out?: number
        }
        Returns: string
      }
      memory_agent: {
        Args: { p_agent: string; p_limit?: number }
        Returns: Json
      }
      memory_digest: { Args: { p_node: string }; Returns: string }
      memory_recall: {
        Args: { p_max_chars?: number; p_task: string }
        Returns: string
      }
      memory_roots: { Args: { p_limit?: number }; Returns: Json }
      memory_task_node: { Args: { p_task: string }; Returns: string }
      memory_tree: {
        Args: { p_limit?: number; p_max_depth?: number; p_root?: string }
        Returns: Json
      }
      mesh_advisor_defer_note: {
        Args: {
          p_auto: boolean
          p_capability: string
          p_deferred: number
          p_reset: string
        }
        Returns: undefined
      }
      mesh_advisor_run: { Args: never; Returns: Json }
      mesh_bridge_dispatch: {
        Args: { p_horizon_minutes?: number; p_task: string }
        Returns: Json
      }
      mesh_bridge_sync: { Args: never; Returns: Json }
      mesh_cache_get: { Args: { p_key: string }; Returns: Json }
      mesh_cache_key: {
        Args: { p_capability: string; p_params: Json; p_prompt: string }
        Returns: string
      }
      mesh_cache_put: {
        Args: {
          p_key: string
          p_model: string
          p_output: string
          p_tokens: number
          p_ttl_seconds?: number
        }
        Returns: undefined
      }
      mesh_claim_batch: {
        Args: { p_capabilities: string[]; p_max?: number; p_worker: string }
        Returns: Json
      }
      mesh_claim_task: {
        Args: { p_capabilities: string[]; p_worker: string }
        Returns: Json
      }
      mesh_context_diff: {
        Args: { p_paths?: string[]; p_project: string; p_worker: string }
        Returns: Json
      }
      mesh_files_upsert: {
        Args: { p_files: Json; p_project: string }
        Returns: number
      }
      mesh_pattern_search: {
        Args: { p_embedding: string; p_kind: string; p_threshold?: number }
        Returns: Json
      }
      mesh_pattern_store: {
        Args: {
          p_embedding: string
          p_kind: string
          p_output: string
          p_summary: string
        }
        Returns: string
      }
      mesh_reaper: { Args: { p_horizon_minutes?: number }; Returns: Json }
      mesh_record_call: {
        Args: {
          p_cost_class: string
          p_date: string
          p_error_class: string
          p_headers_seen: boolean
          p_latency_ms: number
          p_model: string
          p_ok: boolean
          p_retry_after: number
          p_rl_remaining: number
          p_rl_reset: string
          p_tokens_in: number
          p_tokens_out: number
        }
        Returns: undefined
      }
      mesh_route_candidates: {
        Args: {
          p_agent?: string
          p_capability: string
          p_json_mode?: boolean
          p_min_context?: number
          p_pinned_model?: string
          p_use_reserve?: boolean
        }
        Returns: Json
      }
      mesh_task_complete: {
        Args: {
          p_error: string
          p_model: string
          p_next?: Json
          p_ok: boolean
          p_result: Json
          p_rung: number
          p_task: string
        }
        Returns: string
      }
      mesh_worker_tick: { Args: never; Returns: number }
      my_invoices: {
        Args: never
        Returns: {
          amount_paid: number
          currency: string
          customer_name: string
          due_date: string
          invoice_date: string
          invoice_id: string
          invoice_number: string
          lines: Json
          notes: string
          posted_at: string
          status: string
          subtotal: number
          tax_total: number
          total: number
        }[]
      }
      office_can_read_notebook: {
        Args: { p_notebook: string }
        Returns: boolean
      }
      office_can_write_notebook: {
        Args: { p_notebook: string }
        Returns: boolean
      }
      office_notebook_owner_id: {
        Args: { p_notebook: string }
        Returns: string
      }
      office_owns_notebook: { Args: { p_notebook: string }; Returns: boolean }
      office_save_notebook_page: {
        Args: {
          p_content: string
          p_expected_version: number
          p_images: Json
          p_locked: boolean
          p_notebook_id: string
          p_page_id: string
          p_position: number
          p_starred: boolean
          p_tags: Json
          p_title: string
        }
        Returns: {
          conflict: boolean
          content: string
          id: string
          images: Json
          locked: boolean
          notebook_id: string
          page_position: number
          starred: boolean
          tags: Json
          title: string
          updated_at: string
          updated_by: string
          version: number
        }[]
      }
      office_shared_with_me: {
        Args: { p_notebook: string; p_write?: boolean }
        Returns: boolean
      }
      owner_admin_stats: {
        Args: never
        Returns: {
          avg_duration_seconds: number
          calls_today: number
          calls_total: number
          calls_week: number
          companies_assigned: number
          connected: number
          contacts_assigned: number
          conversions: number
          created_at: string
          email: string
          full_name: string
          is_owner: boolean
          last_sign_in_at: string
          no_answer: number
          user_id: string
        }[]
      }
      owner_call_feed: {
        Args: { _limit?: number }
        Returns: {
          admin_email: string
          admin_id: string
          admin_name: string
          call_id: string
          duration_seconds: number
          entity_id: string
          entity_name: string
          entity_type: string
          notes: string
          outcome: string
          phone: string
          source: string
          started_at: string
          transcript: string
        }[]
      }
      owner_create_comm_group: {
        Args: { _description?: string; _member_ids?: string[]; _name: string }
        Returns: string
      }
      owner_set_channel_member: {
        Args: { _channel_id: string; _member: boolean; _user_id: string }
        Returns: undefined
      }
      pii_key: { Args: never; Returns: string }
      platform_op: {
        Args: {
          p_actor?: string
          p_limit?: number
          p_match?: Json
          p_op: string
          p_payload?: Json
          p_reason?: string
          p_table: string
          p_task?: string
        }
        Returns: Json
      }
      platform_op_escalate: {
        Args: {
          p_actor?: string
          p_instruction: string
          p_owner: string
          p_reason?: string
          p_task?: string
        }
        Returns: Json
      }
      preview_activate_version: {
        Args: { p_preview: string; p_version: string }
        Returns: undefined
      }
      preview_path_available: {
        Args: { p_path: string; p_self?: string }
        Returns: boolean
      }
      preview_prune_versions: {
        Args: { p_keep?: number; p_preview: string }
        Returns: {
          dropped_prefix: string
        }[]
      }
      preview_record_view: { Args: { p_id: string }; Returns: undefined }
      prune_preview_records: { Args: never; Returns: undefined }
      prune_two_factor_challenges: { Args: never; Returns: undefined }
      set_active_splash: { Args: { _id: string }; Returns: undefined }
      site_unread_submission_count: {
        Args: { _site_id: string }
        Returns: number
      }
      team_admin_calls: {
        Args: { _admin_id: string; _limit?: number }
        Returns: {
          admin_email: string
          admin_id: string
          admin_name: string
          call_id: string
          duration_seconds: number
          ended_at: string
          entity_id: string
          entity_name: string
          entity_type: string
          notes: string
          outcome: string
          phone: string
          source: string
          started_at: string
          transcript: string
        }[]
      }
      team_call_stats: {
        Args: never
        Returns: {
          avg_duration_seconds: number
          callback: number
          calls_today: number
          calls_total: number
          calls_week: number
          connected: number
          conversions: number
          email: string
          full_name: string
          is_me: boolean
          is_owner: boolean
          last_call_at: string
          last_sign_in_at: string
          no_answer: number
          notes_logged: number
          talk_seconds: number
          transcripts: number
          user_id: string
          voicemail: number
          wrong_number: number
        }[]
      }
      two_factor_satisfied: { Args: never; Returns: boolean }
      verify_email_token: { Args: { p_token: string }; Returns: Json }
    }
    Enums: {
      acc_account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      acc_ap_bill_status: "draft" | "posted" | "paid" | "void"
      acc_ar_invoice_status: "draft" | "posted" | "paid" | "void"
      acc_bank_txn_status: "unmatched" | "matched" | "reconciled" | "ignored"
      acc_depreciation_method: "straight_line" | "reducing_balance"
      acc_depreciation_run_status: "draft" | "posted" | "void"
      acc_fixed_asset_status: "active" | "fully_depreciated" | "disposed"
      acc_pay_run_status: "draft" | "posted" | "paid" | "void"
      acc_pay_type: "salary" | "hourly"
      acc_period_status: "open" | "closed" | "locked"
      acc_reconciliation_status: "open" | "completed"
      acc_role:
        | "owner"
        | "accountant"
        | "bookkeeper"
        | "approver"
        | "client_view_only"
      acc_source_type:
        | "invoice"
        | "bill"
        | "bank"
        | "manual"
        | "payroll"
        | "adjustment"
        | "reversal"
        | "automation"
        | "ar_invoice"
        | "ar_invoice_void"
        | "ar_payment"
        | "ap_bill"
        | "ap_bill_void"
        | "ap_payment"
        | "fx_reval"
      acc_vat_return_status: "draft" | "submitted" | "paid" | "void"
      app_role: "admin" | "user" | "financial" | "team_member" | "executive"
      crm_comm_direction: "inbound" | "outbound" | "internal"
      crm_comm_kind:
        | "email"
        | "call"
        | "meeting"
        | "note"
        | "sms"
        | "chat"
        | "task"
        | "file"
        | "system"
      crm_entity_status: "active" | "inactive" | "archived"
      crm_lifecycle_category:
        | "lead"
        | "prospect"
        | "customer"
        | "churned"
        | "other"
      crm_relationship_type:
        | "customer"
        | "supplier"
        | "partner"
        | "prospect"
        | "lead"
        | "investor"
        | "other"
      lead_source:
        | "google_maps"
        | "manual"
        | "csv_import"
        | "html_import"
        | "json_import"
      lead_status:
        | "new"
        | "contacted"
        | "engaged"
        | "live_preview_wanted"
        | "converted"
        | "lost"
        | "do_not_contact"
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
      acc_account_type: ["asset", "liability", "equity", "revenue", "expense"],
      acc_ap_bill_status: ["draft", "posted", "paid", "void"],
      acc_ar_invoice_status: ["draft", "posted", "paid", "void"],
      acc_bank_txn_status: ["unmatched", "matched", "reconciled", "ignored"],
      acc_depreciation_method: ["straight_line", "reducing_balance"],
      acc_depreciation_run_status: ["draft", "posted", "void"],
      acc_fixed_asset_status: ["active", "fully_depreciated", "disposed"],
      acc_pay_run_status: ["draft", "posted", "paid", "void"],
      acc_pay_type: ["salary", "hourly"],
      acc_period_status: ["open", "closed", "locked"],
      acc_reconciliation_status: ["open", "completed"],
      acc_role: [
        "owner",
        "accountant",
        "bookkeeper",
        "approver",
        "client_view_only",
      ],
      acc_source_type: [
        "invoice",
        "bill",
        "bank",
        "manual",
        "payroll",
        "adjustment",
        "reversal",
        "automation",
        "ar_invoice",
        "ar_invoice_void",
        "ar_payment",
        "ap_bill",
        "ap_bill_void",
        "ap_payment",
        "fx_reval",
      ],
      acc_vat_return_status: ["draft", "submitted", "paid", "void"],
      app_role: ["admin", "user", "financial", "team_member", "executive"],
      crm_comm_direction: ["inbound", "outbound", "internal"],
      crm_comm_kind: [
        "email",
        "call",
        "meeting",
        "note",
        "sms",
        "chat",
        "task",
        "file",
        "system",
      ],
      crm_entity_status: ["active", "inactive", "archived"],
      crm_lifecycle_category: [
        "lead",
        "prospect",
        "customer",
        "churned",
        "other",
      ],
      crm_relationship_type: [
        "customer",
        "supplier",
        "partner",
        "prospect",
        "lead",
        "investor",
        "other",
      ],
      lead_source: [
        "google_maps",
        "manual",
        "csv_import",
        "html_import",
        "json_import",
      ],
      lead_status: [
        "new",
        "contacted",
        "engaged",
        "live_preview_wanted",
        "converted",
        "lost",
        "do_not_contact",
      ],
    },
  },
} as const
