import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Users as UsersIcon,
  Copy, 
  Check, 
  Crown, 
  Shield, 
  UserPlus,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Building2,
  RefreshCw,
  Mail,
  User,
  Phone,
  MessageSquare,
  Hash,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  LinkIcon,
} from 'lucide-react';
import { LoungePageHeader } from '@/components/lounge/LoungePageHeader';
import DiscordRoleManager from '@/components/roles/DiscordRoleManager';

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

const roleColors: Record<string, string> = {
  owner: 'bg-primary text-primary-foreground',
  financial: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  project: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  member: 'bg-muted text-muted-foreground',
};

const roleDescriptions: Record<string, string> = {
  owner: 'Full access to all features and billing',
  financial: 'Access to billing, invoices, and financial data',
  project: 'Access to project management and content',
  member: 'View-only access to basic information',
};

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
      toast.error('Failed to load team members');
    }
  };

  const copyTeamCode = () => {
    if (team?.team_code) {
      navigator.clipboard.writeText(team.team_code);
      setCopied(true);
      toast.success('Team code copied!');
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
      
      toast.success('Team created successfully!');
      setTeam(newTeam);
      setIsOwner(true);
      setTeamName('');
      await fetchMembers(newTeam.id);
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team. Please try again.');
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
      toast.error('Failed to update role');
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
      toast.error('Failed to remove member');
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

      toast.success(`Team member ${createMemberEmail} created successfully!`);
      setShowCreateDialog(false);
      setCreateMemberEmail('');
      setCreateMemberPassword('');
      setCreateMemberName('');
      setCreateMemberPhone('');
      setCreateMemberRole('member');
      fetchMembers(team.id);
    } catch (error) {
      console.error('Error creating team member:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create team member');
    } finally {
      setCreatingMember(false);
    }
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
    if (error) toast.error('Failed to add to channel');
    else {
      toast.success('Added to channel');
      const { data } = await supabase.from('comm_channel_members').select('channel_id, role, is_muted, notification_preference').eq('user_id', selectedMember.user_id);
      setMemberChannels(data || []);
    }
  };

  const removeMemberFromChannel = async (channelId: string) => {
    if (!selectedMember) return;
    const { error } = await supabase.from('comm_channel_members').delete().eq('channel_id', channelId).eq('user_id', selectedMember.user_id);
    if (error) toast.error('Failed to remove from channel');
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
      <div className="p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="p-6">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Building2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-xl font-display">Create Your Team</CardTitle>
            <CardDescription>
              Set up your team to invite members and manage access to your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Team Name (optional)</Label>
              <Input
                id="teamName"
                placeholder="e.g., My Company"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                If left blank, we'll use your company name or create one for you
              </p>
            </div>
            <Button 
              className="w-full" 
              onClick={createTeam}
              disabled={creatingTeam}
            >
              {creatingTeam ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Team...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Team
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <LoungePageHeader
        title="Team Management"
        description={isOwner 
          ? 'Manage your team members, roles, and permissions'
          : 'View your team members and their roles'
        }
        icon={UsersIcon}
      />

      {isOwner ? (
        <Tabs defaultValue="members" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="roles" className="gap-2">
              <Shield className="h-4 w-4" />
              Roles & Permissions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="members" className="space-y-6 mt-6">
      {/* Team Code Card (Owner Only) */}
      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Team Members
            </CardTitle>
            <CardDescription>
              Share your team code or create accounts directly for your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="code" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="code">Share Code</TabsTrigger>
                <TabsTrigger value="create">Create Account</TabsTrigger>
              </TabsList>
              <TabsContent value="code" className="space-y-3 pt-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Input
                      value={team.team_code}
                      readOnly
                      className="font-mono text-lg tracking-widest pr-12"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
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
                <p className="text-sm text-muted-foreground">
                  Team members can use this code when signing up to automatically join your team.
                </p>
              </TabsContent>
              <TabsContent value="create" className="space-y-3 pt-4">
                <p className="text-sm text-muted-foreground">
                  Create login credentials for a new team member directly.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Team Member Account
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                {members.length} member{members.length !== 1 ? 's' : ''} in your team
              </CardDescription>
            </div>
            {/* Team avatar stack */}
            <div className="flex -space-x-3">
              {members.slice(0, 5).map((member) => (
                <Avatar 
                  key={member.id} 
                  className="border-2 border-background h-10 w-10"
                >
                  <AvatarImage src={member.profile?.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {getInitials(member.display_name || member.profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
                  +{members.length - 5}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <AnimatePresence>
            {members.map((member, index) => {
              const isSelf = member.user_id === user?.id;
              const isPrimaryOwner = member.user_id === team.primary_account_id;
              
              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {getInitials(member.display_name || member.profile?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      {isPrimaryOwner && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                          <Crown className="h-3 w-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {member.display_name || member.profile?.full_name || 'Unknown'}
                        {isSelf && (
                          <Badge variant="secondary" className="text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {member.profile?.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* 2FA Status */}
                    {member.profile?.two_factor_enabled ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/30">
                        <Shield className="h-3 w-3 mr-1" />
                        2FA
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        No 2FA
                      </Badge>
                    )}
                    
                    {/* Role Badge */}
                    <Badge 
                      variant="outline" 
                      className={roleColors[member.member_role] || roleColors.member}
                    >
                      {member.member_role}
                    </Badge>
                    
                    {/* Actions (Owner Only, can't edit self or primary owner) */}
                    {isOwner && !isSelf && !isPrimaryOwner && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberSettings(true);
                          }}
                          title="Full settings"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Role Descriptions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role Permissions</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-4">
          {Object.entries(roleDescriptions).map(([role, description]) => (
            <div key={role} className="p-3 rounded-lg border">
              <Badge 
                variant="outline" 
                className={`mb-2 ${roleColors[role]}`}
              >
                {role}
              </Badge>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

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
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  {members.length} member{members.length !== 1 ? 's' : ''} in your team
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {members.map((member) => {
              const isSelf = member.user_id === user?.id;
              const isPrimaryOwner = member.user_id === team.primary_account_id;
              return (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.profile?.avatar_url || ''} />
                      <AvatarFallback>{getInitials(member.display_name || member.profile?.full_name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {member.display_name || member.profile?.full_name || 'Unknown'}
                        {isSelf && <Badge variant="secondary" className="text-xs">You</Badge>}
                      </p>
                      <p className="text-sm text-muted-foreground">{member.profile?.email}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={roleColors[member.member_role] || roleColors.member}>
                    {member.member_role}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Update Role Dialog */}
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
                  <SelectItem value="financial">Financial Access</SelectItem>
                  <SelectItem value="project">Project Access</SelectItem>
                  <SelectItem value="member">View Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {newRole && roleDescriptions[newRole]}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={updateMemberRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Team Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {memberToRemove?.display_name || memberToRemove?.profile?.full_name} from the team?
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This action cannot be undone. The member will lose access to all team resources.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={removeMember}>
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Member Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Team Member Account</DialogTitle>
            <DialogDescription>
              Create login credentials for a new team member
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Full Name *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="member-name"
                  placeholder="John Smith"
                  value={createMemberName}
                  onChange={(e) => setCreateMemberName(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="member-email"
                  type="email"
                  placeholder="member@example.com"
                  value={createMemberEmail}
                  onChange={(e) => setCreateMemberEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="member-phone"
                  type="tel"
                  placeholder="+44 7123 456789"
                  value={createMemberPhone}
                  onChange={(e) => setCreateMemberPhone(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-password">Password *</Label>
              <div className="relative">
                <Input
                  id="member-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={createMemberPassword}
                  onChange={(e) => setCreateMemberPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={createMemberRole} onValueChange={setCreateMemberRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Financial Access</SelectItem>
                  <SelectItem value="project">Project Access</SelectItem>
                  <SelectItem value="member">View Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createTeamMember} disabled={creatingMember}>
              {creatingMember ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ Full Member Settings Dialog ═══ */}
      <Dialog open={showMemberSettings} onOpenChange={v => { if (!v) setShowMemberSettings(false); }}>
        <DialogContent className="sm:max-w-[560px] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={selectedMember?.profile?.avatar_url || ''} />
                <AvatarFallback>{getInitials(selectedMember?.display_name || selectedMember?.profile?.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-base">{selectedMember?.display_name || selectedMember?.profile?.full_name || 'Member'}</p>
                <p className="text-xs text-muted-foreground font-normal">{selectedMember?.profile?.email}</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="role" className="flex-1 overflow-hidden">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="role" className="text-xs">Role & Access</TabsTrigger>
              <TabsTrigger value="channels" className="text-xs">Channels</TabsTrigger>
              <TabsTrigger value="notifications" className="text-xs">Notifications</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4">
              {/* Role Tab */}
              <TabsContent value="role" className="space-y-5 px-1 m-0">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Team Role</Label>
                  <Select value={newRole || selectedMember?.member_role || 'member'} onValueChange={setNewRole}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="financial">Financial Access</SelectItem>
                      <SelectItem value="project">Project Access</SelectItem>
                      <SelectItem value="member">View Only</SelectItem>
                    </SelectContent>
                  </Select>
                  {(newRole || selectedMember?.member_role) && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {roleDescriptions[newRole || selectedMember?.member_role || 'member']}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button
                    size="sm"
                    onClick={async () => {
                      if (!selectedMember || !newRole) return;
                      const { error } = await supabase.from('team_memberships').update({ member_role: newRole }).eq('id', selectedMember.id);
                      if (error) toast.error('Failed to update role');
                      else { toast.success('Role updated'); if (team) fetchMembers(team.id); }
                    }}
                    disabled={!newRole || newRole === selectedMember?.member_role}
                  >
                    Save Role
                  </Button>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Security</Label>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="text-sm">Two-Factor Authentication</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedMember?.profile?.two_factor_enabled ? 'Enabled' : 'Not enabled'}
                      </p>
                    </div>
                    <Badge variant={selectedMember?.profile?.two_factor_enabled ? 'default' : 'outline'} className={selectedMember?.profile?.two_factor_enabled ? '' : 'text-amber-600'}>
                      {selectedMember?.profile?.two_factor_enabled ? (
                        <><Shield className="h-3 w-3 mr-1" /> Active</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Inactive</>
                      )}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setShowMemberSettings(false);
                      setMemberToRemove(selectedMember);
                      setShowRemoveDialog(true);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove from Team
                  </Button>
                </div>
              </TabsContent>

              {/* Channels Tab */}
              <TabsContent value="channels" className="space-y-4 px-1 m-0">
                {memberCommsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm font-semibold mb-3">Joined Channels</p>
                      {memberChannels.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">Not in any channels yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {memberChannels.map(mc => {
                            const ch = allChannels.find(c => c.id === mc.channel_id);
                            if (!ch) return null;
                            return (
                              <div key={mc.channel_id} className="flex items-center justify-between p-2.5 rounded-lg border hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Hash className="w-3.5 h-3.5 text-primary" />
                                  </div>
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
                                        {mc.is_muted ? <VolumeX className="w-3.5 h-3.5 text-muted-foreground" /> : <Volume2 className="w-3.5 h-3.5" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>{mc.is_muted ? 'Unmute' : 'Mute'}</TooltipContent>
                                  </Tooltip>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => removeMemberFromChannel(mc.channel_id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
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
                      <p className="text-sm font-semibold mb-3">Available Channels</p>
                      <div className="space-y-1.5">
                        {allChannels
                          .filter(ch => !memberChannels.some(mc => mc.channel_id === ch.id))
                          .map(ch => (
                            <div key={ch.id} className="flex items-center justify-between p-2.5 rounded-lg border border-dashed hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-muted/50 flex items-center justify-center">
                                  <Hash className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="text-sm">{ch.name}</p>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground">{ch.channel_type}</span>
                                    {ch.join_code && (
                                      <span className="text-[9px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{ch.join_code}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => addMemberToChannel(ch.id)}>
                                <UserPlus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            </div>
                          ))}
                        {allChannels.filter(ch => !memberChannels.some(mc => mc.channel_id === ch.id)).length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-4">Member is in all channels</p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-5 px-1 m-0">
                <p className="text-xs text-muted-foreground">
                  Manage notification preferences for this team member across all their channels.
                </p>
                {memberChannels.map(mc => {
                  const ch = allChannels.find(c => c.id === mc.channel_id);
                  if (!ch) return null;
                  return (
                    <div key={mc.channel_id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Hash className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-medium">{ch.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {mc.is_muted ? <BellOff className="w-3.5 h-3.5 text-muted-foreground" /> : <Bell className="w-3.5 h-3.5" />}
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
                  <p className="text-xs text-muted-foreground text-center py-8">No channels to configure</p>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="pt-2 border-t border-border mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowMemberSettings(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
