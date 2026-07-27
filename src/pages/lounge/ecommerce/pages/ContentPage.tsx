import { FileText } from 'lucide-react';
import { PageHeader, PageBody, EmptyState } from '../shared/PageChrome';

export default function ContentPage() {
  return (
    <>
      <PageHeader
        breadcrumb={['E-commerce', 'Content']}
        title="Content"
        description="Blog posts, landing pages, policies and legal pages for your store."
      />
      <PageBody>
        <EmptyState
          icon={FileText}
          title="No content yet"
          description="Publish blog posts, build landing pages, and manage store policies (privacy, refund, shipping) all in one place. Content lives on your storefront and is indexed by search engines."
          primaryAction={{ label: 'Create page' }}
          status="coming-soon"
        />
      </PageBody>
    </>
  );
}
