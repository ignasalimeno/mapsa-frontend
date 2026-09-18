import { useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import ExcelTable from '../components/ExcelTable'
import { salesService } from '../services/api'
import { formatCurrency } from '../utils/formatters'

const columns = [
  {
    id: 'item_code',
    label: 'Código',
    width: 110,
    mono: true,
  },
  {
    id: 'item_name',
    label: 'Producto',
    sortValue: (r) => (r.item_name || '').toLowerCase(),
  },
  {
    id: 'invoices_count',
    label: 'N° Facturas',
    align: 'right',
    width: 110,
  },
  {
    id: 'quantity',
    label: 'Cantidad',
    align: 'right',
    width: 100,
  },
  {
    id: 'neto',
    label: 'Neto',
    align: 'right',
    width: 120,
    mono: true,
    render: (row) => formatCurrency(row.neto),
  },
  {
    id: 'iva',
    label: 'IVA',
    align: 'right',
    width: 110,
    mono: true,
    render: (row) => formatCurrency(row.iva),
  },
  {
    id: 'total',
    label: 'Total',
    align: 'right',
    width: 130,
    mono: true,
    render: (row) => formatCurrency(row.total),
  },
]

function SalesProductsList() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [includeVoided, setIncludeVoided] = useState(false)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await salesService.productsSummary({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        include_voided: includeVoided ? 'true' : 'false',
      })
      setRows(res.data || [])
      setSearched(true)
    } catch (err) {
      console.error('Error cargando productos facturados:', err)
      setError('Error al consultar. Intente nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await salesService.exportProductsSummary({
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        include_voided: includeVoided ? 'true' : 'false',
      })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'equipos_vendidos.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Error exportando equipos vendidos:', err)
      setError('Error al exportar. Intente nuevamente.')
    }
  }

  return (
    <PageLayout
      title="Equipos Vendidos"
      subtitle="Cantidad y montos facturados por producto"
    >
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
        <Button
          startIcon={<SearchIcon />}
          variant="contained"
          onClick={load}
          disabled={loading}
        >
          Consultar
        </Button>
        <Button
          startIcon={<DownloadIcon />}
          variant="outlined"
          onClick={handleExport}
          disabled={loading}
        >
          Exportar CSV
        </Button>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {searched && !loading && rows.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Sin resultados para el período.</Typography>
        </Paper>
      )}

      {searched && rows.length > 0 && (
        <ExcelTable columns={columns} data={rows} defaultSort="total" defaultOrder="desc" />
      )}

      <LoadingOverlay open={loading} message="Consultando productos..." />
    </PageLayout>
  )
}

export default SalesProductsList