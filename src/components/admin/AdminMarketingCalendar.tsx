import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import MarketingCalendar from '@/components/MarketingCalendar';

interface ClientProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  customer_id: string | null;
  company: string | null;
  plan: string | null;
  status: string | null;
}

interface AdCampaign {
  id: string;
  user_id: string;
  platform: string;
  campaign_name: string;
  creative_url: string | null;
  creative_type: string;
  status: string;
  objective: string | null;
  start_date: string | null;
  monthly_budget: number | null;
  notes: string | null;
  last_updated_at: string;
  created_at: string;
}

interface SocialMediaPost {
  id: string;
  user_id: string;
  account_id: string;
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

interface ContentRequest {
  id: string;
  user_id: string;
  request_type: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  scheduled_date: string | null;
  priority: string | null;
}

export default function AdminMarketingCalendar() {
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [filteredClients, setFilteredClients] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [loadingClients, setLoadingClients] = useState(true);
  
  const [adCampaigns, setAdCampaigns] = useState<AdCampaign[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialMediaPost[]>([]);
  const [contentRequests, setContentRequests] = useState<ContentRequest[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, clientSearchTerm]);

  useEffect(() => {
    if (selectedClient) {
      fetchClientData(selectedClient.user_id);
    } else {
      setAdCampaigns([]);
      setSocialPosts([]);
      setContentRequests([]);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, customer_id, company, plan, status')
        .order('full_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setLoadingClients(false);
    }
  };

  const filterClients = () => {
    if (!clientSearchTerm) {
      setFilteredClients(clients);
      return;
    }
    const term = clientSearchTerm.toLowerCase();
    setFilteredClients(
      clients.filter(c =>
        c.full_name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.company?.toLowerCase().includes(term) ||
        c.customer_id?.toLowerCase().includes(term)
      )
    );
  };

  const fetchClientData = async (userId: string) => {
    try {
      setLoadingData(true);
      
      const [adsRes, socialRes, contentRes] = await Promise.all([
        supabase
          .from('ad_campaigns')
          .select('*')
          .eq('user_id', userId)
          .order('start_date', { ascending: false }),
        supabase
          .from('social_media_posts')
          .select('*')
          .eq('user_id', userId)
          .order('scheduled_at', { ascending: false }),
        supabase
          .from('content_requests')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
      ]);

      if (adsRes.error) throw adsRes.error;
      if (socialRes.error) throw socialRes.error;
      if (contentRes.error) throw contentRes.error;

      setAdCampaigns(adsRes.data || []);
      setSocialPosts(socialRes.data || []);
      setContentRequests(contentRes.data || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoadingData(false);
    }
  };

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    return email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold">Marketing Calendar</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            View unified calendar for each client's marketing activities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* Client Selector Sidebar */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Select Client
            </CardTitle>
            <CardDescription>Choose a client to view their marketing calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
                value={clientSearchTerm}
                onChange={(e) => setClientSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-[400px]">
              {loadingClients ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No clients found</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredClients.map((client) => (
                    <motion.div
                      key={client.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div
                        onClick={() => setSelectedClient(
                          selectedClient?.id === client.id ? null : client
                        )}
                        className={cn(
                          "p-3 rounded-lg border cursor-pointer transition-all",
                          selectedClient?.id === client.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:border-border hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 border border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {getInitials(client.full_name, client.email)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {client.full_name || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {client.company || client.email}
                            </p>
                          </div>
                          {client.customer_id && (
                            <Badge variant="outline" className="text-xs shrink-0">
                              {client.customer_id}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Calendar Content */}
        <div>
          {selectedClient ? (
            <div className="space-y-4">
              {/* Selected Client Info */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(selectedClient.full_name, selectedClient.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg">{selectedClient.full_name || 'Unknown'}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {selectedClient.company && <span>{selectedClient.company}</span>}
                        {selectedClient.email && <span>• {selectedClient.email}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedClient.plan && (
                        <Badge variant="secondary">{selectedClient.plan}</Badge>
                      )}
                      {selectedClient.customer_id && (
                        <Badge variant="outline">{selectedClient.customer_id}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marketing Calendar */}
              <MarketingCalendar
                adCampaigns={adCampaigns}
                socialPosts={socialPosts}
                contentRequests={contentRequests}
                loading={loadingData}
              />
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Select a Client</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Choose a client from the sidebar to view their unified marketing calendar with all ad campaigns, social posts, and content requests.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
