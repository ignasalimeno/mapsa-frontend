import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControlLabel,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { Search as SearchIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import ExcelTable from '../components/ExcelTable'
import { receiptService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel } from '../context'

const methodLabels = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHEQUE: 'Cheque',
  ECHEQ: 'E-Cheq',
  CARD_CREDIT: 'Tarjeta Crédito',
  CARD_DEBIT: 'Tarjeta Débito',
  RETENTION: 'Retención',
  MIXTO: 'Mixto',
  OTRO: 'Otro',
}

const columns = [
  { id: 'receipt_number', label: 'N° Recibo', width: 120, mono: true, render: (r) => r.receipt_number || `#${r.id_receipt}` },
  { id: 'receipt_date', label: 'Fecha', width: 110, render: (r) => formatDate(r.receipt_date) },
  { id: 'customer_name', label: 'Cliente' },
  {
    id: 'type',
    label: 'Formas',
    width: 200,
    sortable: false,
    render: (r) => (
      <Box sx={{ display: 'inline-flex', gap: 0.5, flexWrap: 'wrap' }}>
        {(r.methods || []).map((m, i) => (
          <Chip key={`${m}-${i}`} size="small" label={methodLabels[m] || m} variant="outlined" />
        ))}
      </Box>
    ),
  },
  { id: 'channel', label: 'Canal', width: 90 },
  {
    id: 'status',
    label: 'Estado',
    width: 110,
    render: (r) => (
      <Chip
        size="small"
        label={r.status === 'CANCELLED' ? 'Anulado' : 'Activo'}
        color={r.status === 'CANCELLED' ? 'error' : 'success'}
      />
    ),
  },
  {
    id: 'total_amount',
    label: 'Total',
    align: 'right',
    width: 130,
    mono: true,
    render: (r) => formatCurrency(r.total_amount),
  },
]

function ReceiptList() {
  const navigate = useNavigate()
  const { channel } = useChannel()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    search: '',
    include_voided: false,
  })

  useEffect(() => {
    load()
  }, [channel])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await receiptService.list({
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        search: filters.search || undefined,
        include_voided: filters.include_voided ? 'true' : 'false',
      })
      setRows(res.data || [])
    } catch (err) {
      console.error('Error cargando recibos:', err)
      setError('Error al cargar recibos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title="Recibos" subtitle="Recibos de pago emitidos">
      <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          type="date"
          size="small"
          label="Desde"
          value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          size="small"
          label="Hasta"
          value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          size="small"
          label="Buscar (N° recibo o cliente)"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{ minWidth: 240 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.include_voided}
              onChange={(e) => setFilters({ ...filters, include_voided: e.target.checked })}
            />
          }
          label="Incluir anulados"
        />
        <Button startIcon={<SearchIcon />} variant="contained" onClick={load} disabled={loading}>
          Consultar
        </Button>
        <Button startIcon={<RefreshIcon />} variant="outlined" onClick={load} disabled={loading}>
          Actualizar
        </Button>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && rows.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay recibos para el período.</Typography>
        </Paper>
      ) : (
        <ExcelTable
          columns={columns}
          data={rows}
          defaultSort="receipt_date"
          defaultOrder="desc"
          onRowClick={(row) => navigate(`/receipts/${row.id_receipt}`)}
        />
      )}

      <LoadingOverlay open={loading} message="Cargando recibos..." />
    </PageLayout>
  )
}

export default ReceiptList
