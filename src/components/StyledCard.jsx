import { Card, CardContent, Typography, Box } from '@mui/material'

function StyledCard({ 
  title, 
  subtitle, 
  actions, 
  children, 
  sx = {} 
}) {
  return (
    <Card sx={{ mb: 3, overflow: 'hidden', ...sx }}>
      <CardContent sx={{ p: 0 }}>
        {(title || actions) && (
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems="center" 
            p={3}
            pb={title && !children ? 3 : 2}
            borderBottom={children ? '1px solid #e2e8f0' : 'none'}
            sx={{ backgroundColor: 'grey.50' }}
          >
            {title && (
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {title}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" mt={0.5}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )}
            {actions && (
              <Box display="flex" gap={2}>
                {actions}
              </Box>
            )}
          </Box>
        )}
        
        {children && (
          <Box p={title || actions ? 3 : 0}>
            {children}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default StyledCard