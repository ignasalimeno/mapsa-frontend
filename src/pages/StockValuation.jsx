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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { PageLayout } from '../components'
import { stockService } from '../services/api'
import { formatCurrency, formatNumber } from '../utils/formatters'

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
              <Typography variant="h5">{formatCurrency(data.totals.cost_valuation || 0, false)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="body2" color="text.secondary">Valorizado a venta</Typography>
              <Typography variant="h5">{formatCurrency(data.totals.sale_valuation || 0, false)}</Typography>
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
          ) : data.items.length === 0 ? (
            <Typography>No hay productos para valorizar.</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Stock</TableCell>
                    <TableCell align="right">Costo unitario</TableCell>
                    <TableCell align="right">Venta unitaria</TableCell>
                    <TableCell align="right">Valorizado costo</TableCell>
                    <TableCell align="right">Valorizado venta</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="right">{formatNumber(item.total_quantity, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.purchase_price, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.sale_price, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.cost_valuation, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.sale_valuation, false)}</TableCell>
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

export default StockValuation
