import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Typography,
} from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import ExcelTable from '../components/ExcelTable'
import { utilityService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel } from '../context'

function UtilityList() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ totals: {}, items: [] })
  const { channel } = useChannel()
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
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
        channel,
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

  const handleExportCsv = async () => {
    try {
      const response = await utilityService.exportCsv({
        date_from: filters.date_from,
        date_to: filters.date_to,
        channel,
      })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'utilidades.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar CSV de utilidades')
      console.error(err)
    }
  }

  const columns = [
    { id: 'number', label: 'Remito' },
    { id: 'plate', label: 'Patente', mono: true },
    { id: 'open_date', label: 'Fecha', render: (row) => formatDate(row.open_date) },
    { id: 'customer_name', label: 'Cliente' },
    { id: 'sale_total', label: 'Venta s/IVA', align: 'right', mono: true, render: (row) => formatCurrency(row.sale_total) },
    { id: 'iva_amount', label: 'IVA', align: 'right', mono: true, render: (row) => formatCurrency(row.iva_amount) },
    { id: 'sale_total_with_iva', label: 'Venta c/IVA', align: 'right', mono: true, render: (row) => formatCurrency(row.sale_total_with_iva) },
    { id: 'cost_total', label: 'Costo', align: 'right', mono: true, render: (row) => formatCurrency(row.cost_total) },
    { id: 'utility_total', label: 'Utilidad', align: 'right', mono: true, render: (row) => formatCurrency(row.utility_total) },
    { id: 'margin_percentage', label: 'Margen', align: 'right', mono: true, render: (row) => `${Number(row.margin_percentage || 0).toFixed(2)}%` },
  ]

  return (
    <PageLayout title="Utilidades" subtitle="Costo, venta y utilidad por remito facturado">
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
            <Grid item xs={12} display="flex" gap={1} justifyContent="flex-end">
              <Button variant="contained" onClick={loadUtilities}>Aplicar filtros</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>Exportar CSV</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Venta s/IVA</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.sale_total || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">IVA</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.iva_amount || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Venta c/IVA</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.sale_total_with_iva || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Costo total</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.cost_total || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Utilidad total</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.utility_total || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={2}>
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

          <ExcelTable
            columns={columns}
            data={data.items}
            defaultSort="open_date"
            defaultOrder="desc"
          />
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default UtilityList
