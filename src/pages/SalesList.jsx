import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material'
import { PageLayout } from '../components'
import { salesService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel } from '../context'

const statusMap = {
  OPEN: { label: 'Abierta', color: 'info' },
  IN_PROGRESS: { label: 'En progreso', color: 'warning' },
  READY: { label: 'Lista', color: 'success' },
  INVOICED: { label: 'Facturada', color: 'primary' },
  NEW: { label: 'Pendiente', color: 'warning' },
  PARTIAL_PAID: { label: 'Parcial', color: 'info' },
  PAID: { label: 'Pagada', color: 'success' },
}

function SalesList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { channel } = useChannel()
  const [filters, setFilters] = useState({
    search: '',
    sale_type: '',
    date_from: '',
    date_to: '',
    channel: 'ALL',
  })

  useEffect(() => {
    loadSales()
  }, [channel])

  const loadSales = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await salesService.list(filters)
      setRows(response.data || [])
    } catch (err) {
      setError('Error al cargar ventas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleExport = async () => {
    try {
      const response = await salesService.exportCsv(filters)
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'ventas.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar ventas')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <PageLayout title="Ventas" subtitle="Listado unificado de remitos y facturas">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por número, cliente o ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={filters.sale_type}
                onChange={(e) => handleFilterChange('sale_type', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="REMITO">Remito</MenuItem>
                <MenuItem value="FACTURA">Factura</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Canal"
                value={filters.channel}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
              >
                <MenuItem value="ALL">Consolidado</MenuItem>
                <MenuItem value="MAPSA">MAPSA</MenuItem>
                <MenuItem value="VIGIA">VIGIA</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2} display="flex" gap={1} justifyContent="flex-end">
              <Button variant="contained" onClick={loadSales}>Filtrar</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>CSV</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Ventas</Typography>
            <Typography variant="body2" color="text.secondary">
              {rows.length} resultado{rows.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {rows.length === 0 ? (
            <Typography>No hay ventas con los filtros seleccionados.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Tipo</TableCell>
                    <TableCell>ID</TableCell>
                    <TableCell>Número</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Remito</TableCell>
                    <TableCell>Canal</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={`${row.sale_type}-${row.sale_id}`}>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.sale_type === 'REMITO' ? 'Remito' : 'Factura'}
                          color={row.sale_type === 'REMITO' ? 'info' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>#{row.sale_id}</TableCell>
                      <TableCell>{row.number}</TableCell>
                      <TableCell>{formatDate(row.sale_date)}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>
                      <TableCell>{row.work_order_id ? `#${row.work_order_id}` : '-'}</TableCell>
                      <TableCell>{row.channel}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusMap[row.status]?.label || row.status}
                          color={statusMap[row.status]?.color || 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(row.total, false)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default SalesList
