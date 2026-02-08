import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Stack
} from '@mui/material'
import { SwapHoriz as TransferIcon, Tune as AdjustIcon, History as HistoryIcon } from '@mui/icons-material'
import { itemService, stockService, warehouseService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import StockBadge from '../components/StockBadge'

function StockOverview() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stock, setStock] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [adjustOpen, setAdjustOpen] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)

  const [adjustData, setAdjustData] = useState({
    item_id: '',
    warehouse_id: '',
    quantity: 0,
    notes: ''
  })

  const [transferData, setTransferData] = useState({
    item_id: '',
    from_warehouse_id: '',
    to_warehouse_id: '',
    quantity: 0,
    notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [stockRes, itemsRes, warehousesRes] = await Promise.all([
        stockService.getTotal(),
        itemService.getAll(),
        warehouseService.getAll(true)
      ])
      setStock(stockRes.data)
      setProducts(itemsRes.data.filter(p => p.type === 'PRODUCT'))
      setWarehouses(warehousesRes.data)
    } catch (err) {
      setError('Error al cargar stock')
    } finally {
      setLoading(false)
    }
  }

  const handleAdjust = async () => {
    try {
      await stockService.adjust({
        ...adjustData,
        quantity: Number(adjustData.quantity)
      })
      setAdjustOpen(false)
      loadData()
    } catch (err) {
      setError('Error al ajustar stock')
    }
  }

  const handleTransfer = async () => {
    try {
      await stockService.transfer({
        ...transferData,
        quantity: Number(transferData.quantity)
      })
      setTransferOpen(false)
      loadData()
    } catch (err) {
      setError('Error al transferir stock')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando stock..." />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Stock</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<HistoryIcon />} onClick={() => navigate('/stock/movements')}>
            Movimientos
          </Button>
          <Button variant="outlined" startIcon={<AdjustIcon />} onClick={() => setAdjustOpen(true)}>
            Ajustar Stock
          </Button>
          <Button variant="contained" startIcon={<TransferIcon />} onClick={() => setTransferOpen(true)}>
            Transferir
          </Button>
        </Stack>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell align="right"><strong>Precio</strong></TableCell>
              <TableCell align="center"><strong>Stock Total</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stock.map(row => (
              <TableRow key={row.id} hover>
                <TableCell>{row.name}</TableCell>
                <TableCell align="right">${row.sale_price}</TableCell>
                <TableCell align="center">
                  <StockBadge quantity={row.total_quantity} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Ajuste */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Ajustar Stock</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            select
            label="Producto"
            value={adjustData.item_id}
            onChange={(e) => setAdjustData({ ...adjustData, item_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {products.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Depósito"
            value={adjustData.warehouse_id}
            onChange={(e) => setAdjustData({ ...adjustData, warehouse_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {warehouses.map(w => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Cantidad (positiva o negativa)"
            type="number"
            value={adjustData.quantity}
            onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notas"
            value={adjustData.notes}
            onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleAdjust}>Guardar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Transferencia */}
      <Dialog open={transferOpen} onClose={() => setTransferOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Transferir Stock</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            select
            label="Producto"
            value={transferData.item_id}
            onChange={(e) => setTransferData({ ...transferData, item_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {products.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Desde"
            value={transferData.from_warehouse_id}
            onChange={(e) => setTransferData({ ...transferData, from_warehouse_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {warehouses.map(w => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            select
            label="Hacia"
            value={transferData.to_warehouse_id}
            onChange={(e) => setTransferData({ ...transferData, to_warehouse_id: e.target.value })}
            sx={{ mb: 2 }}
          >
            {warehouses.map(w => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth
            label="Cantidad"
            type="number"
            value={transferData.quantity}
            onChange={(e) => setTransferData({ ...transferData, quantity: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Notas"
            value={transferData.notes}
            onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleTransfer}>Transferir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default StockOverview
