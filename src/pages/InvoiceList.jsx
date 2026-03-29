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
import { Delete as DeleteIcon, Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material'
import { invoiceService } from '../services/api'
import { PageLayout } from '../components'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel } from '../context'

const statusMap = {
  NEW: { label: 'Pendiente', color: 'warning' },
  PARTIAL_PAID: { label: 'Parcial', color: 'info' },
  PAID: { label: 'Pagada', color: 'success' },
  CANCELLED: { label: 'Anulada', color: 'error' },
}

const typeMap = {
  A: 'A',
  B: 'B',
}

function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { channel } = useChannel()
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    invoice_type: '',
    date_from: '',
    date_to: '',
    channel: 'ALL',
  })

  useEffect(() => {
    loadInvoices()
  }, [channel])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await invoiceService.list(filters)
      setInvoices(response.data || [])
    } catch (err) {
      setError('Error al cargar facturas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    loadInvoices()
  }

  const handleExportCsv = async () => {
    try {
      const response = await invoiceService.exportCsv(filters)
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'facturas.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar CSV de facturas')
      console.error(err)
    }
  }

  const handleDelete = async (invoice) => {
    const confirmed = window.confirm(`¿Eliminar la factura ${invoice.number}? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    try {
      await invoiceService.delete(invoice.id)
      await loadInvoices()
    } catch (err) {
      setError('Error al eliminar factura')
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
    <PageLayout title="Facturas" subtitle="Listado de facturas con filtros y exportación CSV">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por número, cliente, ID..."
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
                label="Estado"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="NEW">Pendiente</MenuItem>
                <MenuItem value="PARTIAL_PAID">Parcial</MenuItem>
                <MenuItem value="PAID">Pagada</MenuItem>
                <MenuItem value="CANCELLED">Anulada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Tipo"
                value={filters.invoice_type}
                onChange={(e) => handleFilterChange('invoice_type', e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
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
            <Grid item xs={12} display="flex" gap={1} justifyContent="flex-end">
              <Button variant="contained" onClick={handleSearch}>Aplicar Filtros</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>Exportar CSV</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Facturas</Typography>
            <Typography variant="body2" color="text.secondary">
              {invoices.length} resultado{invoices.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {invoices.length === 0 ? (
            <Typography>No hay facturas con los filtros seleccionados.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Número</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Remito</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Canal</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Pagado</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>#{invoice.id}</TableCell>
                      <TableCell>{invoice.number}</TableCell>
                      <TableCell>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell>{invoice.work_order_id ? `#${invoice.work_order_id}` : '-'}</TableCell>
                      <TableCell>{typeMap[invoice.invoice_type] || 'B'}</TableCell>
                      <TableCell>{invoice.channel}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={statusMap[invoice.status]?.label || invoice.status}
                          color={statusMap[invoice.status]?.color || 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">{formatCurrency(invoice.total, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.paid_amount, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(invoice.balance, false)}</TableCell>
                      <TableCell align="center">
                        <Button
                          color="error"
                          variant="outlined"
                          size="small"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDelete(invoice)}
                        >
                          Borrar
                        </Button>
                      </TableCell>
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

export default InvoiceList
