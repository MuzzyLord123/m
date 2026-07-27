import { ClipboardList } from 'lucide-react';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function PurchaseOrdersPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Products', 'Purchase orders']}
        title="Purchase orders"
        description="Order stock from suppliers and track it into your inventory."
      />
      <PageBody>
        <EmptyState
          icon={ClipboardList}
          title="No purchase orders"
          description="Create purchase orders to restock inventory from suppliers. When stock arrives, quantities are automatically added to your inventory counts."
          primaryAction={{ label: 'Create purchase order' }}
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
