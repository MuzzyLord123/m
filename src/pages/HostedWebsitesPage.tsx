import { useNavigate } from 'react-router-dom';
import TeamLayout from '@/components/layout/TeamLayout';
import OfficeEcommerce from '@/pages/lounge/OfficeEcommerce';

export default function HostedWebsitesPage() {
  const navigate = useNavigate();
  return (
    <TeamLayout
      activeTab="hosted-sites"
      onTabChange={(tab) => {
        if (tab === 'hosted-sites') return;
        if (tab === 'subscription-sites') { navigate('/team/subscription-websites'); return; }
        navigate(`/dashboard?tab=${tab}`);
      }}
    >
      <div className="h-full">
        <OfficeEcommerce embedded initialTab="hosted" title="Hosted Websites" />
      </div>
    </TeamLayout>
  );
}
