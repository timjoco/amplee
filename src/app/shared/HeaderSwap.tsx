'use client';

import HeaderMinimal from '@/components/Nav/HeaderMinimal';
import HeaderPublic from '@/components/Nav/HeaderPublic';
import { usePathname } from 'next/navigation';

export default function HeaderSwap() {
  const pathname = usePathname();
  const isWaitlist = pathname?.startsWith('/waitlist');
  return isWaitlist ? <HeaderMinimal /> : <HeaderPublic />;
}
