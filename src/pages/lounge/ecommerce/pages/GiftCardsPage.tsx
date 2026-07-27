import { Gift } from 'lucide-react';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function GiftCardsPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Products', 'Gift cards']}
        title="Gift cards"
        description="Sell gift cards that customers can redeem at checkout."
      />
      <PageBody>
        <EmptyState
          icon={Gift}
          title="No gift cards issued"
          description="Sell gift cards in any denomination. Customers get a unique code, and the balance is applied automatically at checkout."
          primaryAction={{ label: 'Issue gift card' }}
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
