import { Button, Typography } from '@mui/material'
import StyledDialog from './StyledDialog'

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  confirmColor = 'primary',
  onCancel,
  onConfirm,
}) {
  return (
    <StyledDialog
      open={open}
      onClose={onCancel}
      title={title}
      maxWidth="xs"
      actions={(
        <>
          <Button variant="outlined" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="contained" color={confirmColor} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      )}
    >
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </StyledDialog>
  )
}

export default ConfirmDialog