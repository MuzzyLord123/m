import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Deployment {
  id: string;
  site_id: string;
  version_number: number;
  status: string;
  subdomain: string | null;
  custom_domain: string | null;
  live_url: string | null;
  storage_path: string | null;
  file_count: number;
  total_size_bytes: number;
  build_log: { step: string; status: string; timestamp: string; details?: string }[];
  page_count: number;
  deployed_at: string | null;
  created_at: string;
}

export interface SiteDomain {
  id: string;
  site_id: string;
  domain_type: string;
  domain_name: string;
  status: string;
  dns_verified: boolean;
  ssl_active: boolean;
  dns_instructions: any;
  verified_at: string | null;
  created_at: string;
}

export function useSitePublish(siteId?: string) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [domains, setDomains] = useState<SiteDomain[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState(0);
  const [publishStage, setPublishStage] = useState('');
  const [loading, setLoading] = useState(true);

  const loadDeployments = useCallback(async () => {
    if (!siteId) { setLoading(false); return; }
    const [{ data: deps }, { data: doms }] = await Promise.all([
      supabase
        .from('site_deployments')
        .select('*')
        .eq('site_id', siteId)
        .order('version_number', { ascending: false })
        .limit(20),
      supabase
        .from('site_domains')
        .select('*')
        .eq('site_id', siteId)
        .order('created_at', { ascending: false }),
    ]);
    if (deps) setDeployments(deps as unknown as Deployment[]);
    if (doms) setDomains(doms as unknown as SiteDomain[]);
    setLoading(false);
  }, [siteId]);

  useEffect(() => { loadDeployments(); }, [loadDeployments]);

  const publish = useCallback(async (
    siteName: string,
    pages: { page_name: string; slug: string; is_homepage: boolean; elements: any[]; seo_title?: string; seo_description?: string; page_settings?: any }[]
  ) => {
    if (!siteId || publishing) return null;
    setPublishing(true);
    setPublishProgress(0);
    setPublishStage('Preparing deployment…');

    const stages = [
      { pct: 10, label: 'Compiling pages…' },
      { pct: 30, label: 'Optimizing assets…' },
      { pct: 50, label: 'Uploading files…' },
      { pct: 70, label: 'Configuring CDN…' },
      { pct: 85, label: 'Activating deployment…' },
      { pct: 95, label: 'Verifying live site…' },
    ];

    // Simulate progress stages while waiting for backend
    let stageIdx = 0;
    const progressInterval = setInterval(() => {
      if (stageIdx < stages.length) {
        setPublishProgress(stages[stageIdx].pct);
        setPublishStage(stages[stageIdx].label);
        stageIdx++;
      }
    }, 1200);

    try {
      const { data, error } = await supabase.functions.invoke('deploy-site', {
        body: { siteId, siteName, pages },
      });

      clearInterval(progressInterval);

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setPublishProgress(100);
      setPublishStage('Published successfully!');

      toast.success(`Site published! Version ${data.versionNumber}`, {
        description: `${data.fileCount} files deployed (${formatBytes(data.totalSize)})`,
        duration: 5000,
      });

      await loadDeployments();
      return data;
    } catch (err: any) {
      clearInterval(progressInterval);
      setPublishProgress(0);
      setPublishStage('');
      toast.error(err.message || 'Publishing failed');
      return null;
    } finally {
      setPublishing(false);
      // Reset progress after delay
      setTimeout(() => {
        setPublishProgress(0);
        setPublishStage('');
      }, 3000);
    }
  }, [siteId, publishing, loadDeployments]);

  const rollback = useCallback(async (deploymentId: string) => {
    if (!siteId) return;
    // Activate the chosen deployment, archive others
    await supabase
      .from('site_deployments')
      .update({ status: 'archived' })
      .eq('site_id', siteId)
      .eq('status', 'live');

    await supabase
      .from('site_deployments')
      .update({ status: 'live', deployed_at: new Date().toISOString() })
      .eq('id', deploymentId);

    toast.success('Rolled back successfully');
    await loadDeployments();
  }, [siteId, loadDeployments]);

  const addCustomDomain = useCallback(async (domainName: string) => {
    if (!siteId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const clean = domainName.toLowerCase().trim();
    const dnsInstructions = {
      records: [
        { type: 'CNAME', name: clean.startsWith('www.') ? 'www' : '@', value: 'sites.quooro.site' },
        { type: 'TXT', name: '_quooro', value: `quooro-verify=${siteId.slice(0, 8)}` },
      ],
    };

    const { error } = await supabase.from('site_domains').insert({
      site_id: siteId,
      user_id: user.id,
      domain_type: 'custom',
      domain_name: clean,
      status: 'pending_dns',
      dns_instructions: dnsInstructions,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('This domain is already registered');
      } else {
        toast.error('Failed to add domain');
      }
      return;
    }

    toast.success('Domain added! Configure DNS to complete setup.');
    await loadDeployments();
  }, [siteId, loadDeployments]);

  const removeDomain = useCallback(async (domainId: string) => {
    await supabase.from('site_domains').delete().eq('id', domainId);
    toast.success('Domain removed');
    await loadDeployments();
  }, [loadDeployments]);

  const currentDeployment = deployments.find(d => d.status === 'live') || null;

  return {
    deployments,
    domains,
    currentDeployment,
    publishing,
    publishProgress,
    publishStage,
    loading,
    publish,
    rollback,
    addCustomDomain,
    removeDomain,
    reload: loadDeployments,
  };
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
