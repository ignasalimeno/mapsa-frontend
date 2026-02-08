import { Box, Typography } from '@mui/material'

const PriceDisplay = ({ label, amount, variant = 'body1', showIVA = false, ivaRate = 21 }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(price))
  }

  const priceWithIVA = showIVA ? Math.round(amount * (1 + ivaRate / 100)) : Math.round(amount)

  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant={variant} fontWeight="bold">
        {formatPrice(showIVA ? priceWithIVA : amount)}
      </Typography>
      {showIVA && (
        <Typography variant="caption" color="text.secondary">
          (+ {ivaRate}% IVA)
        </Typography>
      )}
    </Box>
  )
}

export default PriceDisplay
