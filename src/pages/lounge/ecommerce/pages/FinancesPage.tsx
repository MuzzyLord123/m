import { DollarSign } from 'lucide-react';
import { PageHeader, PageBody, EmptyState, StatCard } from '../shared/PageChrome';

export default function FinancesPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Finances']}
        title="Finances"
        description="Payouts, taxes, fees, and financial reports for your store."
      />
      <PageBody>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Gross sales" value="—" hint="last 30 days" />
          <StatCard label="Refunds" value="—" hint="last 30 days" />
          <StatCard label="Net revenue" value="—" hint="last 30 days" />
          <StatCard label="Pending payout" value="—" hint="on next payout" />
        </div>
        <EmptyState
          icon={DollarSign}
          title="Finances will fill in as you make sales"
          description="Payouts, transaction breakdowns, tax reports and downloadable statements appear here after your first order."
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
