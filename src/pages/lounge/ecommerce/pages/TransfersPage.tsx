import { ArrowLeftRight } from 'lucide-react';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function TransfersPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Products', 'Transfers']}
        title="Transfers"
        description="Move stock between locations."
      />
      <PageBody>
        <EmptyState
          icon={ArrowLeftRight}
          title="No transfers"
          description="If you sell from more than one location — a warehouse, a shop, a pop-up — transfer stock between them and keep counts accurate."
          primaryAction={{ label: 'Create transfer' }}
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
