import { useLocation } from 'wouter';

export function useBreadcrumbs() {
  const [location] = useLocation();
  const pathParts = location.slice(1).split('/').filter(Boolean);
  return {
    breadcrumbs: pathParts.map((p, idx) => ({
      label: p.replace(/-/g, ' '),
      path: `/${pathParts.slice(0, idx + 1).join('/')}`,
    })),
  };
}

