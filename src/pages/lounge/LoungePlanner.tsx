import { useNavigate } from 'react-router-dom';
import PlannerBoard from '@/components/planner/PlannerBoard';

export default function LoungePlanner() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto h-full max-w-[1280px] px-5 py-7 lg:px-8">
      <PlannerBoard
        title="Planner"
        showBackButton
        onBack={() => navigate('/lounge')}
      />
    </div>
  );
}
