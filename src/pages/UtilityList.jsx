import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
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
import { LoadingOverlay, PageLayout } from '../components'
import { utilityService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel } from '../context'

function UtilityList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ totals: {}, items: [] })
  const [order, setOrder] = useState('desc')
  const [orderBy, setOrderBy] = useState('open_date')
  const { channel } = useChannel()
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    channel: 'ALL',
  })

  useEffect(() => {
    loadUtilities()
  }, [channel])

  const loadUtilities = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await utilityService.list({
        date_from: filters.date_from,
        date_to: filters.date_to,
        channel: filters.channel,
      })
      setData(response.data || { totals: {}, items: [] })
    } catch (err) {
      setError('Error al cargar utilidades')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const getSortableValue = (item, field) => {
    switch (field) {
      case 'number':
        return item.number || ''
      case 'plate':
        return item.plate || ''
      case 'open_date':
        return item.open_date || ''
      case 'customer_name':
        return item.customer_name || ''
      case 'sale_total':
        return Number(item.sale_total || 0)
      case 'cost_total':
        return Number(item.cost_total || 0)
      case 'utility_total':
        return Number(item.utility_total || 0)
      case 'margin_percentage':
        return Number(item.margin_percentage || 0)
      default:
        return item[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedItems = [...data.items].sort((left, right) => {
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
    { id: 'number', label: 'Remito' },
    { id: 'plate', label: 'Patente' },
    { id: 'open_date', label: 'Fecha' },
    { id: 'customer_name', label: 'Cliente' },
    { id: 'sale_total', label: 'Venta', align: 'right' },
    { id: 'cost_total', label: 'Costo', align: 'right' },
    { id: 'utility_total', label: 'Utilidad', align: 'right' },
    { id: 'margin_percentage', label: 'Margen', align: 'right' },
  ]

  return (
    <PageLayout title="Utilidades" subtitle="Costo, venta y utilidad por remito">
      <LoadingOverlay open={loading} message="Cargando utilidades..." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Desde"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Hasta"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
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
            <Grid item xs={12}>
              <Box display="flex" justifyContent="flex-end">
                <Button variant="contained" onClick={loadUtilities}>Aplicar filtros</Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Venta total</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.sale_total || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Costo total</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.cost_total || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Utilidad total</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.utility_total || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Margen</Typography>
              <Typography variant="h5">{Number(data.totals.margin_percentage || 0).toFixed(2)}%</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Detalle por remito</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.items.length} remito{data.items.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {data.items.length === 0 ? (
            <Typography>No hay remitos en el rango seleccionado.</Typography>
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
                  {sortedItems.map((item, index) => (
                    <TableRow
                      key={item.id}
                      sx={{
                        '&:hover': { backgroundColor: 'grey.50' },
                        borderBottom: index === sortedItems.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>{item.number || '-'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{item.plate || '-'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{formatDate(item.open_date)}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{item.customer_name}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(item.sale_total)}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(item.cost_total)}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(item.utility_total)}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{Number(item.margin_percentage || 0).toFixed(2)}%</TableCell>
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

export default UtilityList
