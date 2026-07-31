import { useNavigate } from 'react-router-dom';
import TeamLayout from '@/components/layout/TeamLayout';
import SplashStudio from '@/pages/admin/SplashStudio';

export default function SplashStudioPage() {
  const navigate = useNavigate();
  return (
    <TeamLayout
      activeTab="splash"
      onTabChange={(tab) => { if (tab !== 'splash') navigate(`/dashboard?tab=${tab}`); }}
    >
      <div className="h-full">
        <SplashStudio />
      </div>
    </TeamLayout>
  );
}
