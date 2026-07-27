import { BookOpen } from 'lucide-react';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function CatalogsPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Products', 'Catalogs']}
        title="Catalogs"
        description="Curated subsets of your product catalog, priced or filtered for specific channels or customers."
      />
      <PageBody>
        <EmptyState
          icon={BookOpen}
          title="No catalogs"
          description="Create separate catalogs for wholesale customers, private clients, or specific sales channels — each with its own pricing and product visibility."
          primaryAction={{ label: 'Create catalog' }}
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
