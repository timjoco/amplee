import * as React from 'react';
import { useLocation, useParams } from 'react-router-dom';

import type { RouteParams } from '../types';

export function useBandId(): string | null {
  const { bandId: bandIdParam } = useParams<RouteParams>();
  const { search } = useLocation();

  return React.useMemo(() => {
    if (bandIdParam) return bandIdParam;
    const params = new URLSearchParams(search);
    return params.get('band');
  }, [bandIdParam, search]);
}
