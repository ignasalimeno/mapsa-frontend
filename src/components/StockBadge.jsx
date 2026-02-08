import { Chip } from '@mui/material'
import { Inventory as StockIcon } from '@mui/icons-material'

const StockBadge = ({ quantity, size = 'small' }) => {
  const getColor = () => {
    if (quantity <= 0) return 'error'
    if (quantity < 10) return 'warning'
    return 'success'
  }

  return (
    <Chip
      icon={<StockIcon />}
      label={`Stock: ${quantity}`}
      size={size}
      color={getColor()}
      variant="outlined"
    />
  )
}

export default StockBadge
