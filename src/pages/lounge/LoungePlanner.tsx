import { useNavigate } from 'react-router-dom';
import PlannerBoard from '@/components/planner/PlannerBoard';

export default function LoungePlanner() {
  const navigate = useNavigate();
  return (
    <div className="h-full p-4 md:p-6 lg:p-8">
      <PlannerBoard
        title="Planner"
        showBackButton
        onBack={() => navigate('/lounge')}
      />
    </div>
  );
}
