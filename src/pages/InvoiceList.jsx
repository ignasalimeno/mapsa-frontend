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
import { Download as DownloadIcon, Search as SearchIcon } from '@mui/icons-material'
import { invoiceService } from '../services/api'
import { InvoicePaymentComposer, LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel, useConfirm, useNotify } from '../context'

const statusMap = {
  NEW: { label: 'Pendiente', color: 'warning' },
  PARTIAL_PAID: { label: 'Parcial', color: 'info' },
  PAID: { label: 'Pagada', color: 'success' },
  CANCELLED: { label: 'Anulada', color: 'error' },
}

const typeMap = {
  A: 'A',
  B: 'B',
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

const channelFilterLabels = {
  ALL: 'Consolidado',
  MAPSA: 'MAPSA',
  VIGIA: 'VIGIA',
}

function InvoiceList() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState('desc')
  const [orderBy, setOrderBy] = useState('invoice_date')
  const { channel } = useChannel()
  const confirm = useConfirm()
  const { error: notifyError, success: notifySuccess } = useNotify()
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    invoice_type: '',
    date_from: '',
    date_to: '',
    channel: 'ALL',
  })

  useEffect(() => {
    loadInvoices()
  }, [channel])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await invoiceService.list(filters)
      setInvoices(response.data || [])
    } catch (err) {
      setError('Error al cargar facturas')
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
      const response = await invoiceService.exportCsv(filters)
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
      title: 'Eliminar factura',
      message: `Vas a eliminar la factura ${invoice.id_afip || invoice.number || '-'}. Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      confirmColor: 'error',
    })
    if (!confirmed) return

    try {
      await invoiceService.delete(invoice.id)
      await loadInvoices()
      notifySuccess('Factura eliminada correctamente')
    } catch (err) {
      setError('Error al eliminar factura')
      notifyError('No se pudo eliminar la factura')
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

  const getSortableValue = (invoice, field) => {
    switch (field) {
      case 'id_afip':
        return invoice.id_afip || invoice.number || ''
      case 'invoice_date':
        return invoice.invoice_date || ''
      case 'customer_name':
        return invoice.customer_name || ''
      case 'work_order_number':
        return invoice.work_order_number || ''
      case 'invoice_type':
        return invoice.invoice_type || ''
      case 'channel':
        return invoice.channel || ''
      case 'status':
        return invoice.status || ''
      case 'total':
        return Number(invoice.total || 0)
      case 'paid_amount':
        return Number(invoice.paid_amount || 0)
      case 'balance':
        return Number(invoice.balance || 0)
      default:
        return invoice[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedInvoices = [...invoices].sort((left, right) => {
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
    { id: 'id_afip', label: 'N° de Factura' },
    { id: 'invoice_date', label: 'Fecha' },
    { id: 'customer_name', label: 'Cliente' },
    { id: 'work_order_number', label: 'Remito' },
    { id: 'invoice_type', label: 'Tipo' },
    { id: 'channel', label: 'Canal' },
    { id: 'status', label: 'Estado' },
    { id: 'total', label: 'Total', align: 'right' },
    { id: 'paid_amount', label: 'Pagado', align: 'right' },
    { id: 'balance', label: 'Saldo', align: 'right' },
  ]

  const renderSelectValue = (value, optionsMap, emptyLabel) => {
    if (!value) {
      return <Box component="span" sx={{ color: 'text.secondary' }}>{emptyLabel}</Box>
    }

    return optionsMap[value] || value
  }

  return (
    <PageLayout title="Facturas" subtitle="Listado de facturas con filtros y exportación CSV">
      <LoadingOverlay open={loading} message="Cargando facturas..." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
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
                label="Tipo"
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
                select
                fullWidth
                label="Canal"
                value={filters.channel}
                onChange={(e) => handleFilterChange('channel', e.target.value)}
                InputLabelProps={{ shrink: true }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (value) => renderSelectValue(value, channelFilterLabels, 'Todos los canales'),
                }}
              >
                <MenuItem value="ALL">Consolidado</MenuItem>
                <MenuItem value="MAPSA">MAPSA</MenuItem>
                <MenuItem value="VIGIA">VIGIA</MenuItem>
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
            <Typography variant="h6">Facturas</Typography>
            <Typography variant="body2" color="text.secondary">
              {invoices.length} resultado{invoices.length !== 1 ? 's' : ''}
            </Typography>
          </Box>

          {invoices.length === 0 ? (
            <Typography>No hay facturas con los filtros seleccionados.</Typography>
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
                    <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedInvoices.map((invoice, index) => (
                    <TableRow
                      key={invoice.id}
                      sx={{
                        '&:hover': { backgroundColor: 'grey.50' },
                        borderBottom: index === sortedInvoices.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>{invoice.id_afip || '-'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{formatDate(invoice.invoice_date)}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        {invoice.customer_number !== null && invoice.customer_number !== undefined
                          ? `${invoice.customer_name} (${invoice.customer_number})`
                          : invoice.customer_name}
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>{invoice.work_order_number || '-'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{typeMap[invoice.invoice_type] || 'B'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{invoice.channel}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          size="small"
                          label={statusMap[invoice.status]?.label || invoice.status}
                          color={statusMap[invoice.status]?.color || 'default'}
                        />
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(invoice.total, false)}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(invoice.paid_amount, false)}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(invoice.balance, false)}</TableCell>
                      <TableCell align="center" sx={{ py: 2.5 }}>
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleOpenPayments(invoice)}
                          >
                            Pagos
                          </Button>
                          <TableActionIconButton
                            kind="delete"
                            onClick={() => handleDelete(invoice)}
                            ariaLabel={`Eliminar factura ${invoice.id_afip || invoice.id}`}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={paymentsDialogOpen}
        onClose={handleClosePayments}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Formas de Pago - Factura {selectedInvoice?.id_afip || selectedInvoice?.id || '-'}
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
    </PageLayout>
  )
}

export default InvoiceList
