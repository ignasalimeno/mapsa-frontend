import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { PageLayout } from '../components'
import { stockService } from '../services/api'
import { formatCurrency, formatNumber } from '../utils/formatters'
import ExcelTable from '../components/ExcelTable'

const columns = [
  { id: 'name', label: 'Producto', sortable: true },
  { id: 'total_quantity', label: 'Stock', align: 'right', sortable: true, render: (row) => formatNumber(row.total_quantity, false) },
  { id: 'purchase_price', label: 'Costo unitario', align: 'right', sortable: true, render: (row) => formatCurrency(row.purchase_price) },
  { id: 'sale_price', label: 'Venta unitaria', align: 'right', sortable: true, render: (row) => formatCurrency(row.sale_price) },
  { id: 'cost_valuation', label: 'Valorizado costo', align: 'right', sortable: true, render: (row) => formatCurrency(row.cost_valuation) },
  { id: 'sale_valuation', label: 'Valorizado venta', align: 'right', sortable: true, render: (row) => formatCurrency(row.sale_valuation) },
]

function StockValuation() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({ totals: {}, items: [] })
  const [channel, setChannel] = useState('ALL')

  useEffect(() => {
    loadValuation()
  }, [channel])

  const loadValuation = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await stockService.getValuation({ channel })
      setData(response.data || { totals: {}, items: [] })
    } catch (err) {
      setError('Error al cargar stock valorizado')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title="Stock Valorizado" subtitle="Valorización de stock a costo y a venta">
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Canal"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
              >
                <MenuItem value="ALL">Consolidado</MenuItem>
                <MenuItem value="MAPSA">MAPSA</MenuItem>
                <MenuItem value="VIGIA">VIGIA</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={9}>
              <Alert severity="info">
                El stock físico sigue siendo compartido. El filtro de canal se muestra por consistencia operativa y el consolidado representa el inventario total.
              </Alert>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Cantidad total</Typography>
              <Typography variant="h5">{formatNumber(data.totals.total_quantity || 0, false)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Valorizado a costo</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.cost_valuation || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Valorizado a venta</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.sale_valuation || 0)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Detalle por producto</Typography>
            <Typography variant="body2" color="text.secondary">
              {data.items.length} producto{data.items.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
          ) : (
            <ExcelTable columns={columns} data={data.items} defaultSort="name" emptyMessage="No hay productos para valorizar." />
          )}
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default StockValuation
