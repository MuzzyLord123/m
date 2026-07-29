import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { WorkflowListPage } from '@/components/workflow/WorkflowListPage';
import { WorkflowBuilder } from '@/components/workflow/WorkflowBuilder';
import { AutomationHub } from '@/components/workflow/AutomationHub';
import { ClientOnboardingEngine } from '@/components/workflow/ClientOnboardingEngine';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Workflow, UserPlus } from 'lucide-react';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { usePortalHome } from '@/hooks/usePortalHome';

export default function LoungeWorkflows() {
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);
  const [isNewWorkflow, setIsNewWorkflow] = useState(false);
  const [showHub, setShowHub] = useState(false);
  const [activeTab, setActiveTab] = useState('workflows');
  const [showExitSplash, setShowExitSplash] = useState(false);

  if (showExitSplash) {
    return <ExitSplash moduleName="Workflow Builder" onComplete={() => navigate(portalHome, { state: { skipSplash: true } })} />;
  }

  if (showHub) {
    return (
      <div className="fixed inset-0 z-50">
        <AutomationHub
          onBack={() => setShowHub(false)}
          onUseTemplate={(id) => { setShowHub(false); setActiveWorkflowId(id); }}
        />
      </div>
    );
  }

  if (activeWorkflowId || isNewWorkflow) {
    return (
      <div className="fixed inset-0 z-50">
        <WorkflowBuilder
          workflowId={activeWorkflowId || undefined}
          onBack={() => { setActiveWorkflowId(null); setIsNewWorkflow(false); }}
          onExit={() => setShowExitSplash(true)}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1024px] px-5 py-7 lg:px-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-5 flex items-center gap-1 border-b border-border/60">
          <TabsList className="h-auto gap-1 rounded-none border-0 bg-transparent p-0">
            <TabsTrigger
              value="workflows"
              className="relative -mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <Workflow className="h-3.5 w-3.5" />
              Workflows
            </TabsTrigger>
            <TabsTrigger
              value="onboarding"
              className="relative -mb-px gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] text-muted-foreground shadow-none transition-colors duration-150 hover:text-foreground data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Client onboarding
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="workflows" className="mt-0">
          <WorkflowListPage
            onOpenWorkflow={(id) => setActiveWorkflowId(id)}
            onNewWorkflow={() => setIsNewWorkflow(true)}
            onOpenHub={() => setShowHub(true)}
          />
        </TabsContent>
        <TabsContent value="onboarding" className="mt-0">
          <ClientOnboardingEngine />
        </TabsContent>
      </Tabs>
    </div>
  );
}
