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
    <div className="p-4 md:p-6 lg:p-8">
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="flex items-center justify-between mb-4">
        <div className="overflow-x-auto">
        <TabsList className="w-max h-8">
          <TabsTrigger value="workflows" className="text-xs gap-1.5 h-7 px-3">
            <Workflow className="h-3.5 w-3.5" />
            Workflows
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="text-xs gap-1.5 h-7 px-3">
            <UserPlus className="h-3.5 w-3.5" />
            Client Onboarding
          </TabsTrigger>
        </TabsList>
      </div>
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