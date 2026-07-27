import { useState } from 'react';
import { UserPlus, Shield, Settings } from 'lucide-react';
import CreateAccountWizard from './account-creation/CreateAccountWizard';
import ManageAdminsPanel from './account-creation/ManageAdminsPanel';
import AccountTypePresets from './account-creation/AccountTypePresets';
import { cn } from '@/lib/utils';
import { useUserRole } from '@/hooks/useUserRole';

type Section = 'create' | 'admins' | 'presets';

const SECTIONS: { key: Section; label: string; icon: any; description: string }[] = [
  { key: 'create', label: 'Create Account', icon: UserPlus, description: 'Provision admin, paid client, live preview, viewer or business management accounts.' },
  { key: 'admins', label: 'Manage Admins', icon: Shield, description: 'Add or revoke internal admin accounts.' },
  { key: 'presets', label: 'Account Type Settings', icon: Settings, description: 'Choose which apps each account type can see.' },
];

export default function AccountCreation() {
  const { isAdmin, loading } = useUserRole();
  const [section, setSection] = useState<Section>('create');

  if (!loading && !isAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Only admins can access Account Creation.</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <aside className="rounded-xl border border-border bg-card p-2 h-fit">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          const active = section === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={cn(
                'w-full flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
                active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', active && 'text-primary')} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-[11px] leading-tight opacity-70 hidden lg:block">{s.description}</p>
              </div>
            </button>
          );
        })}
      </aside>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-6 min-h-[400px]">
        {section === 'create' && <CreateAccountWizard />}
        {section === 'admins' && <ManageAdminsPanel />}
        {section === 'presets' && <AccountTypePresets />}
      </section>
    </div>
  );
}
