import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import ExcelTable from '../components/ExcelTable'
import { salesService } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useChannel } from '../context'

const columns = [
  {
    id: 'jurisdiction',
    label: 'Jurisdicción',
    sortValue: (r) => (r.jurisdiction || '').toLowerCase(),
  },
  {
    id: 'neto',
    label: 'Neto (sin IVA)',
    align: 'right',
    width: 160,
    mono: true,
    render: (r) => formatCurrency(r.neto),
  },
  {
    id: 'iva',
    label: 'IVA',
    align: 'right',
    width: 150,
    mono: true,
    render: (r) => formatCurrency(r.iva),
  },
  {
    id: 'total',
    label: 'Total (con IVA)',
    align: 'right',
    width: 170,
    mono: true,
    render: (r) => formatCurrency(r.total),
  },
]

function SalesByJurisdiction() {
  const { channel } = useChannel()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includeVoided, setIncludeVoided] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    load()
  }, [channel])

  const buildParams = () => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    include_voided: includeVoided ? 'true' : 'false',
  })

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await salesService.byJurisdiction(buildParams())
      setRows(res.data || [])
      setSearched(true)
    } catch (err) {
      console.error('Error cargando ventas por jurisdicción:', err)
      setError('Error al consultar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await salesService.exportByJurisdiction(buildParams())
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'ventas_por_jurisdiccion.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando ventas por jurisdicción:', err)
      setError('Error al exportar. Intente nuevamente.')
    }
  }

  const totals = rows.reduce(
    (acc, r) => ({
      neto: acc.neto + Number(r.neto || 0),
      iva: acc.iva + Number(r.iva || 0),
      total: acc.total + Number(r.total || 0),
    }),
    { neto: 0, iva: 0, total: 0 },
  )

  return (
    <PageLayout
      title="Ventas por Jurisdicción"
      subtitle="Facturación agrupada por jurisdicción, con y sin IVA"
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">Neto (sin IVA)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totals.neto)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">IVA</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totals.iva)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">Total (con IVA)</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }} color="success.main">{formatCurrency(totals.total)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          type="date"
          size="small"
          label="Desde"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          size="small"
          label="Hasta"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={includeVoided}
              onChange={(e) => setIncludeVoided(e.target.checked)}
            />
          }
          label="Incluir anuladas"
        />
        <Button startIcon={<SearchIcon />} variant="contained" onClick={load} disabled={loading}>
          Consultar
        </Button>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport} disabled={loading}>
          Exportar CSV
        </Button>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {searched && !loading && rows.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Sin ventas para el período.</Typography>
        </Paper>
      ) : (
        <ExcelTable columns={columns} data={rows} defaultSort="total" defaultOrder="desc" />
      )}

      <LoadingOverlay open={loading} message="Consultando ventas..." />
    </PageLayout>
  )
}

export default SalesByJurisdiction
