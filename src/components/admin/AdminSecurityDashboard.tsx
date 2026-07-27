import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldOff, 
  Users, 
  AlertTriangle,
  Send,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'sonner';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import SecuritySettings from '@/components/security/SecuritySettings';
import SecurityLogsPanel from '@/components/admin/SecurityLogsPanel';
import IPManagementPanel from '@/components/admin/IPManagementPanel';

interface UserStats {
  userId: string;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  twoFactorEnabled: boolean;
  lastLogin: string | null;
}

interface AdminStats {
  totalUsers: number;
  usersWithTwoFactor: number;
  adminCount: number;
  adminsWithTwoFactor: number;
  usersList: UserStats[];
}

export default function AdminSecurityDashboard() {
  const { status: myStatus, loading: myStatusLoading, getAdminStats } = useTwoFactor();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    const data = await getAdminStats();
    if (data) {
      setStats(data);
      setIsAdmin(true);
    } else {
      // Non-admin users will get null from getAdminStats
      setIsAdmin(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    // Wait for the initial status fetch to complete before deciding
    if (myStatusLoading) {
      return;
    }
    
    // Only fetch admin stats if the user is an admin
    if (myStatus?.role === 'admin') {
      fetchStats();
    } else {
      setLoading(false);
      setIsAdmin(false);
    }
  }, [myStatus?.role, myStatusLoading]);

  const sendSecurityReminder = async (userId: string, email: string) => {
    setSendingReminder(userId);
    // Simulate sending reminder - in production this would trigger an email
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`Security reminder sent to ${email}`);
    setSendingReminder(null);
  };

  const adoptionPercentage = stats 
    ? Math.round((stats.usersWithTwoFactor / stats.totalUsers) * 100) 
    : 0;

  const adminAdoptionPercentage = stats && stats.adminCount > 0
    ? Math.round((stats.adminsWithTwoFactor / stats.adminCount) * 100)
    : 0;

  if (loading || myStatusLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // For non-admin users, just show their personal security settings
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <SecuritySettings />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* IP Management - Team-wide blacklist/whitelist */}
      <IPManagementPanel />

      {/* Security Event Logs */}
      <SecurityLogsPanel />

      {/* Your 2FA Status */}
      <SecuritySettings />

      {/* Adoption Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Users className="h-6 w-6 text-muted-foreground" />
              {stats?.totalUsers || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>2FA Enabled</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-green-500" />
              {stats?.usersWithTwoFactor || 0}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Without 2FA</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <ShieldOff className="h-6 w-6 text-amber-500" />
              {(stats?.totalUsers || 0) - (stats?.usersWithTwoFactor || 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Adoption</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              {adoptionPercentage}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Adoption Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">2FA Adoption Rate</CardTitle>
          <CardDescription>
            Track security adoption across your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>All Users</span>
              <span className="font-medium">{adoptionPercentage}%</span>
            </div>
            <Progress value={adoptionPercentage} className="h-3" />
            <p className="text-xs text-muted-foreground">
              {stats?.usersWithTwoFactor || 0} of {stats?.totalUsers || 0} users have 2FA enabled
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center gap-2">
                Team Members
                {adminAdoptionPercentage < 100 && (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </span>
              <span className="font-medium">{adminAdoptionPercentage}%</span>
            </div>
            <Progress 
              value={adminAdoptionPercentage} 
              className={`h-3 ${adminAdoptionPercentage < 100 ? '[&>div]:bg-red-500' : ''}`}
            />
            <p className="text-xs text-muted-foreground">
              {stats?.adminsWithTwoFactor || 0} of {stats?.adminCount || 0} team members have 2FA enabled
            </p>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Security Status by User</CardTitle>
              <CardDescription>
                View 2FA status and send security reminders
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchStats} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>2FA Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.usersList?.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.fullName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                        {user.role === 'admin' ? 'Team' : 'Customer'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.twoFactorEnabled ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <span className="text-sm">Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-600">
                          <XCircle className="h-4 w-4" />
                          <span className="text-sm">Not Enabled</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.lastLogin ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="h-4 w-4" />
                          {new Date(user.lastLogin).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!user.twoFactorEnabled && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => sendSecurityReminder(user.userId, user.email)}
                          disabled={sendingReminder === user.userId}
                          className="gap-2"
                        >
                          {sendingReminder === user.userId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Send Reminder</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {(!stats?.usersList || stats.usersList.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
