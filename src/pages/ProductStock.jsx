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
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material'
import { ArrowBack as BackIcon, Add as AddIcon } from '@mui/icons-material'
import { itemService, stockService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import StockBadge from '../components/StockBadge'

function ProductStock() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [stockByWarehouse, setStockByWarehouse] = useState([])
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedWarehouse, setSelectedWarehouse] = useState(null)
  const [addQuantity, setAddQuantity] = useState('')
  const [addNotes, setAddNotes] = useState('')

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

  const openAddDialog = (warehouse) => {
    setSelectedWarehouse(warehouse)
    setAddQuantity('')
    setAddNotes('')
    setAddDialogOpen(true)
  }

  const handleAddStock = async () => {
    const quantity = Number(addQuantity)
    if (!selectedWarehouse || !quantity || quantity <= 0) return

    try {
      setLoading(true)
      await stockService.adjust({
        item_id: Number(id),
        warehouse_id: selectedWarehouse.id_warehouse,
        quantity,
        notes: addNotes || `Ingreso manual de stock en ${selectedWarehouse.warehouse_name}`
      })
      setAddDialogOpen(false)
      await loadData()
    } catch (error) {
      console.error('Error agregando stock:', error)
      alert('No se pudo agregar stock')
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
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stockByWarehouse.map((row) => (
              <TableRow key={row.id_warehouse} hover>
                <TableCell>{row.warehouse_name}</TableCell>
                <TableCell align="center">
                  <StockBadge quantity={row.quantity} />
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => openAddDialog(row)}
                  >
                    Agregar stock
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Agregar stock</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Depósito: {selectedWarehouse?.warehouse_name || '-'}
          </Typography>
          <TextField
            fullWidth
            label="Cantidad a agregar"
            type="number"
            value={addQuantity}
            onChange={(e) => setAddQuantity(e.target.value)}
            inputProps={{ min: 0.001, step: '0.001' }}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notas (opcional)"
            value={addNotes}
            onChange={(e) => setAddNotes(e.target.value)}
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAddStock} disabled={!addQuantity || Number(addQuantity) <= 0}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ProductStock
