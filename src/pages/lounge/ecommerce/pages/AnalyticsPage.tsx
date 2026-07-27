import { BarChart3 } from 'lucide-react';
import { PageHeader, PageBody, EmptyState, StatCard } from '../shared/PageChrome';

export default function AnalyticsPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Analytics']}
        title="Analytics"
        description="Track sales, sessions, and conversion in real time across your storefront and embed instances."
      />
      <PageBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Sessions" value="—" hint="last 30 days" />
          <StatCard label="Conversion rate" value="—" hint="of sessions" />
          <StatCard label="Average order" value="—" hint="per order" />
          <StatCard label="Returning rate" value="—" hint="of customers" />
        </div>
        <EmptyState
          icon={BarChart3}
          title="Analytics warming up"
          description="Once traffic and orders start flowing through your storefront or embed script, live charts for sessions, top products, revenue and channels will populate here."
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
