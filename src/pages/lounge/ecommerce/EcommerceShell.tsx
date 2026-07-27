/**
 * E-commerce Section Shell — Shopify 1:1 layout
 *
 * Left sub-sidebar with every page reachable. Muted content surface on the right.
 * Every page renders through this shell for a consistent header/breadcrumb pattern.
 */
import { useState, useMemo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Home, ShoppingBag, Package, FolderTree, Boxes, ClipboardList,
  ArrowLeftRight, Gift, BookOpen, Users, FileText, DollarSign, BarChart3,
  Megaphone, Tag, ChevronDown, Search, Menu, X, Store, Code2, CreditCard, Settings as SettingsIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const EcommerceHome        = lazy(() => import('./pages/EcommerceHome'));
const OrdersPage           = lazy(() => import('./pages/OrdersPage'));
const ProductsPage         = lazy(() => import('./pages/ProductsPage'));
const CollectionsPage      = lazy(() => import('./pages/CollectionsPage'));
const InventoryPage        = lazy(() => import('./pages/InventoryPage'));
const CustomersPage        = lazy(() => import('./pages/CustomersPage'));
const DiscountsPage        = lazy(() => import('./pages/DiscountsPage'));
const AnalyticsPage        = lazy(() => import('./pages/AnalyticsPage'));
const FinancesPage         = lazy(() => import('./pages/FinancesPage'));
const MarketingPage        = lazy(() => import('./pages/MarketingPage'));
const ContentPage          = lazy(() => import('./pages/ContentPage'));
const PurchaseOrdersPage   = lazy(() => import('./pages/PurchaseOrdersPage'));
const TransfersPage        = lazy(() => import('./pages/TransfersPage'));
const GiftCardsPage        = lazy(() => import('./pages/GiftCardsPage'));
const CatalogsPage         = lazy(() => import('./pages/CatalogsPage'));
const EmbedPage            = lazy(() => import('./pages/EmbedPage'));
const PaymentsPage         = lazy(() => import('./pages/PaymentsPage'));
const SettingsPage         = lazy(() => import('./pages/SettingsPage'));

export type EcomPage =
  | 'home' | 'orders' | 'products' | 'collections' | 'inventory'
  | 'purchase_orders' | 'transfers' | 'gift_cards' | 'catalogs'
  | 'customers' | 'content' | 'finances' | 'analytics' | 'marketing'
  | 'discounts' | 'embed' | 'payments' | 'settings';

interface NavItem {
  id: EcomPage;
  label: string;
  icon: any;
  parent?: EcomPage;
  badge?: number;
  section?: 'main' | 'setup';
}

const NAV: NavItem[] = [
  { id: 'home',            label: 'Home',            icon: Home,          section: 'main' },
  { id: 'orders',          label: 'Orders',          icon: ShoppingBag,   section: 'main' },
  { id: 'products',        label: 'Products',        icon: Package,       section: 'main' },
  { id: 'collections',     label: 'Collections',     icon: FolderTree,    parent: 'products' },
  { id: 'inventory',       label: 'Inventory',       icon: Boxes,         parent: 'products' },
  { id: 'purchase_orders', label: 'Purchase orders', icon: ClipboardList, parent: 'products' },
  { id: 'transfers',       label: 'Transfers',       icon: ArrowLeftRight,parent: 'products' },
  { id: 'gift_cards',      label: 'Gift cards',      icon: Gift,          parent: 'products' },
  { id: 'catalogs',        label: 'Catalogs',        icon: BookOpen,      parent: 'products' },
  { id: 'customers',       label: 'Customers',       icon: Users,         section: 'main' },
  { id: 'content',         label: 'Content',         icon: FileText,      section: 'main' },
  { id: 'finances',        label: 'Finances',        icon: DollarSign,    section: 'main' },
  { id: 'analytics',       label: 'Analytics',       icon: BarChart3,     section: 'main' },
  { id: 'marketing',       label: 'Marketing',       icon: Megaphone,     section: 'main' },
  { id: 'discounts',       label: 'Discounts',       icon: Tag,           section: 'main' },
  { id: 'embed',           label: 'Embed script',    icon: Code2,         section: 'setup' },
  { id: 'payments',        label: 'Payments',        icon: CreditCard,    section: 'setup' },
  { id: 'settings',        label: 'Settings',        icon: SettingsIcon,  section: 'setup' },
];

export default function EcommerceShell() {
  const navigate = useNavigate();
  const [page, setPage] = useState<EcomPage>('home');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [search, setSearch] = useState('');

  const activeIsProductsChild = useMemo(() => {
    const item = NAV.find(n => n.id === page);
    return item?.parent === 'products' || page === 'products';
  }, [page]);

  const handleNav = (id: EcomPage) => {
    setPage(id);
    setMobileNavOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col overflow-hidden">
      <div className="absolute top-0 right-0 w-[560px] h-[560px] bg-brand/[0.05] rounded-full blur-[140px] pointer-events-none -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[420px] h-[420px] bg-brand/[0.04] rounded-full blur-[120px] pointer-events-none translate-y-1/3 -translate-x-1/4" />

      <header className="relative shrink-0 h-14 border-b border-border/40 bg-card/60 backdrop-blur-xl flex items-center px-3 sm:px-4 gap-2 sm:gap-4">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-xl text-xs px-2.5 shrink-0" onClick={() => navigate('/lounge')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Lounge</span>
        </Button>
        <button
          className="lg:hidden h-8 w-8 rounded-xl hover:bg-muted flex items-center justify-center shrink-0"
          onClick={() => setMobileNavOpen(v => !v)}
          aria-label="Toggle navigation"
        >
          {mobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
        <div className="hidden sm:block h-4 w-px bg-border/40" />
        <button className="hidden sm:flex items-center gap-2 h-8 px-2.5 rounded-xl hover:bg-muted transition-colors shrink-0 max-w-[220px]">
          <div className="h-6 w-6 rounded-lg bg-brand/15 border border-brand/25 flex items-center justify-center shrink-0">
            <Store className="h-3 w-3 text-brand" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight truncate">Your store</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </button>
        <div className="flex-1 max-w-2xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products, orders, customers…"
            className="pl-9 pr-3 h-9 rounded-xl bg-muted/40 border-border/30 hover:bg-muted/60 focus-visible:bg-background text-[13px]"
          />
        </div>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 font-semibold uppercase tracking-[0.14em]">
            E-commerce
          </span>
        </div>
      </header>

      <div className="relative flex-1 flex overflow-hidden">
        <aside
          className={cn(
            'w-[244px] shrink-0 border-r border-border/40 bg-card/40 backdrop-blur-xl overflow-y-auto transition-transform',
            'lg:translate-x-0 lg:static',
            mobileNavOpen ? 'translate-x-0 absolute inset-y-0 left-0 top-14 z-40' : '-translate-x-full absolute inset-y-0 left-0 top-14 z-40 lg:relative lg:top-0',
          )}
        >
          <nav className="p-3 space-y-0.5">
            {NAV.filter(n => n.section === 'main' && !n.parent).map(item => {
              const active = page === item.id;
              const isProducts = item.id === 'products';
              const showChildren = isProducts && activeIsProductsChild;
              return (
                <div key={item.id}>
                  <NavRow item={item} active={active} onClick={() => handleNav(item.id)} />
                  {showChildren && (
                    <div className="mt-1 mb-1.5 ml-3 pl-3 border-l border-border/40 space-y-0.5">
                      {NAV.filter(n => n.parent === 'products').map(child => (
                        <NavRow key={child.id} item={child} active={page === child.id} onClick={() => handleNav(child.id)} nested />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="pt-4 mt-3 border-t border-border/40 space-y-0.5">
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">Setup</p>
              {NAV.filter(n => n.section === 'setup').map(item => (
                <NavRow key={item.id} item={item} active={page === item.id} onClick={() => handleNav(item.id)} />
              ))}
            </div>
          </nav>
        </aside>

        {mobileNavOpen && (
          <div className="lg:hidden absolute inset-0 top-14 bg-foreground/20 z-30" onClick={() => setMobileNavOpen(false)} />
        )}

        <main className="relative flex-1 overflow-y-auto">
          <Suspense fallback={
            <div className="h-full flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-border/40 border-t-brand rounded-full animate-spin" />
            </div>
          }>
            {page === 'home'            && <EcommerceHome onNavigate={handleNav} />}
            {page === 'orders'          && <OrdersPage />}
            {page === 'products'        && <ProductsPage />}
            {page === 'collections'     && <CollectionsPage />}
            {page === 'inventory'       && <InventoryPage />}
            {page === 'purchase_orders' && <PurchaseOrdersPage />}
            {page === 'transfers'       && <TransfersPage />}
            {page === 'gift_cards'      && <GiftCardsPage />}
            {page === 'catalogs'        && <CatalogsPage />}
            {page === 'customers'       && <CustomersPage />}
            {page === 'content'         && <ContentPage />}
            {page === 'finances'        && <FinancesPage />}
            {page === 'analytics'       && <AnalyticsPage />}
            {page === 'marketing'       && <MarketingPage />}
            {page === 'discounts'       && <DiscountsPage />}
            {page === 'embed'           && <EmbedPage />}
            {page === 'payments'        && <PaymentsPage />}
            {page === 'settings'        && <SettingsPage />}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

function NavRow({
  item, active, onClick, nested = false,
}: { item: NavItem; active: boolean; onClick: () => void; nested?: boolean }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 px-2.5 rounded-xl text-left transition-all group',
        nested ? 'h-8 text-[12.5px]' : 'h-9 text-[13px]',
        active
          ? 'bg-brand/10 text-brand font-semibold border border-brand/15'
          : 'text-foreground/75 hover:bg-muted/60 hover:text-foreground border border-transparent'
      )}
    >
      <Icon className={cn(
        'shrink-0',
        nested ? 'h-3.5 w-3.5' : 'h-4 w-4',
        active ? 'text-brand' : 'text-muted-foreground group-hover:text-foreground'
      )} />
      <span className="truncate flex-1 leading-none">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="text-[10px] font-semibold tabular-nums bg-foreground/10 text-foreground/70 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
          {item.badge}
        </span>
      )}
    </button>
  );
}

