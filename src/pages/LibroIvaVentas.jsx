import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import ExcelTable from '../components/ExcelTable'
import { reportService } from '../services/api'
import { formatCurrency, formatDate, firstDayOfMonthIso, todayIso } from '../utils/formatters'
import { useChannel } from '../context'

const columns = [
  {
    id: 'date',
    label: 'Fecha',
    width: 110,
    render: (r) => formatDate(r.date),
  },
  {
    id: 'tipo_label',
    label: 'Tipo',
    width: 160,
    sortValue: (r) => (r.tipo_label || '').toLowerCase(),
  },
  {
    id: 'punto_venta',
    label: 'Pto. Venta',
    width: 100,
    mono: true,
  },
  {
    id: 'numero',
    label: 'Número',
    width: 120,
    mono: true,
    render: (r) => r.numero || '-',
  },
  {
    id: 'cliente',
    label: 'Cliente',
    sortValue: (r) => (r.cliente || '').toLowerCase(),
  },
  {
    id: 'doc',
    label: 'CUIT / Doc.',
    width: 150,
    sortValue: (r) => r.doc_numero || '',
    render: (r) => r.doc_numero || '-',
  },
  {
    id: 'neto',
    label: 'Neto',
    align: 'right',
    width: 140,
    mono: true,
    render: (r) => formatCurrency(r.neto),
  },
  {
    id: 'iva',
    label: 'IVA',
    align: 'right',
    width: 130,
    mono: true,
    render: (r) => formatCurrency(r.iva),
  },
  {
    id: 'total',
    label: 'Total',
    align: 'right',
    width: 140,
    mono: true,
    render: (r) => formatCurrency(r.total),
  },
  {
    id: 'canal',
    label: 'Canal',
    width: 90,
  },
]

function LibroIvaVentas() {
  const { channel } = useChannel()
  const [dateFrom, setDateFrom] = useState(firstDayOfMonthIso)
  const [dateTo, setDateTo] = useState(todayIso)
  const [rows, setRows] = useState([])
  const [totals, setTotals] = useState({ neto: 0, iva: 0, total: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    load()
  }, [channel])

  const buildParams = () => ({
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
  })

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await reportService.listLibroIva(buildParams())
      setRows(res.data?.rows || [])
      setTotals(res.data?.totals || { neto: 0, iva: 0, total: 0 })
      setSearched(true)
    } catch (err) {
      console.error('Error cargando Libro IVA Ventas:', err)
      setError('Error al consultar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await reportService.exportLibroIva(buildParams())
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'libro_iva_ventas.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando Libro IVA Ventas:', err)
      setError('Error al exportar. Intente nuevamente.')
    }
  }

  return (
    <PageLayout
      title="Libro IVA Ventas"
      subtitle="Comprobantes de venta con formato de columnas AFIP"
    >
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">Comprobantes</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{rows.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">Neto Gravado</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totals.neto)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">IVA</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{formatCurrency(totals.iva)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">Total</Typography>
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
        <Button startIcon={<SearchIcon />} variant="contained" onClick={load} disabled={loading}>
          Consultar
        </Button>
        <Button startIcon={<DownloadIcon />} variant="outlined" onClick={handleExport} disabled={loading}>
          Exportar Excel (CSV)
        </Button>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {searched && !loading && rows.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Sin comprobantes para el período.</Typography>
        </Paper>
      ) : (
        <ExcelTable columns={columns} data={rows} defaultSort="date" defaultOrder="desc" />
      )}

      <LoadingOverlay open={loading} message="Consultando comprobantes..." />
    </PageLayout>
  )
}

export default LibroIvaVentas
