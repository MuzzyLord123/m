import { useNavigate } from 'react-router-dom';
import { Monitor, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DesktopOnlyMessageProps {
  feature: string;
  backPath?: string;
}

export function DesktopOnlyMessage({ feature, backPath = '/lounge' }: DesktopOnlyMessageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Monitor className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{feature}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This feature requires a desktop browser for the best experience. Please switch to a device with a screen wider than 1024px.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(backPath)} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
