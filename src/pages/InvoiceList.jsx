import { useEffect, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material'
import { Download as DownloadIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material'
import { invoiceService } from '../services/api'
import { InvoicePaymentComposer, LoadingOverlay, PageLayout, StyledDialog, TableActionIconButton } from '../components'
import ExcelTable from '../components/ExcelTable'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel, useConfirm, useNotify } from '../context'

const statusMap = {
  NEW: { label: 'Pendiente', color: 'warning' },
  PARTIAL_PAID: { label: 'Parcial', color: 'info' },
  PAID: { label: 'Pagada', color: 'success' },
  ACTIVE: { label: 'Activa', color: 'success' },
  CANCELLED: { label: 'Anulada', color: 'error' },
}

const typeMap = {
  A: 'A',
  B: 'B',
}

const documentTypeMap = {
  INVOICE: { label: 'Factura', color: 'primary' },
  CREDIT_NOTE: { label: 'Nota Crédito', color: 'success' },
  DEBIT_NOTE: { label: 'Nota Débito', color: 'warning' },
}

const documentTypeFilterLabels = {
  ALL: 'Todos los comprobantes',
  INVOICE: 'Facturas',
  CREDIT_NOTE: 'Notas de Crédito',
  DEBIT_NOTE: 'Notas de Débito',
}

const invoiceStatusFilterLabels = {
  NEW: 'Pendiente',
  PARTIAL_PAID: 'Parcial',
  PAID: 'Pagada',
  CANCELLED: 'Anulada',
}

const invoiceTypeFilterLabels = {
  A: 'A',
  B: 'B',
}

const columns = [
  {
    id: 'number',
    label: 'N° de Comprobante',
    width: 140,
    mono: true,
    sortValue: (row) => row.number || '',
    render: (row) => row.number || '-',
  },
  {
    id: 'date',
    label: 'Fecha',
    width: 110,
    render: (row) => formatDate(row.date),
  },
  {
    id: 'customer_name',
    label: 'Cliente',
    render: (row) =>
      row.customer_number != null
        ? `${row.customer_name} (${row.customer_number})`
        : row.customer_name,
  },
  {
    id: 'remitos',
    label: 'Remito(s)',
    width: 140,
    render: (row) => row.remitos || '-',
  },
  {
    id: 'document_type',
    label: 'Tipo',
    width: 120,
    render: (row) => {
      const label = row.document_type === 'INVOICE'
        ? `Factura ${typeMap[row.invoice_type] || 'B'}`
        : documentTypeMap[row.document_type]?.label
      return (
        <Chip
          size="small"
          label={label || row.document_type}
          color={documentTypeMap[row.document_type]?.color || 'default'}
          variant={row.document_type === 'INVOICE' ? 'outlined' : 'filled'}
        />
      )
    },
  },
  {
    id: 'channel',
    label: 'Canal',
    width: 80,
  },
  {
    id: 'status',
    label: 'Estado',
    width: 100,
    render: (row) => (
      <Chip
        size="small"
        label={statusMap[row.status]?.label || row.status}
        color={statusMap[row.status]?.color || 'default'}
      />
    ),
  },
  {
    id: 'total',
    label: 'Total',
    align: 'right',
    width: 110,
    mono: true,
    sortValue: (row) => Number(row.total || 0),
    render: (row) => formatCurrency(row.total),
  },
  {
    id: 'paid_amount',
    label: 'Pagado',
    align: 'right',
    width: 110,
    mono: true,
    sortValue: (row) => Number(row.paid_amount || 0),
    render: (row) => (row.paid_amount == null ? '-' : formatCurrency(row.paid_amount)),
  },
  {
    id: 'balance',
    label: 'Saldo',
    align: 'right',
    width: 110,
    mono: true,
    sortValue: (row) => Number(row.balance || 0),
    render: (row) => (row.balance == null ? '-' : formatCurrency(row.balance)),
  },
]

function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { channel } = useChannel()
  const confirm = useConfirm()
  const { error: notifyError, success: notifySuccess } = useNotify()
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editInvoice, setEditInvoice] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    document_type: 'ALL',
    status: '',
    invoice_type: '',
    date_from: '',
    date_to: '',
  })

  useEffect(() => {
    loadInvoices()
  }, [channel])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await invoiceService.listDocuments({ ...filters, channel })
      setInvoices(response.data || [])
    } catch (err) {
      setError('Error al cargar comprobantes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }))
  }

  const handleSearch = () => {
    loadInvoices()
  }

  const handleExportCsv = async () => {
    try {
      const response = await invoiceService.exportCsv({ ...filters, channel })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'facturas.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar CSV de facturas')
      console.error(err)
    }
  }

  const handleDelete = async (invoice) => {
    const confirmed = await confirm({
      title: 'Anular factura',
      message: `Vas a anular la factura ${invoice.number || '-'}. Sus pagos quedarán desasignados y los remitos volverán a estar abiertos.`,
      confirmLabel: 'Anular',
      confirmColor: 'error',
    })
    if (!confirmed) return

    try {
      await invoiceService.delete(invoice.id)
      await loadInvoices()
      notifySuccess('Factura anulada correctamente')
    } catch (err) {
      setError('Error al anular factura')
      notifyError('No se pudo anular la factura')
      console.error(err)
    }
  }

  const handleOpenPayments = (invoice) => {
    setSelectedInvoice(invoice)
    setPaymentsDialogOpen(true)
  }

  const handleClosePayments = () => {
    setPaymentsDialogOpen(false)
    setSelectedInvoice(null)
    loadInvoices()
  }

  const handleOpenEdit = (invoice) => {
    setEditInvoice(invoice)
    setEditDate(invoice.date || new Date().toISOString().split('T')[0])
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    try {
      const resp = await invoiceService.update(editInvoice.id, { invoice_date: editDate })
      if (resp.data.error) throw new Error(resp.data.error)
      notifySuccess('Fecha actualizada correctamente')
      setEditDialogOpen(false)
      setEditInvoice(null)
      loadInvoices()
    } catch (err) {
      notifyError('Error al actualizar fecha')
      console.error(err)
    }
  }

  const handleCloseEdit = () => {
    setEditDialogOpen(false)
    setEditInvoice(null)
  }

  const renderSelectValue = (value, optionsMap, emptyLabel) => {
    if (!value) {
      return <Box component="span" sx={{ color: 'text.secondary' }}>{emptyLabel}</Box>
    }

    return optionsMap[value] || value
  }

  const renderActions = (invoice) => {
    if (invoice.document_type !== 'INVOICE') return null
    return (
      <Box display="flex" gap={1} justifyContent="center">
        <TableActionIconButton
          kind="edit"
          onClick={() => handleOpenEdit(invoice)}
          ariaLabel={`Editar factura ${invoice.number || invoice.id}`}
        />
        <Button variant="outlined" size="small" onClick={() => handleOpenPayments(invoice)}>
          Pagos
        </Button>
        {invoice.status !== 'CANCELLED' && (
          <TableActionIconButton
            kind="delete"
            onClick={() => handleDelete(invoice)}
            ariaLabel={`Anular factura ${invoice.number || invoice.id}`}
          />
        )}
      </Box>
    )
  }

  return (
    <PageLayout title="Facturas" subtitle="Facturas, notas de crédito y débito con filtros y exportación CSV">
      <LoadingOverlay open={loading} message="Cargando facturas..." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                placeholder="Buscar por número, cliente, ID..."
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
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label="Comprobante"
                value={filters.document_type}
                onChange={(e) => handleFilterChange('document_type', e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, documentTypeFilterLabels, 'Todos los comprobantes'),
                }}
              >
                <MenuItem value="ALL">Todos los comprobantes</MenuItem>
                <MenuItem value="INVOICE">Facturas</MenuItem>
                <MenuItem value="CREDIT_NOTE">Notas de Crédito</MenuItem>
                <MenuItem value="DEBIT_NOTE">Notas de Débito</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Estado"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, invoiceStatusFilterLabels, 'Todos los estados'),
                }}
              >
                <MenuItem value="">Todos los estados</MenuItem>
                <MenuItem value="NEW">Pendiente</MenuItem>
                <MenuItem value="PARTIAL_PAID">Parcial</MenuItem>
                <MenuItem value="PAID">Pagada</MenuItem>
                <MenuItem value="CANCELLED">Anulada</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                select
                fullWidth
                label="Letra"
                value={filters.invoice_type}
                onChange={(e) => handleFilterChange('invoice_type', e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, invoiceTypeFilterLabels, 'Todos los tipos'),
                }}
              >
                <MenuItem value="">Todos los tipos</MenuItem>
                <MenuItem value="A">A</MenuItem>
                <MenuItem value="B">B</MenuItem>
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
            <Grid item xs={12} display="flex" gap={1} justifyContent="flex-end">
              <Button variant="contained" onClick={handleSearch}>Aplicar Filtros</Button>
              <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExportCsv}>Exportar CSV</Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Comprobantes</Typography>
          </Box>
          <ExcelTable
            columns={columns}
            data={invoices}
            defaultSort="date"
            defaultOrder="desc"
            actions={renderActions}
          />
        </CardContent>
      </Card>

      <Dialog
        open={paymentsDialogOpen}
        onClose={handleClosePayments}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Formas de Pago - Factura {selectedInvoice?.number || selectedInvoice?.id || '-'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, pb: 2 }}>
          {selectedInvoice && (
            <InvoicePaymentComposer
              invoiceId={selectedInvoice.id}
              invoiceTotal={Number(selectedInvoice.total || 0)}
              onPaymentUpdate={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>

      <StyledDialog
        open={editDialogOpen}
        onClose={handleCloseEdit}
        maxWidth="xs"
        title="Editar Fecha"
        subtitle={editInvoice ? `Factura ${editInvoice.number || '-'}` : ''}
        actions={(
          <>
            <Button onClick={handleCloseEdit} variant="outlined">Cancelar</Button>
            <Button variant="contained" onClick={handleSaveEdit}>Guardar</Button>
          </>
        )}
      >
        <TextField
          label="Fecha de Factura"
          type="date"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </StyledDialog>
    </PageLayout>
  )
}

export default InvoiceList
