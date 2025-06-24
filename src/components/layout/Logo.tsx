import { PiggyBank } from 'lucide-react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-sm">
      <PiggyBank className={`h-8 w-8 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
      {!collapsed && <span className="text-xl font-headline font-semibold">{APP_NAME}</span>}
    </Link>
  );
}
