import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CADStudio } from '@/components/cad/CADStudio';
import { useMediaQuery } from '@/hooks/use-mobile';
import { DesktopOnlyMessage } from '@/components/DesktopOnlyMessage';
import { CADSplash } from '@/components/splash/CADSplash';
import { ExitSplash } from '@/components/splash/ExitSplash';
import { usePortalHome } from '@/hooks/usePortalHome';

export default function LoungeCADEditor() {
  const navigate = useNavigate();
  const portalHome = usePortalHome();
  const isSmallScreen = useMediaQuery('(max-width: 1024px)');
  const [showSplash, setShowSplash] = useState(true);
  const [showExitSplash, setShowExitSplash] = useState(false);
  const handleComplete = useCallback(() => setShowSplash(false), []);

  if (isSmallScreen) {
    return <DesktopOnlyMessage feature="CAD Studio" backPath="/lounge/cad-studio" />;
  }

  if (showExitSplash) {
    return <ExitSplash moduleName="CAD Studio" onComplete={() => navigate(portalHome, { state: { skipSplash: true } })} />;
  }

  return (
    <>
      {showSplash && <CADSplash onComplete={handleComplete} />}
      <CADStudio onExit={() => setShowExitSplash(true)} />
    </>
  );
}
