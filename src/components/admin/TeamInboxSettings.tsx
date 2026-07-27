import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Users, Star, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSettings {
  id: string;
  admin_id: string;
  is_available: boolean;
  is_primary: boolean;
  last_active_at: string | null;
  email?: string;
  full_name?: string;
}

export default function TeamInboxSettings() {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminSettings();
  }, []);

  const fetchAdminSettings = async () => {
    try {
      // Get all admins from user_roles
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (rolesError) throw rolesError;

      // Get their profiles
      const adminIds = adminRoles?.map(r => r.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email, full_name')
        .in('user_id', adminIds);

      if (profilesError) throw profilesError;

      // Get existing inbox settings
      const { data: settings, error: settingsError } = await supabase
        .from('team_inbox_settings')
        .select('*');

      if (settingsError) throw settingsError;

      // Merge data
      const mergedAdmins: AdminSettings[] = adminIds.map(adminId => {
        const profile = profiles?.find(p => p.user_id === adminId);
        const setting = settings?.find(s => s.admin_id === adminId);

        return {
          id: setting?.id || '',
          admin_id: adminId,
          is_available: setting?.is_available ?? true,
          is_primary: setting?.is_primary ?? false,
          last_active_at: setting?.last_active_at || null,
          email: profile?.email || undefined,
          full_name: profile?.full_name || undefined,
        };
      });

      setAdmins(mergedAdmins);
    } catch (error) {
      console.error('Error fetching admin settings:', error);
      toast.error('Failed to load team inbox settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (adminId: string, isAvailable: boolean) => {
    setSaving(adminId);
    try {
      const existing = admins.find(a => a.admin_id === adminId);

      if (existing?.id) {
        const { error } = await supabase
          .from('team_inbox_settings')
          .update({ is_available: isAvailable, last_active_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_inbox_settings')
          .insert({ admin_id: adminId, is_available: isAvailable });
        if (error) throw error;
      }

      setAdmins(prev => prev.map(a => 
        a.admin_id === adminId ? { ...a, is_available: isAvailable } : a
      ));
      toast.success('Availability updated');
    } catch (error) {
      console.error('Error updating availability:', error);
      toast.error('Failed to update availability');
    } finally {
      setSaving(null);
    }
  };

  const setPrimaryAdmin = async (adminId: string) => {
    setSaving(adminId);
    try {
      // First, remove primary from all
      const { error: resetError } = await supabase
        .from('team_inbox_settings')
        .update({ is_primary: false })
        .neq('admin_id', 'placeholder');

      if (resetError) throw resetError;

      // Check if setting exists for this admin
      const existing = admins.find(a => a.admin_id === adminId);

      if (existing?.id) {
        const { error } = await supabase
          .from('team_inbox_settings')
          .update({ is_primary: true })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('team_inbox_settings')
          .insert({ admin_id: adminId, is_primary: true, is_available: true });
        if (error) throw error;
      }

      setAdmins(prev => prev.map(a => ({
        ...a,
        is_primary: a.admin_id === adminId
      })));
      toast.success('Primary admin updated');
    } catch (error) {
      console.error('Error setting primary admin:', error);
      toast.error('Failed to set primary admin');
    } finally {
      setSaving(null);
    }
  };

  const getInitials = (name: string | undefined, email: string | undefined) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || 'AD';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Team Inbox Settings
        </CardTitle>
        <CardDescription>
          Configure which team members receive new customer messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {admins.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No admin users found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {admins.map((admin) => (
              <motion.div
                key={admin.admin_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(admin.full_name, admin.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {admin.full_name || admin.email || 'Unknown Admin'}
                      </span>
                      {admin.is_primary && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="w-3 h-3" />
                          Primary
                        </Badge>
                      )}
                      {admin.admin_id === user?.id && (
                        <Badge variant="outline">You</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {admin.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Available</span>
                    <Switch
                      checked={admin.is_available}
                      onCheckedChange={(checked) => toggleAvailability(admin.admin_id, checked)}
                      disabled={saving === admin.admin_id}
                    />
                  </div>
                  
                  {!admin.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPrimaryAdmin(admin.admin_id)}
                      disabled={saving === admin.admin_id}
                      className="gap-1"
                    >
                      <Star className="w-3 h-3" />
                      Set Primary
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <strong>How it works:</strong> New customer messages are routed to the primary admin first. 
            If they're unavailable, messages go to any available admin. Toggle availability off when 
            you're away to ensure customers get prompt responses.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
