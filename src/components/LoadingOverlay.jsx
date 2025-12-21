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
          backgroundColor: 'white',
          padding: 4,
          borderRadius: 3,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography variant="h6" color="text.primary" fontWeight={500}>
          {message}
        </Typography>
      </Box>
    </Backdrop>
  )
}

export default LoadingOverlay