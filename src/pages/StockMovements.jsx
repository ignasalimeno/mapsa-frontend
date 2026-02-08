import { useEffect, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  MenuItem,
  Button,
  Stack
} from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { itemService, stockService, warehouseService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'

function StockMovements() {
  const [loading, setLoading] = useState(true)
  const [movements, setMovements] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [filters, setFilters] = useState({
    item_id: '',
    warehouse_id: '',
    limit: 100
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (customFilters) => {
    try {
      setLoading(true)
      const [itemsRes, warehousesRes, movementsRes] = await Promise.all([
        itemService.getAll(),
        warehouseService.getAll(),
        stockService.getMovements(customFilters || filters)
      ])
      setProducts(itemsRes.data.filter(p => p.type === 'PRODUCT'))
      setWarehouses(warehousesRes.data)
      setMovements(movementsRes.data)
    } finally {
      setLoading(false)
    }
  }

  const handleFilter = () => {
    loadData(filters)
  }

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando movimientos..." />

      <Stack direction="row" spacing={2} alignItems="center" mb={3}>
        <Button startIcon={<BackIcon />} variant="outlined" onClick={() => window.history.back()}>
          Volver
        </Button>
        <Typography variant="h4" fontWeight="bold">Movimientos de Stock</Typography>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            select
            label="Producto"
            value={filters.item_id}
            onChange={(e) => setFilters({ ...filters, item_id: e.target.value })}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {products.map(p => (
              <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Depósito"
            value={filters.warehouse_id}
            onChange={(e) => setFilters({ ...filters, warehouse_id: e.target.value })}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {warehouses.map(w => (
              <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Límite"
            type="number"
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
            sx={{ width: 120 }}
          />
          <Button variant="contained" onClick={handleFilter}>Filtrar</Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell><strong>Producto</strong></TableCell>
              <TableCell><strong>Desde</strong></TableCell>
              <TableCell><strong>Hacia</strong></TableCell>
              <TableCell align="right"><strong>Cantidad</strong></TableCell>
              <TableCell><strong>Notas</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {movements.map(m => (
              <TableRow key={m.id_movement} hover>
                <TableCell>{m.created_at}</TableCell>
                <TableCell>{m.movement_type}</TableCell>
                <TableCell>{m.item_name}</TableCell>
                <TableCell>{m.warehouse_from_name || '-'}</TableCell>
                <TableCell>{m.warehouse_to_name || '-'}</TableCell>
                <TableCell align="right">{m.quantity}</TableCell>
                <TableCell>{m.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default StockMovements
