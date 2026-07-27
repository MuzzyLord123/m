import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Plus, ChevronDown, ChevronRight, 
  UserPlus, Trash2, Mail, Phone, Building, 
  CreditCard, Shield, Edit2, Eye, DollarSign, PoundSterling,
  FileText, UserMinus, Crown, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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

const roleColors: Record<string, string> = {
  owner: 'bg-primary/20 text-primary border-primary/30',
  financial: 'bg-green-500/20 text-green-500 border-green-500/30',
  project: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  member: 'bg-muted text-muted-foreground border-border',
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

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-display font-bold">Client Accounts</h2>
          <p className="text-muted-foreground">Manage client teams, members, and custom pricing</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
        </div>
      </div>

      {/* Team List */}
      <div className="grid gap-4">
        {filteredTeams.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Client Teams</h3>
            <p className="text-muted-foreground">
              Client teams are created when customers register and set up their accounts.
            </p>
          </Card>
        ) : (
          filteredTeams.map((team) => (
            <motion.div
              key={team.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className={selectedTeam?.id === team.id ? 'border-primary' : ''}>
                <CardHeader 
                  className="cursor-pointer"
                  onClick={() => {
                    setExpandedTeam(expandedTeam === team.id ? null : team.id);
                    setSelectedTeam(team);
                  }}
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      <div className="hidden sm:flex -space-x-2 shrink-0">
                        {team.members.slice(0, 3).map((member, i) => (
                          <Avatar key={member.id} className="border-2 border-background h-10 w-10">
                            <AvatarImage src={member.profile?.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {getInitials(member.display_name || member.profile?.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team.members.length > 3 && (
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                            +{team.members.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2 flex-wrap">
                          <span className="truncate max-w-[140px] sm:max-w-none">{team.team_name || team.primaryAccount?.company || 'Unnamed Team'}</span>
                          <Badge variant="outline" className="text-[10px] sm:text-xs shrink-0">
                            {team.team_code}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="flex items-center gap-3 sm:gap-4 mt-1 flex-wrap text-xs">
                          <span className="flex items-center gap-1 min-w-0">
                            <Crown className="h-3 w-3 shrink-0" />
                            <span className="truncate">{team.primaryAccount?.full_name || 'No primary account'}</span>
                          </span>
                          <span className="flex items-center gap-1 shrink-0">
                            <Users className="h-3 w-3" />
                            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 sm:px-3"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTeam(team);
                          setActiveTab('pricing');
                          setExpandedTeam(team.id);
                        }}
                      >
                        <PoundSterling className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Pricing</span>
                      </Button>
                      <motion.div
                        animate={{ rotate: expandedTeam === team.id ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </div>
                </CardHeader>

                <AnimatePresence>
                  {expandedTeam === team.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CardContent className="pt-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                          <TabsList className="mb-4 flex-wrap h-auto">
                            <TabsTrigger value="members">
                              <Users className="h-4 w-4 mr-2" />
                              Members
                            </TabsTrigger>
                            <TabsTrigger value="pricing">
                              <PoundSterling className="h-4 w-4 mr-2" />
                              Custom Pricing
                            </TabsTrigger>
                            {team.primaryAccount?.enquiry_data && (
                              <TabsTrigger value="enquiry">
                                <FileText className="h-4 w-4 mr-2" />
                                Enquiry Info
                              </TabsTrigger>
                            )}
                          </TabsList>

                          {team.primaryAccount?.enquiry_data && (
                            <TabsContent value="enquiry" className="space-y-6">
                              <EnquiryInfoSection data={team.primaryAccount.enquiry_data} />
                            </TabsContent>
                          )}


                          <TabsContent value="members" className="space-y-3">
                            {team.members.map((member) => (
                              <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage src={member.profile?.avatar_url || ''} />
                                    <AvatarFallback>
                                      {getInitials(member.display_name || member.profile?.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">
                                      {member.display_name || member.profile?.full_name || 'Unknown'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {member.profile?.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={roleColors[member.member_role] || roleColors.member}
                                  >
                                    {member.member_role}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedMember(member);
                                      setNewRole(member.member_role);
                                      setShowRoleDialog(true);
                                    }}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </TabsContent>

                          <TabsContent value="pricing" className="space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-muted-foreground">
                                Custom pricing visible only to this client
                              </p>
                              <Button size="sm" onClick={() => setShowAddPricing(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Pricing
                              </Button>
                            </div>

                            {clientPricing.length === 0 ? (
                              <div className="text-center py-8 text-muted-foreground">
                                <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No custom pricing set for this client</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {clientPricing.map((pricing) => (
                                  <div
                                    key={pricing.id}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                      !pricing.is_visible ? 'opacity-50' : ''
                                    }`}
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <p className="font-medium">{pricing.service_name}</p>
                                        <Badge variant="outline" className="text-xs">
                                          {pricing.service_type}
                                        </Badge>
                                        {pricing.is_recurring && (
                                          <Badge variant="secondary" className="text-xs">
                                            {pricing.billing_frequency || 'Recurring'}
                                          </Badge>
                                        )}
                                      </div>
                                      {pricing.notes && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                          {pricing.notes}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="text-lg font-bold text-primary">
                                        £{pricing.negotiated_price.toLocaleString()}
                                        {pricing.is_recurring && (
                                          <span className="text-sm font-normal text-muted-foreground">
                                            /{pricing.billing_frequency?.replace('ly', '') || 'mo'}
                                          </span>
                                        )}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => togglePricingVisibility(pricing)}
                                      >
                                        {pricing.is_visible ? (
                                          <Eye className="h-4 w-4" />
                                        ) : (
                                          <Eye className="h-4 w-4 opacity-50" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deletePricing(pricing.id)}
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Role Update Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedMember?.display_name || selectedMember?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner (Full Access)</SelectItem>
                  <SelectItem value="financial">Financial (Billing Access)</SelectItem>
                  <SelectItem value="project">Project (No Billing)</SelectItem>
                  <SelectItem value="member">Member (View Only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <p><strong>Owner:</strong> Full access to all features including billing and team management</p>
              <p><strong>Financial:</strong> Can view and manage billing, invoices, and pricing</p>
              <p><strong>Project:</strong> Access to project features, no billing visibility</p>
              <p><strong>Member:</strong> View-only access to allowed sections</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateMemberRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Pricing Dialog */}
      <Dialog open={showAddPricing} onOpenChange={setShowAddPricing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Pricing</DialogTitle>
            <DialogDescription>
              Set a negotiated price for {selectedTeam?.team_name || 'this client'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Type *</Label>
              <Select 
                value={newPricing.service_type} 
                onValueChange={(v) => setNewPricing({ ...newPricing, service_type: v })}
              >
                <SelectTrigger>
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
              <Label>Service Name *</Label>
              <Input
                value={newPricing.service_name}
                onChange={(e) => setNewPricing({ ...newPricing, service_name: e.target.value })}
                placeholder="e.g., Business Website Build"
              />
            </div>
            <div>
              <Label>Negotiated Price (£) *</Label>
              <Input
                type="number"
                value={newPricing.negotiated_price}
                onChange={(e) => setNewPricing({ ...newPricing, negotiated_price: e.target.value })}
                placeholder="0.00"
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
                <Label htmlFor="is_recurring">Recurring</Label>
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
              <Label>Notes (optional)</Label>
              <Textarea
                value={newPricing.notes}
                onChange={(e) => setNewPricing({ ...newPricing, notes: e.target.value })}
                placeholder="Any additional details about this pricing..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPricing(false)}>
              Cancel
            </Button>
            <Button onClick={addClientPricing}>Add Pricing</Button>
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
        ['How They Heard', 'how_did_you_hear'],
      ],
    },
    {
      title: 'Project',
      icon: FileText,
      fields: [
        ['Package', 'selected_package'],
        ['Budget', 'budget'],
        ['Timeline', 'timeline'],
        ['Primary Goal', 'primary_goal'],
        ['Pages', 'page_count'],
        ['Project Details', 'project_details'],
        ['Must-Have Features', 'must_have_features'],
        ['Inspiration Sites', 'inspiration_sites'],
        ['Competitors', 'competitors'],
      ],
    },
    {
      title: 'Business',
      icon: Building,
      fields: [
        ['Business Type', 'business_type'],
        ['Employee Count', 'employee_count'],
        ['Years in Business', 'years_in_business'],
        ['Existing Site', 'website'],
        ['Has Existing Site', 'has_existing_site'],
        ['Social Media', 'social_media'],
        ['Brand Colors', 'brand_colors'],
        ['Additional Notes', 'additional_notes'],
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map(({ title, icon: Icon, fields }) => {
        const rows = fields
          .map(([label, key]) => [label, fmt(data[key])] as const)
          .filter(([, v]) => v !== null);
        if (!rows.length) return null;
        return (
          <div key={title} className="rounded-lg border bg-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b">
              <Icon className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{title}</h4>
            </div>
            <div className="divide-y">
              {rows.map(([label, value]) => (
                <div key={label} className="px-4 py-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                    {label}
                  </p>
                  <p className="text-sm break-words">{value}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

