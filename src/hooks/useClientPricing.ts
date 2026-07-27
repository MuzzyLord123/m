import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ClientPricingItem {
  id: string;
  service_name: string;
  service_type: string;
  negotiated_price: number;
  is_recurring: boolean;
  billing_frequency: string | null;
  description: string | null;
  is_visible: boolean;
}

interface ClientInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  total_amount: number;
  status: string | null;
  due_date: string | null;
  paid_at: string | null;
  items: any;
  created_at: string;
}

interface ClientContract {
  id: string;
  title: string;
  document_url: string | null;
  document_type: string | null;
  status: string | null;
  signed_at: string | null;
  expires_at: string | null;
}

interface TeamInfo {
  id: string;
  team_name: string | null;
  team_code: string;
  member_role: string;
}

export function useClientPricing() {
  const { user } = useAuth();
  const [pricing, setPricing] = useState<ClientPricingItem[]>([]);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [contracts, setContracts] = useState<ClientContract[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [canViewBilling, setCanViewBilling] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTeamAndPricing();
    }
  }, [user]);

  const fetchTeamAndPricing = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First, find the user's team membership
      const { data: membership, error: membershipError } = await supabase
        .from('team_memberships')
        .select(`
          id,
          member_role,
          team_id,
          client_teams (
            id,
            team_name,
            team_code
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (membershipError) {
        console.error('Error fetching membership:', membershipError);
        setLoading(false);
        return;
      }

      // Check if user is team owner (primary account)
      const { data: ownedTeam, error: ownedTeamError } = await supabase
        .from('client_teams')
        .select('id, team_name, team_code')
        .eq('primary_account_id', user.id)
        .maybeSingle();

      let teamId: string | null = null;
      let memberRole = 'member';

      if (ownedTeam) {
        // User is the primary account owner
        teamId = ownedTeam.id;
        memberRole = 'owner';
        setTeamInfo({
          id: ownedTeam.id,
          team_name: ownedTeam.team_name,
          team_code: ownedTeam.team_code,
          member_role: 'owner'
        });
      } else if (membership?.client_teams) {
        // User is a team member
        const team = membership.client_teams as any;
        teamId = team.id;
        memberRole = membership.member_role;
        setTeamInfo({
          id: team.id,
          team_name: team.team_name,
          team_code: team.team_code,
          member_role: membership.member_role
        });
      }

      // Determine if user can view billing (owner or financial role)
      const hasFinancialAccess = memberRole === 'owner' || memberRole === 'financial';
      setCanViewBilling(hasFinancialAccess);

      if (!teamId || !hasFinancialAccess) {
        setLoading(false);
        return;
      }

      // Fetch custom pricing for this team
      const { data: pricingData, error: pricingError } = await supabase
        .from('client_pricing')
        .select('*')
        .eq('team_id', teamId)
        .eq('is_visible', true);

      if (pricingError) {
        console.error('Error fetching pricing:', pricingError);
      } else {
        setPricing(pricingData || []);
      }

      // Fetch invoices for this team
      const { data: invoiceData, error: invoiceError } = await supabase
        .from('client_invoices')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (invoiceError) {
        console.error('Error fetching invoices:', invoiceError);
      } else {
        setInvoices(invoiceData || []);
      }

      // Fetch contracts for this team
      const { data: contractData, error: contractError } = await supabase
        .from('client_contracts')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (contractError) {
        console.error('Error fetching contracts:', contractError);
      } else {
        setContracts(contractData || []);
      }

    } catch (error) {
      console.error('Error in fetchTeamAndPricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchTeamAndPricing();
  };

  // Group pricing by service type
  const pricingByType = pricing.reduce((acc, item) => {
    if (!acc[item.service_type]) {
      acc[item.service_type] = [];
    }
    acc[item.service_type].push(item);
    return acc;
  }, {} as Record<string, ClientPricingItem[]>);

  // Calculate totals
  const recurringTotal = pricing
    .filter(p => p.is_recurring)
    .reduce((sum, p) => sum + p.negotiated_price, 0);

  const oneTimeTotal = pricing
    .filter(p => !p.is_recurring)
    .reduce((sum, p) => sum + p.negotiated_price, 0);

  return {
    pricing,
    pricingByType,
    invoices,
    contracts,
    teamInfo,
    loading,
    canViewBilling,
    recurringTotal,
    oneTimeTotal,
    refetch
  };
}
