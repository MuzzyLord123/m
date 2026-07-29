import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Copy,
  Check,
  Crown,
  UserPlus,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Hash,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import DiscordRoleManager from '@/components/roles/DiscordRoleManager';
import { cn } from '@/lib/utils';
import {
  PageHeader, Panel, PanelHeader, StatusBadge, AvatarID, SkeletonLedger,
  FIELD, FIELD_LABEL,
} from '@/components/platform';

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
    two_factor_enabled: boolean | null;
  };
}

interface Team {
  id: string;
  team_code: string;
  team_name: string | null;
  primary_account_id: string;
}

const roleDescriptions: Record<string, string> = {
  owner: 'Full access to all features and billing',
  financial: 'Access to billing, invoices, and financial data',
  project: 'Access to project management and content',
  member: 'View-only access to basic information',
};

function RoleChip({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em]',
        role === 'owner'
          ? 'border-primary/40 text-primary'
          : 'border-border/60 text-muted-foreground',
      )}
    >
      {role}
    </span>
  );
}

export default function LoungeTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  // Member management
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [newRole, setNewRole] = useState('');

  // Remove member
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);

  // Full member settings
  const [showMemberSettings, setShowMemberSettings] = useState(false);
  const [memberChannels, setMemberChannels] = useState<any[]>([]);
  const [allChannels, setAllChannels] = useState<any[]>([]);
  const [memberCommsLoading, setMemberCommsLoading] = useState(false);

  // Create member dialog
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createMemberEmail, setCreateMemberEmail] = useState('');
  const [createMemberPassword, setCreateMemberPassword] = useState('');
  const [createMemberName, setCreateMemberName] = useState('');
  const [createMemberPhone, setCreateMemberPhone] = useState('');
  const [createMemberRole, setCreateMemberRole] = useState('member');
  const [showPassword, setShowPassword] = useState(false);
  const [creatingMember, setCreatingMember] = useState(false);

  // Create team state
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    if (user) {
      fetchTeamData();
    }
  }, [user]);

  const fetchTeamData = async () => {
    if (!user) return;

    try {
      // First check if user is a primary account holder
      const { data: ownedTeam } = await supabase
        .from('client_teams')
        .select('*')
        .eq('primary_account_id', user.id)
        .single();

      if (ownedTeam) {
        setTeam(ownedTeam);
        setIsOwner(true);
        await fetchMembers(ownedTeam.id);
      } else {
        // Check if user is a member of any team
        const { data: membership } = await supabase
          .from('team_memberships')
          .select('*, client_teams(*)')
          .eq('user_id', user.id)
          .single();

        if (membership && membership.client_teams) {
          const teamData = membership.client_teams as unknown as Team;
          setTeam(teamData);
          setIsOwner(teamData.primary_account_id === user.id);
          await fetchMembers(teamData.id);
        }
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (teamId: string) => {
    try {
      const { data: memberships, error } = await supabase
        .from('team_memberships')
        .select('*')
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for each member
      const membersWithProfiles = await Promise.all(
        (memberships || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name, avatar_url, two_factor_enabled')
            .eq('user_id', member.user_id)
            .single();
          return { ...member, profile };
        })
      );

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast.error('Team members did not load. Refresh to try again.');
    }
  };

  const copyTeamCode = () => {
    if (team?.team_code) {
      navigator.clipboard.writeText(team.team_code);
      setCopied(true);
      toast.success('Team code copied');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const createTeam = async () => {
    if (!user) return;

    setCreatingTeam(true);
    try {
      // Get user's profile for name/company
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company')
        .eq('user_id', user.id)
        .single();

      // Generate team code
      const { data: teamCodeData } = await supabase.rpc('generate_team_code');
      const generatedTeamName = teamName.trim() || profile?.company || `${profile?.full_name || 'My'}'s Team`;

      // Create the team
      const { data: newTeam, error: teamError } = await supabase
        .from('client_teams')
        .insert({
          primary_account_id: user.id,
          team_code: teamCodeData || `TEAM${Date.now().toString(36).toUpperCase()}`,
          team_name: generatedTeamName
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add user as owner in team_memberships
      const { error: memberError } = await supabase
        .from('team_memberships')
        .insert({
          team_id: newTeam.id,
          user_id: user.id,
          member_role: 'owner',
          display_name: profile?.full_name || 'Owner'
        });

      if (memberError) throw memberError;

      toast.success('Team created');
      setTeam(newTeam);
      setIsOwner(true);
      setTeamName('');
      await fetchMembers(newTeam.id);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('The team was not created. Try again.');
    } finally {
      setCreatingTeam(false);
    }
  };

  const updateMemberRole = async () => {
    if (!selectedMember || !newRole || !team) return;

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
      fetchMembers(team.id);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('The role did not update. Try again.');
    }
  };

  const removeMember = async () => {
    if (!memberToRemove || !team) return;

    try {
      const { error } = await supabase
        .from('team_memberships')
        .delete()
        .eq('id', memberToRemove.id);

      if (error) throw error;

      toast.success('Member removed from team');
      setShowRemoveDialog(false);
      setMemberToRemove(null);
      fetchMembers(team.id);
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('The member was not removed. Try again.');
    }
  };

  const createTeamMember = async () => {
    if (!team || !createMemberEmail || !createMemberPassword || !createMemberName) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (createMemberPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setCreatingMember(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast.error('You must be logged in to create team members');
        return;
      }

      const response = await supabase.functions.invoke('create-team-member', {
        body: {
          email: createMemberEmail.trim(),
          password: createMemberPassword,
          fullName: createMemberName.trim(),
          phone: createMemberPhone.trim() || null,
          memberRole: createMemberRole,
          teamId: team.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      toast.success(`Team member ${createMemberEmail} created`);
      setShowCreateDialog(false);
      setCreateMemberEmail('');
      setCreateMemberPassword('');
      setCreateMemberName('');
      setCreateMemberPhone('');
      setCreateMemberRole('member');
      fetchMembers(team.id);
    } catch (error) {
      console.error('Error creating team member:', error);
      toast.error(error instanceof Error ? error.message : 'The account was not created. Try again.');
    } finally {
      setCreatingMember(false);
    }
  };

  // Fetch member's comm channels when settings dialog opens
  useEffect(() => {
    if (!showMemberSettings || !selectedMember) return;
    (async () => {
      setMemberCommsLoading(true);
      // All channels
      const { data: chans } = await supabase.from('comm_channels').select('id, name, channel_type, join_code, is_archived').eq('is_archived', false).order('name');
      setAllChannels(chans || []);
      // Member's channels
      const { data: memberships } = await supabase.from('comm_channel_members').select('channel_id, role, is_muted, notification_preference').eq('user_id', selectedMember.user_id);
      setMemberChannels(memberships || []);
      setMemberCommsLoading(false);
    })();
  }, [showMemberSettings, selectedMember]);

  const addMemberToChannel = async (channelId: string) => {
    if (!selectedMember) return;
    const { error } = await supabase.from('comm_channel_members').upsert(
      { channel_id: channelId, user_id: selectedMember.user_id, role: 'member' },
      { onConflict: 'channel_id,user_id' }
    );
    if (error) toast.error('Could not add to the channel. Try again.');
    else {
      toast.success('Added to channel');
      const { data } = await supabase.from('comm_channel_members').select('channel_id, role, is_muted, notification_preference').eq('user_id', selectedMember.user_id);
      setMemberChannels(data || []);
    }
  };

  const removeMemberFromChannel = async (channelId: string) => {
    if (!selectedMember) return;
    const { error } = await supabase.from('comm_channel_members').delete().eq('channel_id', channelId).eq('user_id', selectedMember.user_id);
    if (error) toast.error('Could not remove from the channel. Try again.');
    else {
      toast.success('Removed from channel');
      setMemberChannels(prev => prev.filter(m => m.channel_id !== channelId));
    }
  };

  const toggleMemberMute = async (channelId: string, currentMuted: boolean) => {
    if (!selectedMember) return;
    await supabase.from('comm_channel_members').update({ is_muted: !currentMuted }).eq('channel_id', channelId).eq('user_id', selectedMember.user_id);
    setMemberChannels(prev => prev.map(m => m.channel_id === channelId ? { ...m, is_muted: !currentMuted } : m));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8" aria-hidden>
        <span className="block h-5 w-28 animate-pulse rounded bg-foreground/[0.06]" />
        <span className="mt-2 block h-3.5 w-64 animate-pulse rounded bg-foreground/[0.05]" />
        <div className="mt-6 rounded-[10px] border border-border/60">
          <SkeletonLedger rows={4} />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="mx-auto max-w-[880px] px-5 py-7 lg:px-8">
        <Panel className="mx-auto max-w-2xl">
          <div className="flex flex-col items-center px-6 pb-6 pt-12 text-center">
            <span aria-hidden className="mb-4 block h-px w-8 bg-primary" />
            <h1 className="font-display text-lg font-semibold tracking-[-0.02em] text-foreground">Create your team</h1>
            <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
              Set up a team to invite members and manage access to your account.
            </p>
          </div>
          <div className="space-y-4 px-6 pb-8 sm:px-16">
            <div className="space-y-1.5">
              <Label htmlFor="teamName" className={FIELD_LABEL}>Team name (optional)</Label>
              <Input
                id="teamName"
                className={FIELD}
                placeholder="e.g. My Company"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank and we'll use your company name or create one for you
              </p>
            </div>
            <Button
              className="h-9 w-full rounded-lg text-xs"
              onClick={createTeam}
              disabled={creatingTeam}
            >
              {creatingTeam ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Creating team
                </>
              ) : (
                <>
                  <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                  Create team
                </>
              )}
            </Button>
          </div>
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <PageHeader
        kicker="Client portal"
        title="Team"
        description={isOwner
          ? 'Manage your team members, roles and permissions'
          : 'Your team members and their roles'
        }
      />

      <div className="mt-5 space-y-6">
      {isOwner ? (
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="h-9 w-full max-w-md justify-start gap-1 rounded-none border-b border-border/60 bg-transparent p-0">
            <TabsTrigger value="members" className="rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Members
            </TabsTrigger>
            <TabsTrigger value="roles" className="rounded-none border-b-2 border-transparent px-3 text-[13px] data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              Roles and permissions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="mt-6 space-y-4">
      {/* Add members (owner only) */}
      {isOwner && (
        <Panel>
          <PanelHeader label="Add team members" />
          <div className="p-4">
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid h-9 w-full max-w-xs grid-cols-2 rounded-lg">
                <TabsTrigger value="code" className="rounded-md text-xs">Share code</TabsTrigger>
                <TabsTrigger value="create" className="rounded-md text-xs">Create account</TabsTrigger>
              </TabsList>
              <TabsContent value="code" className="space-y-3 pt-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Input
                      value={team.team_code}
                      readOnly
                      className={cn(FIELD, 'pr-12 font-mono text-[15px] tracking-widest')}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Copy team code"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={copyTeamCode}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-[13px] text-muted-foreground">
                  Team members can use this code when signing up to join your team automatically.
                </p>
              </TabsContent>
              <TabsContent value="create" className="space-y-3 pt-4">
                <p className="text-[13px] text-muted-foreground">
                  Create login credentials for a new team member directly.
                </p>
                <Button className="h-8 gap-1.5 rounded-lg px-3 text-xs" onClick={() => setShowCreateDialog(true)}>
                  <UserPlus className="h-3.5 w-3.5" />
                  Create member account
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </Panel>
      )}

      {/* Team members */}
      <Panel>
        <PanelHeader label={`${members.length} ${members.length !== 1 ? 'members' : 'member'}`}>
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((member) => (
              <AvatarID
                key={member.id}
                name={member.display_name || member.profile?.full_name}
                email={member.profile?.email}
                src={member.profile?.avatar_url}
                size="md"
                className="ring-2 ring-card"
              />
            ))}
            {members.length > 5 && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground/[0.06] font-mono text-[10px] tabular-nums ring-2 ring-card">
                +{members.length - 5}
              </span>
            )}
          </div>
        </PanelHeader>
        <div>
          {members.map((member) => {
            const isSelf = member.user_id === user?.id;
            const isPrimaryOwner = member.user_id === team.primary_account_id;

            return (
              <div
                key={member.id}
                className="flex flex-col justify-between gap-3 border-t border-border/60 px-4 py-3 transition-colors duration-150 first:border-t-0 hover:bg-foreground/[0.02] sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <AvatarID
                    name={member.display_name || member.profile?.full_name}
                    email={member.profile?.email}
                    src={member.profile?.avatar_url}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[13px] font-[550] text-foreground">
                      <span className="truncate">{member.display_name || member.profile?.full_name || 'Unknown'}</span>
                      {isPrimaryOwner && <Crown aria-label="Primary account holder" className="h-3 w-3 shrink-0 text-muted-foreground" />}
                      {isSelf && <span className="shrink-0 rounded-full border border-border/60 px-1.5 text-[10px] text-muted-foreground">You</span>}
                    </p>
                    <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{member.profile?.email}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* 2FA status */}
                  {member.profile?.two_factor_enabled ? (
                    <StatusBadge tone="ok" label="2FA on" />
                  ) : (
                    <StatusBadge tone="attend" label="No 2FA" />
                  )}

                  {/* Role */}
                  <RoleChip role={member.member_role} />

                  {/* Actions (owner only; can't edit self or primary owner) */}
                  {isOwner && !isSelf && !isPrimaryOwner && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedMember(member);
                          setShowMemberSettings(true);
                        }}
                        title="Member settings"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label="Remove member"
                        onClick={() => {
                          setMemberToRemove(member);
                          setShowRemoveDialog(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Role permissions */}
      <Panel>
        <PanelHeader label="Role permissions" />
        <div>
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <div key={role} className="flex items-center gap-4 border-t border-border/60 px-4 py-2.5 first:border-t-0">
              <span className="w-24 shrink-0"><RoleChip role={role} /></span>
              <p className="text-[13px] text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </Panel>

          </TabsContent>
          <TabsContent value="roles" className="mt-6">
            <DiscordRoleManager />
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {/* Non-owner content rendered below without tabs */}
        </>
      )}

      {/* Non-owner members list (shown outside tabs when not owner) */}
      {!isOwner && (
        <Panel>
          <PanelHeader label={`${members.length} ${members.length !== 1 ? 'members' : 'member'}`} />
          <div>
            {members.map((member) => {
              const isSelf = member.user_id === user?.id;
              const isPrimaryOwner = member.user_id === team.primary_account_id;
              return (
                <div key={member.id} className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3 first:border-t-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarID
                      name={member.display_name || member.profile?.full_name}
                      email={member.profile?.email}
                      src={member.profile?.avatar_url}
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[13px] font-[550] text-foreground">
                        <span className="truncate">{member.display_name || member.profile?.full_name || 'Unknown'}</span>
                        {isPrimaryOwner && <Crown aria-label="Primary account holder" className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        {isSelf && <span className="shrink-0 rounded-full border border-border/60 px-1.5 text-[10px] text-muted-foreground">You</span>}
                      </p>
                      <p className="truncate text-[11.5px] text-muted-foreground">{member.profile?.email}</p>
                    </div>
                  </div>
                  <RoleChip role={member.member_role} />
                </div>
              );
            })}
          </div>
        </Panel>
      )}
      </div>

      {/* Update role dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update member role</DialogTitle>
            <DialogDescription>
              Change the role for {selectedMember?.display_name || selectedMember?.profile?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className={FIELD}>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial access</SelectItem>
                  <SelectItem value="project">Project access</SelectItem>
                  <SelectItem value="member">View only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newRole && (
              <p className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-[13px] text-muted-foreground">
                {roleDescriptions[newRole]}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button className="h-8 rounded-lg px-3 text-xs" onClick={updateMemberRole}>Update role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove member dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove team member</DialogTitle>
            <DialogDescription>
              Remove {memberToRemove?.display_name || memberToRemove?.profile?.full_name} from the team?
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-[13px] text-muted-foreground">
            This cannot be undone. The member loses access to all team resources.
          </p>
          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" className="h-8 rounded-lg px-3 text-xs" onClick={removeMember}>
              Remove member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create member dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create member account</DialogTitle>
            <DialogDescription>
              Create login credentials for a new team member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="member-name" className={FIELD_LABEL}>Full name</Label>
              <Input
                id="member-name"
                placeholder="John Smith"
                value={createMemberName}
                onChange={(e) => setCreateMemberName(e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-email" className={FIELD_LABEL}>Email</Label>
              <Input
                id="member-email"
                type="email"
                placeholder="member@example.com"
                value={createMemberEmail}
                onChange={(e) => setCreateMemberEmail(e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-phone" className={FIELD_LABEL}>Phone</Label>
              <Input
                id="member-phone"
                type="tel"
                placeholder="+44 7123 456789"
                value={createMemberPhone}
                onChange={(e) => setCreateMemberPhone(e.target.value)}
                className={FIELD}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="member-password" className={FIELD_LABEL}>Password</Label>
              <div className="relative">
                <Input
                  id="member-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={createMemberPassword}
                  onChange={(e) => setCreateMemberPassword(e.target.value)}
                  className={cn(FIELD, 'pr-10')}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <div className="space-y-1.5">
              <Label className={FIELD_LABEL}>Role</Label>
              <Select value={createMemberRole} onValueChange={setCreateMemberRole}>
                <SelectTrigger className={FIELD}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial access</SelectItem>
                  <SelectItem value="project">Project access</SelectItem>
                  <SelectItem value="member">View only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="h-8 rounded-lg px-3 text-xs" onClick={createTeamMember} disabled={creatingMember}>
              {creatingMember ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating
                </span>
              ) : (
                'Create account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member settings dialog */}
      <Dialog open={showMemberSettings} onOpenChange={v => { if (!v) setShowMemberSettings(false); }}>
        <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <AvatarID
                name={selectedMember?.display_name || selectedMember?.profile?.full_name}
                email={selectedMember?.profile?.email}
                src={selectedMember?.profile?.avatar_url}
                size="lg"
              />
              <div>
                <p className="text-[15px]">{selectedMember?.display_name || selectedMember?.profile?.full_name || 'Member'}</p>
                <p className="text-xs font-normal text-muted-foreground">{selectedMember?.profile?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="role" className="flex-1 overflow-hidden">
            <TabsList className="grid h-9 w-full grid-cols-3 rounded-lg">
              <TabsTrigger value="role" className="rounded-md text-xs">Role and access</TabsTrigger>
              <TabsTrigger value="channels" className="rounded-md text-xs">Channels</TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-md text-xs">Notifications</TabsTrigger>
            </TabsList>

            <ScrollArea className="mt-4 h-[400px]">
              {/* Role tab */}
              <TabsContent value="role" className="m-0 space-y-5 px-1">
                <div className="space-y-3">
                  <Label className={FIELD_LABEL}>Team role</Label>
                  <Select value={newRole || selectedMember?.member_role || 'member'} onValueChange={setNewRole}>
                    <SelectTrigger className={FIELD}><SelectValue placeholder="Choose a role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial access</SelectItem>
                      <SelectItem value="project">Project access</SelectItem>
                      <SelectItem value="member">View only</SelectItem>
                    </SelectContent>
                  </Select>
                  {(newRole || selectedMember?.member_role) && (
                    <p className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3 text-xs text-muted-foreground">
                      {roleDescriptions[newRole || selectedMember?.member_role || 'member']}
                    </p>
                  )}
                  <Button
                    size="sm"
                    className="h-8 rounded-lg px-3 text-xs"
                    onClick={async () => {
                      if (!selectedMember || !newRole) return;
                      const { error } = await supabase.from('team_memberships').update({ member_role: newRole }).eq('id', selectedMember.id);
                      if (error) toast.error('The role did not update. Try again.');
                      else { toast.success('Role updated'); if (team) fetchMembers(team.id); }
                    }}
                    disabled={!newRole || newRole === selectedMember?.member_role}
                  >
                    Save role
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className={FIELD_LABEL}>Security</Label>
                  <div className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                    <div>
                      <p className="text-sm">Two-factor authentication</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMember?.profile?.two_factor_enabled ? 'Enabled' : 'Not enabled'}
                      </p>
                    </div>
                    {selectedMember?.profile?.two_factor_enabled ? (
                      <StatusBadge tone="ok" label="Active" />
                    ) : (
                      <StatusBadge tone="attend" label="Inactive" />
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-8 w-full rounded-lg text-xs"
                    onClick={() => {
                      setShowMemberSettings(false);
                      setMemberToRemove(selectedMember);
                      setShowRemoveDialog(true);
                    }}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove from team
                  </Button>
                </div>
              </TabsContent>

              {/* Channels tab */}
              <TabsContent value="channels" className="m-0 space-y-4 px-1">
                {memberCommsLoading ? (
                  <div className="space-y-2 py-2" aria-hidden>
                    {[1, 2, 3].map(i => (
                      <span key={i} className="block h-12 animate-pulse rounded-lg bg-foreground/[0.04]" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Joined channels</p>
                      {memberChannels.length === 0 ? (
                        <p className="py-4 text-center text-xs text-muted-foreground">Not in any channels yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {memberChannels.map(mc => {
                            const ch = allChannels.find(c => c.id === mc.channel_id);
                            if (!ch) return null;
                            return (
                              <div key={mc.channel_id} className="flex items-center justify-between rounded-lg border border-border/60 p-2.5 transition-colors duration-150 hover:bg-foreground/[0.02]">
                                <div className="flex items-center gap-2.5">
                                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                  <div>
                                    <p className="text-sm font-medium">{ch.name}</p>
                                    <p className="text-[10px] text-muted-foreground">{mc.role} · {ch.channel_type}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => toggleMemberMute(mc.channel_id, mc.is_muted)}
                                      >
                                        {mc.is_muted ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> : <Volume2 className="h-3.5 w-3.5" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{mc.is_muted ? 'Unmute' : 'Mute'}</TooltipContent>
                                  </Tooltip>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Remove from channel"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => removeMemberFromChannel(mc.channel_id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div>
                      <p className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Available channels</p>
                      <div className="space-y-1.5">
                        {allChannels
                          .filter(ch => !memberChannels.some(mc => mc.channel_id === ch.id))
                          .map(ch => (
                            <div key={ch.id} className="flex items-center justify-between rounded-lg border border-dashed border-border/60 p-2.5 transition-colors duration-150 hover:bg-foreground/[0.02]">
                              <div className="flex items-center gap-2.5">
                                <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                                <div>
                                  <p className="text-sm">{ch.name}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground">{ch.channel_type}</span>
                                    {ch.join_code && (
                                      <span className="rounded bg-foreground/[0.05] px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{ch.join_code}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => addMemberToChannel(ch.id)}>
                                <UserPlus className="mr-1 h-3 w-3" /> Add
                              </Button>
                            </div>
                          ))}
                        {allChannels.filter(ch => !memberChannels.some(mc => mc.channel_id === ch.id)).length === 0 && (
                          <p className="py-4 text-center text-xs text-muted-foreground">Member is in all channels</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Notifications tab */}
              <TabsContent value="notifications" className="m-0 space-y-5 px-1">
                <p className="text-xs text-muted-foreground">
                  Manage notification preferences for this team member across all their channels.
                </p>
                {memberChannels.map(mc => {
                  const ch = allChannels.find(c => c.id === mc.channel_id);
                  if (!ch) return null;
                  return (
                    <div key={mc.channel_id} className="flex items-center justify-between rounded-lg border border-border/60 p-3">
                      <div className="flex items-center gap-2">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-medium">{ch.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {mc.is_muted ? <BellOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Bell className="h-3.5 w-3.5" />}
                          <Switch
                            checked={!mc.is_muted}
                            onCheckedChange={() => toggleMemberMute(mc.channel_id, mc.is_muted)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                {memberChannels.length === 0 && (
                  <p className="py-8 text-center text-xs text-muted-foreground">No channels to configure</p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="mt-2 border-t border-border/60 pt-2">
            <Button variant="outline" size="sm" className="h-8 rounded-lg px-3 text-xs" onClick={() => setShowMemberSettings(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
