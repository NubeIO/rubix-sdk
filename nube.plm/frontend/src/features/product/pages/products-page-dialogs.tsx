import type { Product } from '@features/product/types/product.types';
import {
  DeleteProductDialogSDK as DeleteProductDialog,
  CreateProductDialogSDK,
  EditProductDialogSDK,
} from '@features/product/components';
import type { CreateProductDialogProps } from '@features/product/components/create-product-dialog-sdk';
import type { EditProductDialogProps } from '@features/product/components/edit-product-dialog-sdk';

interface DeletingProduct {
  id: string;
  name: string;
  code?: string;
}

interface ProductsPageDialogsProps {
  orgId: string;
  deviceId: string;
  baseUrl: string;
  token?: string;
  productsCollectionId?: string | null;
  templateNodeId?: string;
  createDialogOpen: boolean;
  editingProduct: Product | null;
  deletingProduct: DeletingProduct | null;
  onCloseCreate: () => void;
  onCreate: CreateProductDialogProps['onSubmit'];
  onCloseEdit: () => void;
  onEdit: EditProductDialogProps['onSubmit'];
  onCloseDelete: () => void;
  onDelete: (productId: string) => Promise<void>;
}

export function ProductsPageDialogs({
  orgId,
  deviceId,
  baseUrl,
  token,
  productsCollectionId,
  templateNodeId,
  createDialogOpen,
  editingProduct,
  deletingProduct,
  onCloseCreate,
  onCreate,
  onCloseEdit,
  onEdit,
  onCloseDelete,
  onDelete,
}: ProductsPageDialogsProps) {
  return (
    <>
      {createDialogOpen && (
        <CreateProductDialogSDK
          orgId={orgId}
          deviceId={deviceId}
          baseUrl={baseUrl}
          token={token}
          productsCollectionId={productsCollectionId || ''}
          templateNodeId={templateNodeId}
          open={createDialogOpen}
          onClose={onCloseCreate}
          onSubmit={onCreate}
        />
      )}

      {editingProduct && (
        <EditProductDialogSDK
          orgId={orgId}
          deviceId={deviceId}
          baseUrl={baseUrl}
          token={token}
          product={editingProduct}
          open={true}
          onClose={onCloseEdit}
          onSubmit={onEdit}
        />
      )}

      {deletingProduct && (
        <DeleteProductDialog
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              onCloseDelete();
            }
          }}
          productName={deletingProduct.name}
          onConfirm={async () => {
            await onDelete(deletingProduct.id);
            onCloseDelete();
          }}
        />
      )}
    </>
  );
}
