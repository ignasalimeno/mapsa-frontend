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
import { salesService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel } from '../context'

const statusMap = {
  NEW: { label: 'Pendiente', color: 'warning' },
  PARTIAL_PAID: { label: 'Parcial', color: 'info' },
  PAID: { label: 'Pagada', color: 'success' },
}

const saleTypeMap = {
  FACTURA: { label: 'Factura', color: 'primary' },
  NOTA_CREDITO: { label: 'Nota Crédito', color: 'success' },
  NOTA_DEBITO: { label: 'Nota Débito', color: 'warning' },
}

const saleTypeFilterLabels = {
  FACTURA: 'Factura',
  NOTA_CREDITO: 'Nota Crédito',
  NOTA_DEBITO: 'Nota Débito',
}

const channelFilterLabels = {
  ALL: 'Consolidado',
  MAPSA: 'MAPSA',
  VIGIA: 'VIGIA',
}

const columns = [
  {
    id: 'sale_type',
    label: 'Tipo',
    width: 130,
    render: (row) => (
      <Chip
        size="small"
        label={saleTypeMap[row.sale_type]?.label || row.sale_type}
        color={saleTypeMap[row.sale_type]?.color || 'default'}
      />
    ),
  },
  { id: 'number', label: 'Número', width: 140, mono: true },
  {
    id: 'sale_date',
    label: 'Fecha',
    width: 110,
    render: (row) => formatDate(row.sale_date),
  },
  { id: 'customer_name', label: 'Cliente' },
  { id: 'channel', label: 'Canal', width: 90 },
  {
    id: 'status',
    label: 'Estado',
    width: 110,
    render: (row) => (
      <Chip
        size="small"
        label={statusMap[row.status]?.label || row.status}
        color={statusMap[row.status]?.color || 'default'}
      />
    ),
  },
  {
    id: 'total',
    label: 'Total',
    align: 'right',
    width: 120,
    mono: true,
    render: (row) => formatCurrency(row.total),
  },
]

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

  const renderSelectValue = (value, optionsMap, emptyLabel) => {
    if (!value) {
      return <Box component="span" sx={{ color: 'text.secondary' }}>{emptyLabel}</Box>
    }

    return optionsMap[value] || value
  }

  return (
    <PageLayout title="Ventas" subtitle="Listado de facturas y notas">
      <LoadingOverlay open={loading} message="Cargando ventas..." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Buscar por ID AFIP, cliente o ID..."
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
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, saleTypeFilterLabels, 'Todos los tipos'),
                }}
              >
                <MenuItem value="">Todos los tipos</MenuItem>
                <MenuItem value="FACTURA">Factura</MenuItem>
                <MenuItem value="NOTA_CREDITO">Nota Crédito</MenuItem>
                <MenuItem value="NOTA_DEBITO">Nota Débito</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Canal"
                value={filters.channel}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, channelFilterLabels, 'Todos los canales'),
                }}
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
            <Grid item xs={12}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button variant="contained" onClick={loadSales}>Aplicar filtros</Button>
                <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>Exportar CSV</Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ExcelTable
            columns={columns}
            data={rows}
            defaultSort="sale_date"
            defaultOrder="desc"
          />
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default SalesList
