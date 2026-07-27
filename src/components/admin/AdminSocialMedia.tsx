import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Instagram, 
  Facebook, 
  Linkedin, 
  Twitter, 
  Youtube,
  Plus,
  Pencil,
  Trash2,
  Search,
  Users,
  Calendar,
  Clock,
  FileText,
  Image,
  Video,
  Layers,
  Circle,
  Play,
  Upload,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  customer_id: string | null;
}

interface SocialMediaAccount {
  id: string;
  user_id: string;
  platform: string;
  account_handle: string;
  account_name: string | null;
  profile_url: string | null;
  managed_by: string | null;
  posting_frequency: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

interface SocialMediaPost {
  id: string;
  account_id: string;
  user_id: string;
  title: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const platformConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  instagram: { label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
  facebook: { label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  tiktok: { label: 'TikTok', icon: Play, color: 'text-foreground' },
  linkedin: { label: 'LinkedIn', icon: Linkedin, color: 'text-blue-500' },
  twitter: { label: 'Twitter/X', icon: Twitter, color: 'text-foreground' },
  youtube: { label: 'YouTube', icon: Youtube, color: 'text-red-500' },
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  paused: { label: 'Paused', variant: 'secondary' },
  disconnected: { label: 'Disconnected', variant: 'destructive' },
};

const postStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  scheduled: { label: 'Scheduled', variant: 'secondary' },
  posted: { label: 'Posted', variant: 'default' },
  failed: { label: 'Failed', variant: 'destructive' },
};

export default function AdminSocialMedia() {
  const [clients, setClients] = useState<Profile[]>([]);
  const [selectedClient, setSelectedClient] = useState<Profile | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([]);
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Account dialog state
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialMediaAccount | null>(null);
  const [accountForm, setAccountForm] = useState({
    platform: 'instagram',
    account_handle: '',
    account_name: '',
    profile_url: '',
    managed_by: 'Echelon Team',
    posting_frequency: 'Weekly',
    status: 'active',
    notes: ''
  });

  // Post dialog state
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<SocialMediaPost | null>(null);
  const [selectedAccountForPost, setSelectedAccountForPost] = useState<string>('');
  const [postForm, setPostForm] = useState({
    title: '',
    content: '',
    media_url: '',
    media_type: 'image',
    scheduled_at: '',
    posted_at: '',
    status: 'draft',
    notes: ''
  });

  // File upload state
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchClientData();
    } else {
      setAccounts([]);
      setPosts([]);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientData = async () => {
    if (!selectedClient) return;
    
    try {
      setLoading(true);
      const [accountsRes, postsRes] = await Promise.all([
        supabase
          .from('social_media_accounts')
          .select('*')
          .eq('user_id', selectedClient.user_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', selectedClient.user_id)
          .order('scheduled_at', { ascending: true })
      ]);

      if (accountsRes.error) throw accountsRes.error;
      if (postsRes.error) throw postsRes.error;

      setAccounts(accountsRes.data || []);
      setPosts(postsRes.data || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Failed to load social media data');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = clientSearch.toLowerCase();
    return (
      client.full_name?.toLowerCase().includes(searchLower) ||
      client.email?.toLowerCase().includes(searchLower) ||
      client.company?.toLowerCase().includes(searchLower) ||
      client.customer_id?.toLowerCase().includes(searchLower)
    );
  });

  // Account handlers
  const resetAccountForm = () => {
    setAccountForm({
      platform: 'instagram',
      account_handle: '',
      account_name: '',
      profile_url: '',
      managed_by: 'Echelon Team',
      posting_frequency: 'Weekly',
      status: 'active',
      notes: ''
    });
    setEditingAccount(null);
  };

  const openAccountDialog = (account?: SocialMediaAccount) => {
    if (account) {
      setEditingAccount(account);
      setAccountForm({
        platform: account.platform,
        account_handle: account.account_handle,
        account_name: account.account_name || '',
        profile_url: account.profile_url || '',
        managed_by: account.managed_by || 'Echelon Team',
        posting_frequency: account.posting_frequency || 'Weekly',
        status: account.status,
        notes: account.notes || ''
      });
    } else {
      resetAccountForm();
    }
    setShowAccountDialog(true);
  };

  const saveAccount = async () => {
    if (!selectedClient || !accountForm.account_handle) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const accountData = {
        user_id: selectedClient.user_id,
        platform: accountForm.platform,
        account_handle: accountForm.account_handle,
        account_name: accountForm.account_name || null,
        profile_url: accountForm.profile_url || null,
        managed_by: accountForm.managed_by || 'Echelon Team',
        posting_frequency: accountForm.posting_frequency || 'Weekly',
        status: accountForm.status,
        notes: accountForm.notes || null
      };

      if (editingAccount) {
        const { error } = await supabase
          .from('social_media_accounts')
          .update(accountData)
          .eq('id', editingAccount.id);

        if (error) throw error;
        toast.success('Account updated successfully');
      } else {
        const { error } = await supabase
          .from('social_media_accounts')
          .insert(accountData);

        if (error) throw error;
        toast.success('Account added successfully');
      }

      setShowAccountDialog(false);
      resetAccountForm();
      fetchClientData();
    } catch (error) {
      console.error('Error saving account:', error);
      toast.error('Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async (account: SocialMediaAccount) => {
    if (!confirm('Delete this account? All associated posts will also be deleted.')) return;

    try {
      const { error } = await supabase
        .from('social_media_accounts')
        .delete()
        .eq('id', account.id);

      if (error) throw error;
      toast.success('Account deleted');
      fetchClientData();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  // Post handlers
  const resetPostForm = () => {
    setPostForm({
      title: '',
      content: '',
      media_url: '',
      media_type: 'image',
      scheduled_at: '',
      posted_at: '',
      status: 'draft',
      notes: ''
    });
    setEditingPost(null);
    setSelectedAccountForPost('');
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const openPostDialog = (post?: SocialMediaPost) => {
    if (post) {
      setEditingPost(post);
      setSelectedAccountForPost(post.account_id);
      setPostForm({
        title: post.title,
        content: post.content || '',
        media_url: post.media_url || '',
        media_type: post.media_type || 'image',
        scheduled_at: post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
        posted_at: post.posted_at ? format(new Date(post.posted_at), "yyyy-MM-dd'T'HH:mm") : '',
        status: post.status,
        notes: post.notes || ''
      });
      if (post.media_url) {
        setPreviewUrl(post.media_url);
      }
    } else {
      resetPostForm();
    }
    setShowPostDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setPostForm(prev => ({
        ...prev,
        media_type: file.type.startsWith('video/') ? 'video' : 'image'
      }));
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !selectedClient) return null;

    try {
      setUploading(true);
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedClient.user_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('ad-creatives')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('ad-creatives')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const savePost = async () => {
    if (!selectedClient || !selectedAccountForPost || !postForm.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      
      let mediaUrl = postForm.media_url;
      if (selectedFile) {
        const uploadedUrl = await uploadFile();
        if (uploadedUrl) {
          mediaUrl = uploadedUrl;
        }
      }

      const postData = {
        account_id: selectedAccountForPost,
        user_id: selectedClient.user_id,
        title: postForm.title,
        content: postForm.content || null,
        media_url: mediaUrl || null,
        media_type: postForm.media_type,
        scheduled_at: postForm.scheduled_at ? new Date(postForm.scheduled_at).toISOString() : null,
        posted_at: postForm.posted_at ? new Date(postForm.posted_at).toISOString() : null,
        status: postForm.status,
        notes: postForm.notes || null
      };

      if (editingPost) {
        const { error } = await supabase
          .from('social_media_posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        toast.success('Post updated successfully');
      } else {
        const { error } = await supabase
          .from('social_media_posts')
          .insert(postData);

        if (error) throw error;
        toast.success('Post added successfully');
      }

      setShowPostDialog(false);
      resetPostForm();
      fetchClientData();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save post');
    } finally {
      setSaving(false);
    }
  };

  const deletePost = async (post: SocialMediaPost) => {
    if (!confirm('Delete this post?')) return;

    try {
      const { error } = await supabase
        .from('social_media_posts')
        .delete()
        .eq('id', post.id);

      if (error) throw error;
      toast.success('Post deleted');
      fetchClientData();
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const getPlatformInfo = (platform: string) => {
    return platformConfig[platform] || { label: platform, icon: Circle, color: 'text-muted-foreground' };
  };

  if (loading && clients.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Client Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Client</CardTitle>
          <CardDescription>Choose a client to manage their social media accounts and posts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          
          {clientSearch && (
            <ScrollArea className="h-[200px] border rounded-md">
              <div className="p-2 space-y-1">
                {filteredClients.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No clients found</p>
                ) : (
                  filteredClients.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setClientSearch('');
                      }}
                      className={cn(
                        "p-3 rounded-md cursor-pointer transition-colors",
                        selectedClient?.id === client.id 
                          ? "bg-primary/10 border border-primary" 
                          : "hover:bg-muted"
                      )}
                    >
                      <p className="font-medium">{client.full_name || 'Unnamed Client'}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                      {client.customer_id && (
                        <Badge variant="outline" className="mt-1">{client.customer_id}</Badge>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}

          {selectedClient && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <p className="font-medium">{selectedClient.full_name}</p>
                <p className="text-sm text-muted-foreground">{selectedClient.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
                Change
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Media Management */}
      {selectedClient ? (
        <Tabs defaultValue="accounts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="accounts">Connected Accounts</TabsTrigger>
            <TabsTrigger value="posts">Content Calendar</TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Connected Accounts</h3>
              <Button onClick={() => openAccountDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>

            {accounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No social media accounts connected</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Platform</TableHead>
                      <TableHead>Handle</TableHead>
                      <TableHead>Managed By</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      const platformInfo = getPlatformInfo(account.platform);
                      const PlatformIcon = platformInfo.icon;
                      const statusInfo = statusConfig[account.status] || { label: account.status, variant: 'outline' as const };

                      return (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <PlatformIcon className={cn("h-4 w-4", platformInfo.color)} />
                              <span>{platformInfo.label}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">@{account.account_handle}</TableCell>
                          <TableCell>{account.managed_by}</TableCell>
                          <TableCell>{account.posting_frequency}</TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openAccountDialog(account)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deleteAccount(account)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Content Calendar</h3>
              <Button onClick={() => openPostDialog()} disabled={accounts.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Add Post
              </Button>
            </div>

            {accounts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Add social media accounts first to schedule posts</p>
                </CardContent>
              </Card>
            ) : posts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No posts scheduled yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => {
                      const account = accounts.find(a => a.id === post.account_id);
                      const platformInfo = account ? getPlatformInfo(account.platform) : null;
                      const PlatformIcon = platformInfo?.icon;
                      const postStatusInfo = postStatusConfig[post.status] || { label: post.status, variant: 'outline' as const };

                      return (
                        <TableRow key={post.id}>
                          <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                          <TableCell>
                            {account && PlatformIcon && (
                              <div className="flex items-center gap-2">
                                <PlatformIcon className={cn("h-4 w-4", platformInfo?.color)} />
                                <span>@{account.account_handle}</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="capitalize">{post.media_type}</TableCell>
                          <TableCell>
                            {post.scheduled_at 
                              ? format(new Date(post.scheduled_at), 'MMM d, yyyy')
                              : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <Badge variant={postStatusInfo.variant}>{postStatusInfo.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => openPostDialog(post)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => deletePost(post)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Select a Client</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Search for and select a client above to manage their social media accounts and content calendar.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Account Dialog */}
      <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Social Media Account'}</DialogTitle>
            <DialogDescription>
              {editingAccount ? 'Update the account details' : 'Connect a new social media account for this client'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="platform">Platform</Label>
              <Select value={accountForm.platform} onValueChange={(value) => setAccountForm(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(platformConfig).map(([key, { label, icon: Icon, color }]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Icon className={cn("h-4 w-4", color)} />
                        <span>{label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account_handle">Account Handle *</Label>
              <Input
                id="account_handle"
                placeholder="username"
                value={accountForm.account_handle}
                onChange={(e) => setAccountForm(prev => ({ ...prev, account_handle: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                placeholder="Display name"
                value={accountForm.account_name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, account_name: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="profile_url">Profile URL</Label>
              <Input
                id="profile_url"
                placeholder="https://..."
                value={accountForm.profile_url}
                onChange={(e) => setAccountForm(prev => ({ ...prev, profile_url: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="managed_by">Managed By</Label>
                <Input
                  id="managed_by"
                  value={accountForm.managed_by}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, managed_by: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="posting_frequency">Posting Frequency</Label>
                <Select value={accountForm.posting_frequency} onValueChange={(value) => setAccountForm(prev => ({ ...prev, posting_frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="3x Weekly">3x Weekly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={accountForm.status} onValueChange={(value) => setAccountForm(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="disconnected">Disconnected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes..."
                value={accountForm.notes}
                onChange={(e) => setAccountForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAccountDialog(false)}>Cancel</Button>
            <Button onClick={saveAccount} disabled={saving}>
              {saving ? 'Saving...' : editingAccount ? 'Update' : 'Add Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={showPostDialog} onOpenChange={setShowPostDialog}>
        <DialogContent className="w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Edit Post' : 'Schedule New Post'}</DialogTitle>
            <DialogDescription>
              {editingPost ? 'Update the post details' : 'Create a new post for the content calendar'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid gap-2">
              <Label htmlFor="post_account">Account *</Label>
              <Select value={selectedAccountForPost} onValueChange={setSelectedAccountForPost}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => {
                    const platformInfo = getPlatformInfo(account.platform);
                    const PlatformIcon = platformInfo.icon;
                    return (
                      <SelectItem key={account.id} value={account.id}>
                        <div className="flex items-center gap-2">
                          <PlatformIcon className={cn("h-4 w-4", platformInfo.color)} />
                          <span>@{account.account_handle}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post_title">Title *</Label>
              <Input
                id="post_title"
                placeholder="Post title"
                value={postForm.title}
                onChange={(e) => setPostForm(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post_content">Content</Label>
              <Textarea
                id="post_content"
                placeholder="Post content/caption..."
                value={postForm.content}
                onChange={(e) => setPostForm(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>Media</Label>
              {previewUrl ? (
                <div className="relative">
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    {postForm.media_type === 'video' ? (
                      <video src={previewUrl} controls className="w-full h-full object-cover" />
                    ) : (
                      <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setPostForm(prev => ({ ...prev, media_url: '' }));
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/50"
                  onClick={() => document.getElementById('post-media-upload')?.click()}
                >
                  <input
                    id="post-media-upload"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload image or video</p>
                  <p className="text-xs text-muted-foreground mt-1">Max 50MB</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="media_type">Media Type</Label>
                <Select value={postForm.media_type} onValueChange={(value) => setPostForm(prev => ({ ...prev, media_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="reel">Reel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="post_status">Status</Label>
                <Select value={postForm.status} onValueChange={(value) => setPostForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="scheduled_at">Scheduled For</Label>
                <Input
                  id="scheduled_at"
                  type="datetime-local"
                  value={postForm.scheduled_at}
                  onChange={(e) => setPostForm(prev => ({ ...prev, scheduled_at: e.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="posted_at">Posted At</Label>
                <Input
                  id="posted_at"
                  type="datetime-local"
                  value={postForm.posted_at}
                  onChange={(e) => setPostForm(prev => ({ ...prev, posted_at: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="post_notes">Notes</Label>
              <Textarea
                id="post_notes"
                placeholder="Additional notes..."
                value={postForm.notes}
                onChange={(e) => setPostForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPostDialog(false)}>Cancel</Button>
            <Button onClick={savePost} disabled={saving || uploading}>
              {uploading ? 'Uploading...' : saving ? 'Saving...' : editingPost ? 'Update' : 'Add Post'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
