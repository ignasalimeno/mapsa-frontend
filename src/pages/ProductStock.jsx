import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { itemService, stockService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import StockBadge from '../components/StockBadge'

function ProductStock() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [stockByWarehouse, setStockByWarehouse] = useState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productRes, stockRes] = await Promise.all([
        itemService.getById(id),
        stockService.getByItem(id)
      ])
      setProduct(productRes.data)
      setStockByWarehouse(stockRes.data)
    } catch (error) {
      console.error('Error cargando stock:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingOverlay open={loading} message="Cargando stock..." />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando stock..." />

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/products')}
          variant="outlined"
        >
          Volver
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Stock de {product.name}
        </Typography>
        <Typography color="text.secondary">
          Código: {product.code || '-'}
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Depósito</strong></TableCell>
              <TableCell align="center"><strong>Cantidad</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockByWarehouse.map((row) => (
              <TableRow key={row.id_warehouse} hover>
                <TableCell>{row.warehouse_name}</TableCell>
                <TableCell align="center">
                  <StockBadge quantity={row.quantity} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ProductStock
