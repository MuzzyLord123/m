import { Megaphone } from 'lucide-react';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function MarketingPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Marketing']}
        title="Marketing"
        description="Run campaigns, send email blasts, and integrate with ad platforms."
      />
      <PageBody>
        <EmptyState
          icon={Megaphone}
          title="No campaigns running"
          description="Build email campaigns, connect Meta/Google Ads, and launch discount promotions from one place. Marketing performance ties directly into your analytics."
          primaryAction={{ label: 'Create campaign' }}
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
