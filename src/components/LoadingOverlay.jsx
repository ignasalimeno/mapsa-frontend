import { Box, CircularProgress, Typography, Backdrop } from '@mui/material'

function LoadingOverlay({ open, message = 'Cargando...' }) {
  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
      }}
      open={open}
    >
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
        sx={{
          minWidth: 280,
          backgroundColor: 'background.paper',
          px: 4,
          py: 3.5,
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'grey.200',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.22)',
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="h6" color="text.primary" fontWeight={600}>
          {message}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Aguarda un momento por favor
        </Typography>
      </Box>
    </Backdrop>
  )
}

export default LoadingOverlay