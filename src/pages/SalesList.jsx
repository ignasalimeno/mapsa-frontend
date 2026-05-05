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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material'
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
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

function SalesList() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState('desc')
  const [orderBy, setOrderBy] = useState('sale_date')
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

  const getSortableValue = (row, field) => {
    switch (field) {
      case 'sale_type':
        return row.sale_type || ''
      case 'number':
        return row.number || ''
      case 'sale_date':
        return row.sale_date || ''
      case 'customer_name':
        return row.customer_name || ''
      case 'channel':
        return row.channel || ''
      case 'status':
        return row.status || ''
      case 'total':
        return Number(row.total || 0)
      default:
        return row[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedRows = [...rows].sort((left, right) => {
    const leftValue = getSortableValue(left, orderBy)
    const rightValue = getSortableValue(right, orderBy)

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return order === 'asc' ? leftValue - rightValue : rightValue - leftValue
    }

    const comparison = String(leftValue).localeCompare(String(rightValue), 'es', {
      numeric: true,
      sensitivity: 'base',
    })

    return order === 'asc' ? comparison : -comparison
  })

  const sortableColumns = [
    { id: 'sale_type', label: 'Tipo' },
    { id: 'number', label: 'Número' },
    { id: 'sale_date', label: 'Fecha' },
    { id: 'customer_name', label: 'Cliente' },
    { id: 'channel', label: 'Canal' },
    { id: 'status', label: 'Estado' },
    { id: 'total', label: 'Total', align: 'right' },
  ]

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
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    {sortableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
                        sortDirection={orderBy === column.id ? order : false}
                        sx={{ fontWeight: 600, py: 2 }}
                      >
                        <TableSortLabel
                          active={orderBy === column.id}
                          direction={orderBy === column.id ? order : 'asc'}
                          onClick={() => handleRequestSort(column.id)}
                        >
                          {column.label}
                        </TableSortLabel>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedRows.map((row, index) => (
                    <TableRow
                      key={`${row.sale_type}-${row.sale_id}`}
                      sx={{
                        '&:hover': { backgroundColor: 'grey.50' },
                        borderBottom: index === sortedRows.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          size="small"
                          label={saleTypeMap[row.sale_type]?.label || row.sale_type}
                          color={saleTypeMap[row.sale_type]?.color || 'default'}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>{row.number || '-'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{formatDate(row.sale_date)}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{row.customer_name}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{row.channel}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          size="small"
                          label={statusMap[row.status]?.label || row.status}
                          color={statusMap[row.status]?.color || 'default'}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(row.total)}</TableCell>
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
