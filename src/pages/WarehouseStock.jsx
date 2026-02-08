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
  TableRow
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { warehouseService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import StockBadge from '../components/StockBadge'

function WarehouseStock() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [warehouse, setWarehouse] = useState(null)
  const [stock, setStock] = useState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [warehouseRes, stockRes] = await Promise.all([
        warehouseService.getById(id),
        warehouseService.getStock(id)
      ])
      setWarehouse(warehouseRes.data)
      setStock(stockRes.data)
    } catch (error) {
      console.error('Error cargando stock del depósito:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!warehouse) {
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
          onClick={() => navigate('/warehouses')}
          variant="outlined"
        >
          Volver
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Stock en {warehouse.name}
        </Typography>
        <Typography color="text.secondary">
          {warehouse.description || 'Sin descripción'}
        </Typography>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Código</strong></TableCell>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell align="center"><strong>Cantidad</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stock.map((row) => (
              <TableRow key={row.id} hover>
                <TableCell>{row.code || '-'}</TableCell>
                <TableCell>{row.name}</TableCell>
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

export default WarehouseStock
