import { useNavigate } from 'react-router-dom';
import TeamLayout from '@/components/layout/TeamLayout';
import WebsitesStudio from '@/pages/lounge/WebsitesStudio';

/**
 * Subscriptions and hosting used to be two pages. They are one estate,
 * so they are now one page with sections.
 */
export default function WebsitesEstatePage() {
  const navigate = useNavigate();
  return (
    <TeamLayout
      activeTab="client-websites"
      onTabChange={(tab) => {
        if (tab === 'client-websites') return;
        navigate(`/dashboard?tab=${tab}`);
      }}
    >
      <div className="h-full">
        <WebsitesStudio />
      </div>
    </TeamLayout>
  );
}
