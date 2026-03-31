import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography, 
  Box, 
  IconButton,
  Divider
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

function StyledDialog({ 
  open, 
  onClose, 
  title, 
  subtitle, 
  icon,
  children, 
  actions,
  maxWidth = "md" 
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 1.5,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          px: 3,
          py: 1.5,
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
        }}
      >
        <Box sx={{ pr: 1 }}>
          <Typography variant="h6" fontWeight={700} color="primary" sx={{ lineHeight: 1.25 }}>
            {icon} {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, lineHeight: 1.45 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            backgroundColor: 'grey.100',
            mt: 0.1,
            '&:hover': { backgroundColor: 'grey.200' }
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <Divider />

      <DialogContent
        sx={{
          p: 3,
          '&:first-of-type': {
            pt: 3,
          },
        }}
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          {children}
        </Box>
      </DialogContent>

      {actions && (
        <>
          <Divider />
          <DialogActions
            sx={{
              px: 3,
              py: 1.25,
              gap: 1,
              justifyContent: 'flex-end',
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
            }}
          >
            {actions}
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}

export default StyledDialog