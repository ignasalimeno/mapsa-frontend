import { Box, Button, Typography } from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'

function PageLayout({ 
  title, 
  subtitle, 
  onBack, 
  backLabel = "Volver",
  actions,
  children 
}) {
  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} px={3}>
        <Box display="flex" alignItems="center">
          {onBack && (
            <Button
              startIcon={<BackIcon />}
              onClick={onBack}
              variant="outlined"
              sx={{ mr: 3 }}
            >
              {backLabel}
            </Button>
          )}
          <Box>
            <Typography variant="h4" gutterBottom>{title}</Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {actions && (
          <Box display="flex" gap={2}>
            {actions}
          </Box>
        )}
      </Box>

      <Box px={3}>
        {children}
      </Box>
    </Box>
  )
}

export default PageLayout