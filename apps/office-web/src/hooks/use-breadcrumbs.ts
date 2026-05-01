import { useState } from 'react';
import { useLocation } from 'wouter';

export function useBreadcrumbs() {
  const [location] = useLocation();
  const path = location.slice(1); // Remove leading slash
  
  const [breadcrumbReplacements, setBreadcrumbReplacements] = useState<Record<string, string>>({});
  const pathParts = path ? path.split('/') : [];
  return {
    breadcrumbs: pathParts.map((p, idx) => ({
      label: breadcrumbReplacements[p] || p.replace(/-/g, ' '),
      path: `/${pathParts.slice(0, idx + 1).join('/')}`
    })),
    breadcrumbReplacements,
    setBreadcrumbReplacements
  };
} 
