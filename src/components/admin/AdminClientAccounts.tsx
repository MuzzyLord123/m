import { useState, useEffect } from 'react';
import {
  Users, Search, Plus, ChevronRight,
  Trash2, Mail, Building,
  Edit2, Eye, PoundSterling,
  FileText, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  PageHeader, AvatarID, StatusBadge, Money, EmptyState, SkeletonLedger,
  Panel, type Tone,
} from '@/components/platform';
import { cn } from '@/lib/utils';

interface ClientTeam {
  id: string;
  team_code: string;
  team_name: string | null;
  primary_account_id: string;
  created_at: string;
  members: TeamMember[];
  primaryAccount?: {
    email: string | null;
    full_name: string | null;
    company: string | null;
    phone?: string | null;
    enquiry_data?: Record<string, any> | null;
  };
}

interface TeamMember {
  id: string;
  user_id: string;
  team_id: string;
  member_role: string;
  display_name: string | null;
  joined_at: string;
  profile?: {
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface ClientPricing {
  id: string;
  team_id: string;
  service_type: string;
  service_name: string;
  negotiated_price: number;
  is_recurring: boolean;
  billing_frequency: string | null;
  is_visible: boolean;
  notes: string | null;
}

/* Member roles on the platform tone vocabulary — no per-role hue map. */
const roleTones: Record<string, Tone> = {
  owner: 'accent',
  financial: 'ok',
  project: 'neutral',
  member: 'neutral',
};

const serviceTypes = [
  'Website Build',
  'Website Management',
  'Social Media',
  'Ad Management',
  'Content Creation',
  'SEO & Strategy',
  'Branding',
  'Other',
];

export default function AdminClientAccounts() {
  const [teams, setTeams] = useState<ClientTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<ClientTeam | null>(null);
  const [activeTab, setActiveTab] = useState('members');

  // Pricing state
  const [clientPricing, setClientPricing] = useState<ClientPricing[]>([]);
  const [showAddPricing, setShowAddPricing] = useState(false);
  const [newPricing, setNewPricing] = useState({
    service_type: '',
    service_name: '',
    negotiated_price: '',
    is_recurring: false,
    billing_frequency: '',
    notes: '',
  });

  // Member role update
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      fetchClientPricing(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    try {
      // Fetch teams
      const { data: teamsData, error: teamsError } = await supabase
        .from('client_teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (teamsError) throw teamsError;

      // Fetch memberships for each team
      const teamsWithMembers = await Promise.all(
        (teamsData || []).map(async (team) => {
          const { data: memberships } = await supabase
            .from('team_memberships')
            .select('*')
            .eq('team_id', team.id);

          // Fetch primary account profile
          const { data: primaryProfile } = await supabase
            .from('profiles')
            .select('email, full_name, company, phone, enquiry_data')
            .eq('user_id', team.primary_account_id)
            .maybeSingle();

          // Fetch profiles for each member
          const membersWithProfiles = await Promise.all(
            (memberships || []).map(async (member) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('email, full_name, avatar_url')
                .eq('user_id', member.user_id)
                .single();
              return { ...member, profile };
            })
          );

          return {
            ...team,
            members: membersWithProfiles,
            primaryAccount: primaryProfile ? {
              ...primaryProfile,
              enquiry_data: (primaryProfile.enquiry_data as any) || null,
            } : undefined,
          };
        })
      );

      setTeams(teamsWithMembers);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast.error('Failed to load client accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientPricing = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('client_pricing')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClientPricing(data || []);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const addClientPricing = async () => {
    if (!selectedTeam || !newPricing.service_type || !newPricing.service_name || !newPricing.negotiated_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('client_pricing')
        .insert({
          team_id: selectedTeam.id,
          service_type: newPricing.service_type,
          service_name: newPricing.service_name,
          negotiated_price: parseFloat(newPricing.negotiated_price),
          is_recurring: newPricing.is_recurring,
          billing_frequency: newPricing.billing_frequency || null,
          notes: newPricing.notes || null,
          is_visible: true,
        });

      if (error) throw error;

      toast.success('Pricing added successfully');
      setShowAddPricing(false);
      setNewPricing({
        service_type: '',
        service_name: '',
        negotiated_price: '',
        is_recurring: false,
        billing_frequency: '',
        notes: '',
      });
      fetchClientPricing(selectedTeam.id);
    } catch (error) {
      console.error('Error adding pricing:', error);
      toast.error('Failed to add pricing');
    }
  };

  const updateMemberRole = async () => {
    if (!selectedMember || !newRole) return;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .update({ member_role: newRole })
        .eq('id', selectedMember.id);

      if (error) throw error;

      toast.success('Member role updated');
      setShowRoleDialog(false);
      setSelectedMember(null);
      setNewRole('');
      fetchTeams();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const deletePricing = async (pricingId: string) => {
    try {
      const { error } = await supabase
        .from('client_pricing')
        .delete()
        .eq('id', pricingId);

      if (error) throw error;

      toast.success('Pricing removed');
      if (selectedTeam) fetchClientPricing(selectedTeam.id);
    } catch (error) {
      console.error('Error deleting pricing:', error);
      toast.error('Failed to remove pricing');
    }
  };

  const togglePricingVisibility = async (pricing: ClientPricing) => {
    try {
      const { error } = await supabase
        .from('client_pricing')
        .update({ is_visible: !pricing.is_visible })
        .eq('id', pricing.id);

      if (error) throw error;

      toast.success(pricing.is_visible ? 'Pricing hidden from client' : 'Pricing visible to client');
      if (selectedTeam) fetchClientPricing(selectedTeam.id);
    } catch (error) {
      console.error('Error toggling visibility:', error);
      toast.error('Failed to update visibility');
    }
  };

  const filteredTeams = teams.filter(team =>
    team.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.team_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.primaryAccount?.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.primaryAccount?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader kicker="Quooro office" title="Client accounts" description="Client teams, members and custom pricing." />
        <Panel>
          <SkeletonLedger rows={5} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-4 overflow-x-hidden">
      {/* Header */}
      <PageHeader
        kicker="Quooro office"
        title="Client accounts"
        description="Client teams, members and custom pricing."
        actions={
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search clients…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 w-full pl-9 text-[13px]"
            />
          </div>
        }
      />

      {/* Team List */}
      <div className="grid gap-3">
        {filteredTeams.length === 0 ? (
          <Panel>
            <EmptyState
              title="No client teams yet"
              body="Client teams are created when customers register and set up their accounts."
            />
          </Panel>
        ) : (
          filteredTeams.map((team) => (
            <Card
              key={team.id}
              className={cn(
                'rounded-[10px] border-border/60 shadow-none',
                selectedTeam?.id === team.id && 'border-primary/50',
              )}
            >
              <CardHeader
                className="cursor-pointer px-4 py-3"
                onClick={() => {
                  setExpandedTeam(expandedTeam === team.id ? null : team.id);
                  setSelectedTeam(team);
                }}
              >
                <div className="flex min-w-0 items-center justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="hidden shrink-0 -space-x-2 sm:flex">
                      {team.members.slice(0, 3).map((member) => (
                        <AvatarID
                          key={member.id}
                          name={member.display_name || member.profile?.full_name}
                          email={member.profile?.email}
                          src={member.profile?.avatar_url || undefined}
                          size="lg"
                          className="border-2 border-background"
                        />
                      ))}
                      {team.members.length > 3 && (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-sunken text-[10px] font-medium tabular-nums text-muted-foreground">
                          +{team.members.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-[14px] font-semibold tracking-[-0.01em]">
                        <span className="max-w-[140px] truncate sm:max-w-none">{team.team_name || team.primaryAccount?.company || 'Unnamed team'}</span>
                        <Badge variant="outline" className="shrink-0 border-border/60 font-mono text-[10px] font-medium tracking-[0.04em] text-muted-foreground">
                          {team.team_code}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-1 flex flex-wrap items-center gap-3 text-[11.5px] sm:gap-4">
                        <span className="flex min-w-0 items-center gap-1">
                          <Crown className="h-3 w-3 shrink-0" aria-hidden />
                          <span className="truncate">{team.primaryAccount?.full_name || 'No primary account'}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-1 tabular-nums">
                          <Users className="h-3 w-3" aria-hidden />
                          {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-md border-border/60 px-2 text-xs sm:px-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTeam(team);
                        setActiveTab('pricing');
                        setExpandedTeam(team.id);
                      }}
                    >
                      <PoundSterling className="h-3.5 w-3.5 sm:mr-1" />
                      <span className="hidden sm:inline">Pricing</span>
                    </Button>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 text-muted-foreground transition-transform duration-150',
                        expandedTeam === team.id && 'rotate-90',
                      )}
                    />
                  </div>
                </div>
              </CardHeader>

              {expandedTeam === team.id && (
                <CardContent className="px-4 pb-4 pt-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-3 h-auto flex-wrap rounded-lg border border-border/60 bg-sunken p-0.5">
                      <TabsTrigger value="members" className="h-7 rounded-md px-3 text-xs data-[state=active]:bg-card">
                        <Users className="mr-2 h-3.5 w-3.5" />
                        Members
                      </TabsTrigger>
                      <TabsTrigger value="pricing" className="h-7 rounded-md px-3 text-xs data-[state=active]:bg-card">
                        <PoundSterling className="mr-2 h-3.5 w-3.5" />
                        Custom pricing
                      </TabsTrigger>
                      {team.primaryAccount?.enquiry_data && (
                        <TabsTrigger value="enquiry" className="h-7 rounded-md px-3 text-xs data-[state=active]:bg-card">
                          <FileText className="mr-2 h-3.5 w-3.5" />
                          Enquiry info
                        </TabsTrigger>
                      )}
                    </TabsList>

                    {team.primaryAccount?.enquiry_data && (
                      <TabsContent value="enquiry" className="space-y-4">
                        <EnquiryInfoSection data={team.primaryAccount.enquiry_data} />
                      </TabsContent>
                    )}


                    <TabsContent value="members" className="space-y-2">
                      {team.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between rounded-lg border border-border/60 bg-card px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <AvatarID
                              name={member.display_name || member.profile?.full_name}
                              email={member.profile?.email}
                              src={member.profile?.avatar_url || undefined}
                              size="lg"
                            />
                            <div>
                              <p className="text-[13px] font-medium text-foreground">
                                {member.display_name || member.profile?.full_name || 'Unknown'}
                              </p>
                              <p className="text-[11px] text-muted-foreground">
                                {member.profile?.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              tone={roleTones[member.member_role] || roleTones.member}
                              label={member.member_role}
                              className="capitalize"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              aria-label="Change role"
                              onClick={() => {
                                setSelectedMember(member);
                                setNewRole(member.member_role);
                                setShowRoleDialog(true);
                              }}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </TabsContent>

                    <TabsContent value="pricing" className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-[12px] text-muted-foreground">
                          Custom pricing visible only to this client
                        </p>
                        <Button size="sm" className="h-7 rounded-md px-3 text-xs" onClick={() => setShowAddPricing(true)}>
                          <Plus className="mr-1.5 h-3.5 w-3.5" />
                          Add pricing
                        </Button>
                      </div>

                      {clientPricing.length === 0 ? (
                        <EmptyState
                          compact
                          title="No custom pricing yet"
                          body="Negotiated prices you add here appear on this client's billing."
                        />
                      ) : (
                        <div className="space-y-2">
                          {clientPricing.map((pricing) => (
                            <div
                              key={pricing.id}
                              className={cn(
                                'flex items-center justify-between rounded-lg border border-border/60 px-3 py-2',
                                !pricing.is_visible && 'opacity-50',
                              )}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-[13px] font-medium text-foreground">{pricing.service_name}</p>
                                  <Badge variant="outline" className="border-border/60 text-[10px] font-normal text-muted-foreground">
                                    {pricing.service_type}
                                  </Badge>
                                  {pricing.is_recurring && (
                                    <Badge variant="outline" className="border-border/60 bg-sunken text-[10px] font-normal capitalize text-ink-2">
                                      {pricing.billing_frequency || 'Recurring'}
                                    </Badge>
                                  )}
                                </div>
                                {pricing.notes && (
                                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                                    {pricing.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[13px] font-semibold tabular-nums text-foreground">
                                  <Money value={pricing.negotiated_price} whole />
                                  {pricing.is_recurring && (
                                    <span className="text-[11px] font-normal text-muted-foreground">
                                      /{pricing.billing_frequency?.replace('ly', '') || 'mo'}
                                    </span>
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  aria-label={pricing.is_visible ? 'Hide from client' : 'Show to client'}
                                  onClick={() => togglePricingVisibility(pricing)}
                                >
                                  {pricing.is_visible ? (
                                    <Eye className="h-3.5 w-3.5" />
                                  ) : (
                                    <Eye className="h-3.5 w-3.5 opacity-50" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  aria-label="Remove pricing"
                                  onClick={() => deletePricing(pricing.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-risk" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Role Update Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="rounded-xl border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Update member role</DialogTitle>
            <DialogDescription className="text-[13px]">
              Change the role for {selectedMember?.display_name || selectedMember?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner (full access)</SelectItem>
                  <SelectItem value="financial">Financial (billing access)</SelectItem>
                  <SelectItem value="project">Project (no billing)</SelectItem>
                  <SelectItem value="member">Member (view only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 text-[12px] text-muted-foreground">
              <p><strong className="font-medium text-foreground">Owner:</strong> full access to all features including billing and team management</p>
              <p><strong className="font-medium text-foreground">Financial:</strong> can view and manage billing, invoices and pricing</p>
              <p><strong className="font-medium text-foreground">Project:</strong> access to project features, no billing visibility</p>
              <p><strong className="font-medium text-foreground">Member:</strong> view-only access to allowed sections</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button className="h-8 rounded-lg px-3 text-xs" onClick={updateMemberRole}>Update role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Pricing Dialog */}
      <Dialog open={showAddPricing} onOpenChange={setShowAddPricing}>
        <DialogContent className="rounded-xl border-border/60 bg-card">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-semibold tracking-[-0.01em]">Add custom pricing</DialogTitle>
            <DialogDescription className="text-[13px]">
              Set a negotiated price for {selectedTeam?.team_name || 'this client'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Service type (required)</Label>
              <Select
                value={newPricing.service_type}
                onValueChange={(v) => setNewPricing({ ...newPricing, service_type: v })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {serviceTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Service name (required)</Label>
              <Input
                value={newPricing.service_name}
                onChange={(e) => setNewPricing({ ...newPricing, service_name: e.target.value })}
                placeholder="e.g. Business website build"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Negotiated price in £ (required)</Label>
              <Input
                type="number"
                value={newPricing.negotiated_price}
                onChange={(e) => setNewPricing({ ...newPricing, negotiated_price: e.target.value })}
                placeholder="0.00"
                className="mt-1.5 tabular-nums"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_recurring"
                  checked={newPricing.is_recurring}
                  onChange={(e) => setNewPricing({ ...newPricing, is_recurring: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="is_recurring" className="text-[13px]">Recurring</Label>
              </div>
              {newPricing.is_recurring && (
                <Select
                  value={newPricing.billing_frequency}
                  onValueChange={(v) => setNewPricing({ ...newPricing, billing_frequency: v })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <Label className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Notes (optional)</Label>
              <Textarea
                value={newPricing.notes}
                onChange={(e) => setNewPricing({ ...newPricing, notes: e.target.value })}
                placeholder="Any additional details about this pricing…"
                className="mt-1.5"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowAddPricing(false)}>
              Cancel
            </Button>
            <Button className="h-8 rounded-lg px-3 text-xs" onClick={addClientPricing}>Add pricing</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnquiryInfoSection({ data }: { data: Record<string, any> }) {
  const fmt = (v: any) => {
    if (v === null || v === undefined || v === '') return null;
    if (Array.isArray(v)) return v.length ? v.join(', ') : null;
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    return String(v);
  };

  const sections: { title: string; icon: any; fields: [string, string][] }[] = [
    {
      title: 'Contact',
      icon: Mail,
      fields: [
        ['Email', 'email'],
        ['Phone', 'phone'],
        ['Company', 'company'],
        ['Address', 'business_address'],
        ['How they heard', 'how_did_you_hear'],
      ],
    },
    {
      title: 'Project',
      icon: FileText,
      fields: [
        ['Package', 'selected_package'],
        ['Budget', 'budget'],
        ['Timeline', 'timeline'],
        ['Primary goal', 'primary_goal'],
        ['Pages', 'page_count'],
        ['Project details', 'project_details'],
        ['Must-have features', 'must_have_features'],
        ['Inspiration sites', 'inspiration_sites'],
        ['Competitors', 'competitors'],
      ],
    },
    {
      title: 'Business',
      icon: Building,
      fields: [
        ['Business type', 'business_type'],
        ['Employee count', 'employee_count'],
        ['Years in business', 'years_in_business'],
        ['Existing site', 'website'],
        ['Has existing site', 'has_existing_site'],
        ['Social media', 'social_media'],
        ['Brand colours', 'brand_colors'],
        ['Additional notes', 'additional_notes'],
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map(({ title, icon: Icon, fields }) => {
        const rows = fields
          .map(([label, key]) => [label, fmt(data[key])] as const)
          .filter(([, v]) => v !== null);
        if (!rows.length) return null;
        return (
          <div key={title} className="rounded-[10px] border border-border/60 bg-card">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <h4 className="font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{title}</h4>
            </div>
            <div className="divide-y divide-border/60">
              {rows.map(([label, value]) => (
                <div key={label} className="px-4 py-2.5">
                  <p className="mb-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted-foreground">
                    {label}
                  </p>
                  <p className="break-words text-[13px] text-ink-2">{value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
