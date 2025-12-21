import { Card, CardContent, Typography, Box } from '@mui/material'

function FormCard({ title, subtitle, children, actions }) {
  return (
    <Card
      sx={{
        maxWidth: 800,
        mx: 'auto',
        mt: 2,
        background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {title && (
          <Box mb={3}>
            <Typography variant="h5" gutterBottom color="primary" fontWeight={700}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
        
        <Box component="form" noValidate>
          {children}
        </Box>
        
        {actions && (
          <Box mt={4} display="flex" gap={2} justifyContent="flex-end">
            {actions}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default FormCard