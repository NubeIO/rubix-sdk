/**
 * Product table component
 */

import { useEffect, useState } from 'react';

// @ts-ignore - SDK types are resolved at build time
import { Button } from '@rubix-sdk/frontend/common/ui';
// @ts-ignore
import { RightClickMenu, RightClickMenuItem } from '@rubix-sdk/frontend/components/context-menu';
import { Product } from '@features/product/types/product.types';
import { formatPrice, formatProductCode } from '@features/product/utils/product-formatters';
import { EditIcon, TrashIcon } from '@shared/components/icons';
import { ProductStatusBadge } from './ProductStatusBadge';

export interface ProductTableDisplaySettings {
  showCode: boolean;
  showType: boolean;
  showStatus: boolean;
  showPrice: boolean;
  compactMode: boolean;
}

interface ProductTableProps {
  products: Product[];
  displaySettings: ProductTableDisplaySettings;
  onEdit: (product: Product) => void;
  onDelete: (productId: string, productName: string, productCode?: string) => void;
}

const CELL_PADDING = {
  compact: '6px 4px',
  normal: '8px 4px',
} as const;

interface ProductContextMenuState {
  product: Product;
  x: number;
  y: number;
}

export function ProductTable({
  products,
  displaySettings,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const [contextMenu, setContextMenu] = useState<ProductContextMenuState | null>(null);
  const cellPadding = displaySettings.compactMode ? CELL_PADDING.compact : CELL_PADDING.normal;

  useEffect(() => {
    if (!contextMenu) {
      return undefined;
    }

    const closeMenu = () => setContextMenu(null);

    window.addEventListener('scroll', closeMenu, true);
    window.addEventListener('resize', closeMenu);

    return () => {
      window.removeEventListener('scroll', closeMenu, true);
      window.removeEventListener('resize', closeMenu);
    };
  }, [contextMenu]);

  const handleDelete = (product: Product) => {
    console.log('[ProductTable] Delete clicked - Product:', product);
    console.log('[ProductTable] Product ID:', product.id);
    console.log('[ProductTable] Product Name:', product.name);
    onDelete(product.id, product.name, product.settings?.productCode);
  };

  return (
    <>
      <table
        className="w-full text-xs"
        style={{
          borderCollapse: 'collapse',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left' }}>
            <th style={{ padding: cellPadding, fontWeight: 600 }}>Name</th>
            {displaySettings.showCode && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Code</th>
            )}
            {displaySettings.showType && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Type</th>
            )}
            {displaySettings.showStatus && (
              <th style={{ padding: cellPadding, fontWeight: 600 }}>Status</th>
            )}
            {displaySettings.showPrice && (
              <th
                style={{
                  padding: cellPadding,
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                Price
              </th>
            )}
            <th
              style={{
                padding: cellPadding,
                fontWeight: 600,
                textAlign: 'right',
                width: displaySettings.compactMode ? 60 : 80,
              }}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              style={{
                borderBottom: '1px solid #f0f0f0',
                transition: 'background 0.15s',
              }}
              className="cursor-context-menu hover:bg-accent/30"
              onContextMenu={(event) => {
                event.preventDefault();
                setContextMenu({
                  product,
                  x: event.clientX,
                  y: event.clientY,
                });
              }}
            >
              <td style={{ padding: cellPadding }}>{product.name}</td>
              {displaySettings.showCode && (
                <td style={{ padding: cellPadding, color: '#666' }}>
                  {formatProductCode(product.settings?.productCode)}
                </td>
              )}
              {displaySettings.showType && (
                <td style={{ padding: cellPadding }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                    background: product.settings?.productType === 'software' ? '#e0f2fe' : product.settings?.productType === 'project' ? '#f3e8ff' : '#f0fdf4',
                    color: product.settings?.productType === 'software' ? '#0369a1' : product.settings?.productType === 'project' ? '#7c3aed' : '#166534',
                  }}>
                    {product.settings?.productType ?
                      product.settings.productType.charAt(0).toUpperCase() + product.settings.productType.slice(1)
                      : '-'}
                  </span>
                </td>
              )}
              {displaySettings.showStatus && (
                <td style={{ padding: cellPadding }}>
                  <ProductStatusBadge status={product.settings?.status} />
                </td>
              )}
              {displaySettings.showPrice && (
                <td
                  style={{
                    padding: cellPadding,
                    textAlign: 'right',
                    fontFamily: 'monospace',
                  }}
                >
                  {formatPrice(product.settings?.price)}
                </td>
              )}
              <td
                style={{
                  padding: cellPadding,
                  textAlign: 'right',
                }}
              >
                <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                  <Button
                    onClick={() => onEdit(product)}
                    size={displaySettings.compactMode ? 'sm' : 'sm'}
                    variant="outline"
                    title="Edit product"
                  >
                    <EditIcon size={displaySettings.compactMode ? 12 : 14} />
                  </Button>
                  <Button
                    onClick={() => handleDelete(product)}
                    size={displaySettings.compactMode ? 'sm' : 'sm'}
                    variant="outline"
                    title="Delete product"
                    className="text-[var(--rubix-destructive)]"
                  >
                    <TrashIcon size={displaySettings.compactMode ? 12 : 14} />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <RightClickMenu
        open={!!contextMenu}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        onClose={() => setContextMenu(null)}
      >
        <RightClickMenuItem
          icon={<EditIcon size={16} />}
          label="Edit"
          onSelect={() => {
            if (!contextMenu) {
              return;
            }
            onEdit(contextMenu.product);
            setContextMenu(null);
          }}
        />
        <RightClickMenuItem
          icon={<TrashIcon size={16} />}
          label="Delete"
          destructive
          onSelect={() => {
            if (!contextMenu) {
              return;
            }
            handleDelete(contextMenu.product);
            setContextMenu(null);
          }}
        />
      </RightClickMenu>
    </>
  );
}
