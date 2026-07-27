import { useNavigate } from 'react-router-dom';
import TeamLayout from '@/components/layout/TeamLayout';
import OfficeEcommerce from '@/pages/lounge/OfficeEcommerce';

export default function SubscriptionWebsitesPage() {
  const navigate = useNavigate();
  return (
    <TeamLayout
      activeTab="subscription-sites"
      onTabChange={(tab) => {
        if (tab === 'subscription-sites') return;
        if (tab === 'hosted-sites') { navigate('/team/hosted-websites'); return; }
        navigate(`/dashboard?tab=${tab}`);
      }}
    >
      <div className="h-full">
        <OfficeEcommerce embedded initialTab="running" title="Subscription Websites" />
      </div>
    </TeamLayout>
  );
}
