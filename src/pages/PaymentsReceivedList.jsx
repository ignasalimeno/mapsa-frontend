import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import ExcelTable from '../components/ExcelTable'
import { formatCurrency, formatDate } from '../utils/formatters'
import { paymentService } from '../services/api'
import { useChannel } from '../context'

const paymentTypeOptions = [
  { value: '', label: 'Todos los tipos' },
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ECHEQ', label: 'E-Cheq' },
  { value: 'CARD_CREDIT', label: 'Tarjeta de Crédito' },
  { value: 'CARD_DEBIT', label: 'Tarjeta de Débito' },
  { value: 'RETENTION', label: 'Retención' },
]

const paymentTypeLabel = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHEQUE: 'Cheque',
  ECHEQ: 'E-Cheq',
  CARD_CREDIT: 'Tarjeta de Crédito',
  CARD_DEBIT: 'Tarjeta de Débito',
  RETENTION: 'Retención',
  OTRO: 'Otro',
}

const columns = [
  { id: 'type', label: 'Tipo', width: 100, render: (row) => paymentTypeLabel[row.type] || row.type },
  { id: 'retention_detail', label: 'Detalle Retención', width: 180, render: (row) => row.retention_detail || '-' },
  { id: 'date', label: 'Fecha', width: 110, render: (row) => formatDate(row.date) },
  { id: 'customer_name', label: 'Cliente', width: 200 },
  { id: 'province', label: 'Provincia', width: 130, render: (row) => row.province || '-' },
  { id: 'amount', label: 'Monto', width: 130, align: 'right', render: (row) => formatCurrency(row.amount || 0) },
]

function PaymentsReceivedList() {
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { channel } = useChannel()
  const [filters, setFilters] = useState({
    search: '',
    province: '',
    payment_type: '',
    date_from: '',
    date_to: '',
  })

  const provinceOptions = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut',
    'Cordoba', 'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy',
    'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquen',
    'Rio Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
    'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucuman',
  ]

  useEffect(() => {
    loadPayments()
  }, [channel])

  const loadPayments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await paymentService.listReceived({ ...filters, channel })
      setRows(response.data?.items || [])
      setSummary(response.data?.summary_by_type || [])
    } catch (err) {
      console.error(err)
      setError('Error al cargar pagos recibidos')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const renderSelectValue = (value, emptyLabel) => {
    if (!value) {
      return <Box component="span" sx={{ color: 'text.secondary' }}>{emptyLabel}</Box>
    }
    return value
  }

  const handleExport = async () => {
    try {
      const response = await paymentService.exportReceivedCsv({ ...filters, channel })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'pagos_recibidos.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      setError('Error al exportar pagos')
    }
  }

  return (
    <PageLayout title="Pagos Recibidos" subtitle="Listado por tipo con cliente y provincia">
      <LoadingOverlay open={loading} message="Cargando pagos..." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por cliente, provincia o descripción"
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
                label="Provincia"
                fullWidth
                value={filters.province}
                onChange={(e) => handleFilterChange('province', e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, 'Todas las provincias'),
                }}
              >
                <MenuItem value="">Todas las provincias</MenuItem>
                {provinceOptions.map((province) => (
                  <MenuItem key={province} value={province}>{province}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                label="Tipo"
                fullWidth
                value={filters.payment_type}
                onChange={(e) => handleFilterChange('payment_type', e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, 'Todos los tipos'),
                }}
              >
                {paymentTypeOptions.map((opt) => (
                  <MenuItem key={opt.value || 'all'} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={1.25}>
              <TextField
                type="date"
                label="Desde"
                fullWidth
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={1.25}>
              <TextField
                type="date"
                label="Hasta"
                fullWidth
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button variant="contained" onClick={loadPayments}>Aplicar filtros</Button>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Exportar CSV</Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Totales por Tipo</Typography>
          {summary.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Sin datos para los filtros seleccionados</Typography>
          ) : (
            <Box display="flex" gap={1} flexWrap="wrap">
              {summary.map((s) => (
                <Chip
                  key={s.type}
                  color="primary"
                  variant="outlined"
                  label={`${paymentTypeLabel[s.type] || s.type}: ${formatCurrency(s.total_amount || 0)}`}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Detalle de Pagos</Typography>
          <ExcelTable
            columns={columns}
            data={rows}
            defaultSort="date"
            defaultOrder="desc"
            emptyMessage="No hay pagos con los filtros seleccionados."
            footer={`${rows.length} resultado${rows.length !== 1 ? 's' : ''}`}
          />
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default PaymentsReceivedList
