import ConfirmDialog from './ConfirmDialog.jsx';

export default function DeleteModal({
  open,
  itemName,
  entityLabel = 'record',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <ConfirmDialog
      open={open}
      title={`Delete ${entityLabel}?`}
      message={
        itemName
          ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
          : `Are you sure you want to delete this ${entityLabel}?`
      }
      confirmLabel="Delete"
      cancelLabel="Cancel"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
