/**
 * System Info Section - Read-only system metadata
 */

import { Card, CardContent } from '@/components/ui/card';
import { Copy } from 'lucide-react';
import type { Product } from '../../types/product.types';

interface SystemInfoSectionProps {
  product: Product;
}

export function SystemInfoSection({ product }: SystemInfoSectionProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const infoItems = [
    { label: 'Node ID', value: product.id },
    { label: 'Node Type', value: product.type },
    { label: 'Created At', value: formatDate(product.createdAt) },
    { label: 'Updated At', value: formatDate(product.updatedAt) },
    { label: 'Profile', value: product.profile || 'N/A' },
    { label: 'Parent ID', value: product.parentId || 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">System Information</h2>
        <p className="text-sm text-muted-foreground">
          Read-only system metadata and identifiers
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {infoItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => copyToClipboard(item.value)}
                className="group flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 text-left transition-colors hover:bg-muted"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 truncate font-mono text-sm">{item.value}</p>
                </div>
                <Copy className="ml-3 h-3.5 w-3.5 shrink-0 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
