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
import { Search as SearchIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import ExcelTable from '../components/ExcelTable'
import { accountService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel } from '../context'

const buildColumns = (isDebit) => [
  { id: 'number', label: 'Número', width: 110, mono: true, render: (r) => r.number || '-' },
  { id: 'date', label: 'Fecha', width: 110, render: (r) => formatDate(r.date) },
  { id: 'customer_name', label: 'Cliente' },
  { id: 'description', label: 'Descripción', sortValue: (r) => (r.description || '').toLowerCase() },
  { id: 'neto', label: 'Neto', align: 'right', width: 120, mono: true, render: (r) => r.neto != null ? formatCurrency(r.neto) : '-' },
  { id: 'iva', label: 'IVA', align: 'right', width: 110, mono: true, render: (r) => r.iva != null ? formatCurrency(r.iva) : '-' },
  {
    id: 'amount',
    label: 'Total',
    align: 'right',
    width: 130,
    mono: true,
    render: (r) => (
      <Typography sx={{ fontSize: 'inherit', fontWeight: 600, color: isDebit ? 'error.main' : 'success.main' }}>
        {formatCurrency(r.amount)}
      </Typography>
    ),
  },
  {
    id: 'status',
    label: 'Estado',
    width: 100,
    render: (r) => (
      <Chip size="small" label={r.voided ? 'Anulada' : 'Activa'} color={r.voided ? 'error' : 'success'} />
    ),
  },
]

function NoteList({ noteType = 'DEBIT_NOTE' }) {
  const isDebit = noteType === 'DEBIT_NOTE'
  const title = isDebit ? 'Notas de Débito' : 'Notas de Crédito'
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
  }, [channel, noteType])

  const load = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await accountService.listNotes({
        type: noteType,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        search: filters.search || undefined,
        include_voided: filters.include_voided ? 'true' : 'false',
      })
      setRows(res.data || [])
    } catch (err) {
      console.error('Error cargando notas:', err)
      setError('Error al cargar notas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout title={title} subtitle="Notas registradas en cuentas corrientes">
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
          label="Buscar (número, cliente o descripción)"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          sx={{ minWidth: 280 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={filters.include_voided}
              onChange={(e) => setFilters({ ...filters, include_voided: e.target.checked })}
            />
          }
          label="Incluir anuladas"
        />
        <Button startIcon={<SearchIcon />} variant="contained" onClick={load} disabled={loading}>
          Consultar
        </Button>
      </Paper>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {!loading && rows.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No hay notas para el período.</Typography>
        </Paper>
      ) : (
        <ExcelTable
          columns={buildColumns(isDebit)}
          data={rows}
          defaultSort="date"
          defaultOrder="desc"
          onRowClick={(row) => navigate(`/customers/${row.id_customer}`)}
        />
      )}

      <LoadingOverlay open={loading} message="Cargando notas..." />
    </PageLayout>
  )
}

export default NoteList
