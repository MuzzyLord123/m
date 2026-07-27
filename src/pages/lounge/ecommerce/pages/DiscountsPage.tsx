import { Tag } from 'lucide-react';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function DiscountsPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Discounts']}
        title="Discounts"
        description="Create discount codes, automatic discounts, and promotional offers for your customers."
      />
      <PageBody>
        <EmptyState
          icon={Tag}
          title="No discount codes yet"
          description="Reward customers with percentage discounts, fixed-amount off, free shipping, or buy-X-get-Y offers. Codes apply automatically at checkout."
          primaryAction={{ label: 'Create discount' }}
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
