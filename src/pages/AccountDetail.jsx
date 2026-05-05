import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { accountService, customerService, invoicePaymentService, invoiceService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { PageLayout } from '../components'
import { useNotify } from '../context'

function AccountDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [customer, setCustomer] = useState(null)
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [invoices, setInvoices] = useState([])
  
  // Unified movement modal state
  const [movementModalOpen, setMovementModalOpen] = useState(false)
  const [paymentLineModalOpen, setPaymentLineModalOpen] = useState(false)
  const [editingPaymentLineIndex, setEditingPaymentLineIndex] = useState(null)
  const [paymentLines, setPaymentLines] = useState([])
  const [retentionTypes, setRetentionTypes] = useState([])
  const [paymentLineForm, setPaymentLineForm] = useState({
    method: 'CASH',
    amount: '',
    retention_type: '',
    notes: '',
    cheque_number: '',
    bank: '',
  })
  const [movementForm, setMovementForm] = useState({
    type: 'PAYMENT', // PAYMENT, DEBIT_NOTE, CREDIT_NOTE
    amount: '',
    date: new Date().toISOString().slice(0,10),
    description: '',
    external_id: ''
  })
  const [allocations, setAllocations] = useState({})
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)
  const [deletePaymentModalOpen, setDeletePaymentModalOpen] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState(null)
  const { success: notifySuccess, error: notifyError } = useNotify()

  const invoiceStatusMap = {
    NEW: { label: 'Pendiente', color: 'warning' },
    PARTIAL_PAID: { label: 'Parcial', color: 'info' },
    PAID: { label: 'Pagada', color: 'success' },
    CANCELLED: { label: 'Anulada', color: 'error' },
  }

  useEffect(() => {
    loadAccountData()
    loadRetentionTypes()
  }, [id])

  const loadRetentionTypes = async () => {
    try {
      const response = await invoicePaymentService.getRetentionTypes()
      setRetentionTypes(response.data || [])
    } catch (err) {
      console.error('Error cargando tipos de retención:', err)
      setRetentionTypes([])
    }
  }

  const loadAccountData = async () => {
    try {
      setLoading(true)
      const [customerRes, accountRes] = await Promise.all([
        customerService.getById(id),
        accountService.getCustomerAccount(id)
      ])
      
      setCustomer(customerRes.data)
      setAccount(accountRes.data)
      await loadInvoices()
    } catch (err) {
      setError('Error al cargar cuenta corriente')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadInvoices = async () => {
    try {
      const resp = await accountService.listCustomerInvoices(id)
      console.log('[DEBUG] Facturas cargadas:', resp.data)
      setInvoices(resp.data)
    } catch (e) {
      console.error('Error cargando facturas:', e)
      setInvoices([])
    }
  }

  const openAttachments = async (invoice) => {
    try {
      setAttachmentsModalOpen(true)
      setSelectedInvoice(invoice)
      setAttachmentsLoading(true)
      const resp = await invoiceService.listAttachments(invoice.id)
      setAttachments(resp.data || [])
    } catch (e) {
      console.error('Error cargando adjuntos:', e)
      setAttachments([])
    } finally {
      setAttachmentsLoading(false)
    }
  }

  const totalPaymentLines = paymentLines.reduce((sum, line) => sum + Number(line.amount || 0), 0)

  // Auto-distribute amount across invoice balances (FIFO)
  const autoDistribute = () => {
    const total = parseFloat(totalPaymentLines || '0')
    if (!total || total <= 0 || invoices.length === 0) return
    let remaining = total
    const nextAlloc = {}
    for (const inv of invoices) {
      const balance = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0))))
      if (remaining <= 0) break
      const assign = Math.min(balance, remaining)
      if (assign > 0) {
        nextAlloc[inv.id] = assign.toFixed(2)
        remaining -= assign
      }
    }
    setAllocations(nextAlloc)
  }

  const openPaymentLineModal = (line = null, index = null) => {
    if (line) {
      setEditingPaymentLineIndex(index)
      setPaymentLineForm({
        method: line.method,
        amount: String(line.amount),
        retention_type: line.retention_type || '',
        notes: line.notes || '',
        cheque_number: line.cheque_number || '',
        bank: line.bank || '',
      })
    } else {
      setEditingPaymentLineIndex(null)
      setPaymentLineForm({
        method: 'CASH',
        amount: '',
        retention_type: '',
        notes: '',
        cheque_number: '',
        bank: '',
      })
    }
    setPaymentLineModalOpen(true)
  }

  const closePaymentLineModal = () => {
    setPaymentLineModalOpen(false)
    setEditingPaymentLineIndex(null)
  }

  const addOrUpdatePaymentLine = () => {
    const amount = Number(paymentLineForm.amount || 0)
    if (!amount || amount <= 0) {
      notifyError('Ingrese un monto válido para la forma de pago')
      return
    }

    if (paymentLineForm.method === 'RETENTION' && !paymentLineForm.retention_type) {
      notifyError('Seleccione un tipo de retención')
      return
    }

    const nextLine = {
      method: paymentLineForm.method,
      amount,
      retention_type: paymentLineForm.method === 'RETENTION' ? paymentLineForm.retention_type : '',
      notes: paymentLineForm.notes || '',
      cheque_number: paymentLineForm.cheque_number || '',
      bank: paymentLineForm.bank || '',
    }

    if (editingPaymentLineIndex !== null) {
      const updated = [...paymentLines]
      updated[editingPaymentLineIndex] = nextLine
      setPaymentLines(updated)
    } else {
      setPaymentLines((prev) => [...prev, nextLine])
    }

    closePaymentLineModal()
    notifySuccess('Forma de pago agregada')
  }

  const deletePaymentLine = (index) => {
    setPaymentLines((prev) => prev.filter((_, i) => i !== index))
  }

  const splitAllocationsForAmount = (baseAllocations, lineAmount) => {
    const totalBase = baseAllocations.reduce((sum, a) => sum + Number(a.amount || 0), 0)
    const lineInt = Math.round(Number(lineAmount || 0))
    if (lineInt <= 0 || totalBase <= 0) return []

    const withFraction = baseAllocations.map((a) => {
      const raw = (Number(a.amount || 0) / totalBase) * lineInt
      const floored = Math.floor(raw)
      return {
        invoice_id: a.invoice_id,
        amount: floored,
        fraction: raw - floored,
      }
    })

    let currentSum = withFraction.reduce((sum, a) => sum + a.amount, 0)
    let remainder = lineInt - currentSum

    withFraction.sort((a, b) => b.fraction - a.fraction)
    let idx = 0
    while (remainder > 0 && withFraction.length > 0) {
      withFraction[idx % withFraction.length].amount += 1
      remainder -= 1
      idx += 1
    }

    return withFraction
      .filter((a) => a.amount > 0)
      .map((a) => ({ invoice_id: a.invoice_id, amount: a.amount }))
  }

  const getMovementReference = (movement) => {
    if (movement?.external_id) return movement.external_id

    const description = String(movement?.description || '')
    if (!description) return '-'

    const afipMatch = description.match(/AFIP\s*[:#-]?\s*([A-Za-z0-9\-\/]+)/i)
    if (afipMatch?.[1]) return afipMatch[1]

    const invoiceMatch = description.match(/Factura\s*[:#-]?\s*([A-Za-z0-9\-\/]+)/i)
    if (invoiceMatch?.[1]) return invoiceMatch[1]

    return '-'
  }

  const openDeletePaymentModal = (movement) => {
    setPaymentToDelete(movement)
    setDeletePaymentModalOpen(true)
  }

  const handleDeletePayment = async () => {
    if (!paymentToDelete) return

    try {
      const response = await accountService.deleteCustomerPayment(id, paymentToDelete.id)
      if (response.data?.error) {
        notifyError(response.data.error)
        return
      }

      notifySuccess('Pago eliminado correctamente')
      setDeletePaymentModalOpen(false)
      setPaymentToDelete(null)
      await loadAccountData()
    } catch (e) {
      notifyError(e?.response?.data?.error || e?.message || 'No se pudo eliminar el pago')
    }
  }

  // Submit unified movement
  const handleSubmitMovement = async () => {
    try {
      if (movementForm.type === 'PAYMENT') {
        if (paymentLines.length === 0) {
          notifyError('Agrega al menos una forma de pago')
          return
        }

        const totalAmount = Math.round(totalPaymentLines)
        if (!totalAmount || totalAmount <= 0) {
          notifyError('El total de formas de pago debe ser mayor a 0')
          return
        }

        // Payment with allocations (base)
        const allocArray = Object.entries(allocations)
          .map(([invoice_id, amt]) => ({ invoice_id: Number(invoice_id), amount: parseFloat(amt || '0') }))
          .filter(a => a.amount > 0)

        const sumAlloc = allocArray.reduce((acc, a) => acc + a.amount, 0)
        if (sumAlloc > totalAmount + 0.0001) {
          notifyError('La suma de asignaciones supera el monto total')
          return
        }

        for (const line of paymentLines) {
          const lineAmount = Math.round(Number(line.amount || 0))
          if (lineAmount <= 0) continue

          const lineAllocations = splitAllocationsForAmount(allocArray, lineAmount)
          const retentionNote = line.method === 'RETENTION' && line.retention_type
            ? `Retención ${line.retention_type}`
            : ''

          const payload = {
            total_amount: lineAmount,
            method: line.method,
            payment_date: movementForm.date,
            notes: [movementForm.description, line.notes, retentionNote].filter(Boolean).join(' | '),
            cheque_number: (line.method === 'CHEQUE' || line.method === 'ECHEQ') ? (line.cheque_number || null) : null,
            bank: (line.method === 'CHEQUE' || line.method === 'ECHEQ') ? (line.bank || null) : null,
            allocations: lineAllocations,
          }

          const response = await accountService.createCustomerPayment(id, payload)
          if (response.data?.error) {
            notifyError(response.data.error)
            return
          }
        }
        
        notifySuccess('Pagos registrados exitosamente')
      } else {
        const amount = parseFloat(movementForm.amount || '0')
        if (!amount || amount <= 0) {
          notifyError('Ingrese un monto válido')
          return
        }

        // Debit/Credit Note
        const payload = {
          amount: amount,
          description: movementForm.description,
          type: movementForm.type,
          direction: movementForm.type === 'DEBIT_NOTE' ? 'DEBIT' : 'CREDIT',
          external_id: movementForm.external_id
        }
        await accountService.createMovement(id, payload)
        notifySuccess('Movimiento registrado exitosamente')
      }

      // Cerrar modal y limpiar ANTES de recargar datos
      setMovementModalOpen(false)
      setAllocations({})
      setPaymentLines([])
      setMovementForm({
        type: 'PAYMENT',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        external_id: ''
      })
      
      // Recargar datos para reflejar los cambios
      await loadAccountData()
    } catch (e) {
      console.error('Error completo:', e)
      const errorMsg = e.response?.data?.error || e.message || 'Error desconocido al registrar el movimiento'
      notifyError(errorMsg)
      setError(errorMsg)
    }
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>
  if (!customer || !account) return <Alert severity="error">Datos no encontrados</Alert>

  return (
    <PageLayout
      title={`Cuenta Corriente - ${customer.name}`}
      subtitle="Gestión de movimientos y saldo"
      onBack={() => navigate(`/customers/${id}`)}
    >
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box>
              <Typography variant="h4" sx={{ color: account.balance > 0 ? 'error.main' : account.balance < 0 ? 'success.main' : 'text.primary', fontWeight: 600 }}>
                Saldo: {formatCurrency(account.balance || 0)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setMovementModalOpen(true)}
            >
              Registrar Movimiento
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Facturas y adjuntos */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Facturas</Typography>
          {invoices.length === 0 ? (
            <Alert severity="info">No hay facturas para este cliente</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N° de Factura</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Pagado</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Adjuntos</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id} hover>
                      <TableCell>{inv.id_afip || inv.number || `#${inv.id}`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={inv.invoice_type || 'B'} 
                          size="small" 
                          color={inv.invoice_type === 'A' ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{(inv.invoice_date || inv.date) ? formatDate(inv.invoice_date || inv.date) : '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.total_amount || 0)}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.paid_amount || 0)}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.balance || 0)}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoiceStatusMap[inv.status]?.label || inv.status || 'N/A'}
                          color={invoiceStatusMap[inv.status]?.color || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Button size="small" variant="outlined" onClick={() => openAttachments(inv)}>
                          Ver adjuntos
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Movimientos</Typography>
          
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>N° AFIP / Referencia</TableCell>
                  <TableCell>Descripción</TableCell>
                  <TableCell align="right">Débito</TableCell>
                  <TableCell align="right">Crédito</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {account.movements.map(movement => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDate(movement.date)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={movement.type === 'PAYMENT' ? 'Pago' : movement.type === 'INVOICE' ? 'Factura' : movement.type === 'DEBIT_NOTE' ? 'N/D' : 'N/C'} 
                        size="small"
                        color={movement.type === 'PAYMENT' || movement.type === 'CREDIT_NOTE' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {getMovementReference(movement) !== '-' ? (
                        <Chip label={getMovementReference(movement)} size="small" variant="outlined" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      {movement.direction === 'DEBIT' ? formatCurrency(movement.amount) : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      {movement.direction === 'CREDIT' ? formatCurrency(movement.amount) : '-'}
                    </TableCell>
                    <TableCell align="center">
                      {movement.type === 'PAYMENT' ? (
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteIcon fontSize="small" />}
                          onClick={() => openDeletePaymentModal(movement)}
                        >
                          Borrar
                        </Button>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!account.movements || account.movements.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">Sin movimientos</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Unified Movement Modal */}
      <Dialog open={movementModalOpen} onClose={() => setMovementModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Registrar Movimiento</DialogTitle>
        <DialogContent sx={{ pt: 1.25 }}>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            {/* Tipo de Movimiento */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Tipo de Movimiento"
                value={movementForm.type}
                onChange={(e) => {
                  setMovementForm({ ...movementForm, type: e.target.value })
                  setAllocations({}) // Reset allocations when changing type
                }}
                fullWidth
                required
              >
                <MenuItem value="PAYMENT">Pago</MenuItem>
                <MenuItem value="DEBIT_NOTE">Nota de Débito</MenuItem>
                <MenuItem value="CREDIT_NOTE">Nota de Crédito</MenuItem>
              </TextField>
            </Grid>

            {/* Monto (solo para notas) */}
            {movementForm.type !== 'PAYMENT' && (
              <Grid item xs={12} md={6}>
                <TextField
                  type="number"
                  label="Monto"
                  value={movementForm.amount}
                  onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                  fullWidth
                  required
                  inputProps={{ step: 0.01, min: 0 }}
                />
              </Grid>
            )}

            {/* Fecha */}
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Fecha"
                value={movementForm.date}
                onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Campo Número AFIP para Notas de Crédito/Débito */}
            {(movementForm.type === 'DEBIT_NOTE' || movementForm.type === 'CREDIT_NOTE') && (
              <Grid item xs={12} md={6}>
                <TextField
                  label="Número AFIP / ID Externo"
                  value={movementForm.external_id}
                  onChange={(e) => setMovementForm({ ...movementForm, external_id: e.target.value })}
                  fullWidth
                  placeholder="Ej: NC-0001-00000123"
                />
              </Grid>
            )}

            {/* Descripción */}
            <Grid item xs={12}>
              <TextField
                label="Descripción / Notas"
                value={movementForm.description}
                onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
                fullWidth
                multiline
                rows={2}
                placeholder={movementForm.type === 'PAYMENT' ? 'Información adicional sobre el pago' : 'Motivo de la nota'}
              />
            </Grid>
          </Grid>

          {/* Invoice Allocation (solo para Pagos) */}
          {movementForm.type === 'PAYMENT' && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight="bold">Formas de Pago</Typography>
                  <Button size="small" variant="contained" onClick={() => openPaymentLineModal()}>
                    Agregar Forma
                  </Button>
                </Box>

                {paymentLines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Sin formas de pago cargadas</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Método</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Detalle</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentLines.map((line, index) => (
                        <TableRow key={`${line.method}-${index}`}>
                          <TableCell>{line.method === 'RETENTION' ? `Retención${line.retention_type ? ` - ${line.retention_type}` : ''}` : line.method}</TableCell>
                          <TableCell align="right">{formatCurrency(line.amount)}</TableCell>
                          <TableCell>{line.notes || '-'}</TableCell>
                          <TableCell align="center">
                            <Button size="small" onClick={() => openPaymentLineModal(line, index)}>Editar</Button>
                            <Button size="small" color="error" onClick={() => deletePaymentLine(index)}>Eliminar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">Distribución en Facturas</Typography>
                {invoices.length > 0 && invoices.some(inv => {
                  const balance = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0))))
                  return balance > 0
                }) && (
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={autoDistribute}
                    disabled={totalPaymentLines <= 0}
                  >
                    Distribuir Automáticamente
                  </Button>
                )}
              </Box>
              {invoices.length === 0 ? (
                <Alert severity="info">No hay facturas registradas para este cliente</Alert>
              ) : !invoices.some(inv => {
                const balance = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0))))
                return balance > 0
              }) ? (
                <Alert severity="success">Todas las facturas están pagadas</Alert>
              ) : (
                <>
                <TableContainer component={Paper} sx={{ maxHeight: 300, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>N° de Factura</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Saldo</TableCell>
                        <TableCell align="right" sx={{ width: 150 }}>Asignar</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.filter(inv => {
                        const balance = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0))))
                        return balance > 0
                      }).map(inv => {
                        const balance = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0))))
                        return (
                          <TableRow key={inv.id}>
                            <TableCell>{inv.id_afip || inv.number || `#${inv.id}`}</TableCell>
                            <TableCell>{(inv.invoice_date || inv.date) ? formatDate(inv.invoice_date || inv.date) : '-'}</TableCell>
                            <TableCell align="right">{formatCurrency(balance)}</TableCell>
                            <TableCell align="right">
                              <TextField
                                size="small"
                                type="number"
                                value={allocations[inv.id] ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value
                                  setAllocations(prev => ({ ...prev, [inv.id]: value }))
                                }}
                                inputProps={{ step: 0.01, min: 0, max: balance }}
                                fullWidth
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Monto Total:</Typography>
                      <Typography variant="h6">{formatCurrency(totalPaymentLines)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Asignado:</Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0))}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Sin Asignar:</Typography>
                      <Typography variant="h6" color={
                        (totalPaymentLines - Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0)) > 0 
                          ? 'warning.main' 
                          : 'success.main'
                      }>
                        {formatCurrency(
                          totalPaymentLines - Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0)
                        )}
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitMovement}>
            {movementForm.type === 'PAYMENT' ? 'Registrar Pago' : 'Registrar Nota'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentLineModalOpen} onClose={closePaymentLineModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingPaymentLineIndex !== null ? 'Editar Forma de Pago' : 'Agregar Forma de Pago'}</DialogTitle>
        <DialogContent sx={{ pt: 1.25 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                select
                label="Método de Pago"
                value={paymentLineForm.method}
                onChange={(e) => setPaymentLineForm({ ...paymentLineForm, method: e.target.value, retention_type: '' })}
                fullWidth
              >
                <MenuItem value="CASH">Efectivo</MenuItem>
                <MenuItem value="TRANSFER">Transferencia</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="ECHEQ">E-Cheq</MenuItem>
                <MenuItem value="RETENTION">Retención</MenuItem>
              </TextField>
            </Grid>

            {paymentLineForm.method === 'RETENTION' && (
              <Grid item xs={12}>
                <TextField
                  select
                  label="Tipo de Retención"
                  value={paymentLineForm.retention_type}
                  onChange={(e) => setPaymentLineForm({ ...paymentLineForm, retention_type: e.target.value })}
                  fullWidth
                  sx={{ minWidth: 380 }}
                  SelectProps={{ displayEmpty: true }}
                  helperText="Seleccioná un tipo de retención"
                >
                  <MenuItem value="" disabled>Seleccionar tipo...</MenuItem>
                  {retentionTypes.map((rt) => (
                    <MenuItem key={rt.id_retention_type} value={rt.name}>{rt.name}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            <Grid item xs={12}>
              <TextField
                type="number"
                label="Monto"
                value={paymentLineForm.amount}
                onChange={(e) => setPaymentLineForm({ ...paymentLineForm, amount: e.target.value })}
                fullWidth
                inputProps={{ step: 0.01, min: 0 }}
              />
            </Grid>

            {(paymentLineForm.method === 'CHEQUE' || paymentLineForm.method === 'ECHEQ') && (
              <>
                <Grid item xs={12}>
                  <TextField
                    label="Número de Cheque"
                    value={paymentLineForm.cheque_number}
                    onChange={(e) => setPaymentLineForm({ ...paymentLineForm, cheque_number: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Banco"
                    value={paymentLineForm.bank}
                    onChange={(e) => setPaymentLineForm({ ...paymentLineForm, bank: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <TextField
                label="Notas"
                value={paymentLineForm.notes}
                onChange={(e) => setPaymentLineForm({ ...paymentLineForm, notes: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closePaymentLineModal}>Cancelar</Button>
          <Button variant="contained" onClick={addOrUpdatePaymentLine}>
            {editingPaymentLineIndex !== null ? 'Actualizar' : 'Agregar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Adjuntos {selectedInvoice ? selectedInvoice.number || `#${selectedInvoice.id}` : ''}</DialogTitle>
        <DialogContent dividers>
          {attachmentsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={24} />
            </Box>
          ) : attachments.length === 0 ? (
            <Alert severity="info">No hay adjuntos para esta factura</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Archivo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Tamaño</TableCell>
                  <TableCell align="center">Descargar</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attachments.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell>{att.filename}</TableCell>
                    <TableCell>{att.content_type || '-'}</TableCell>
                    <TableCell align="right">{att.size_bytes ? `${Math.round(att.size_bytes / 1024)} KB` : '-'}</TableCell>
                    <TableCell align="center">
                      <Button size="small" variant="contained" href={att.download_url} target="_blank" rel="noreferrer">
                        Descargar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAttachmentsModalOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deletePaymentModalOpen} onClose={() => setDeletePaymentModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Pago</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            ¿Seguro que querés borrar este pago? Esta acción va a desasignar sus montos de facturas y ajustar el saldo automáticamente.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePaymentModalOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeletePayment}>Borrar Pago</Button>
        </DialogActions>
      </Dialog>
    </PageLayout>
  )
}

export default AccountDetail