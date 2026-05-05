import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  IconButton,
  Chip,
  Stack,
} from '@mui/material'
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material'
import { invoicePaymentService } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useNotify } from '../context'

const paymentMethodOptions = [
  { value: 'CASH', label: 'Efectivo' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'ECHEQ', label: 'Cheque Electrónico' },
  { value: 'RETENTION', label: 'Retención' },
]

export default function InvoicePaymentComposer({ invoiceId, invoiceTotal, onPaymentUpdate }) {
  const [methods, setMethods] = useState([])
  const [draftPayments, setDraftPayments] = useState([])
  const [retentionTypes, setRetentionTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingDraftIndex, setEditingDraftIndex] = useState(null)
  const [totalPaid, setTotalPaid] = useState(0)

  // Form state
  const [formData, setFormData] = useState({
    method: 'CASH',
    amount: '',
    retention_type: null,
    notes: '',
  })

  const { success: notifySuccess, error: notifyError } = useNotify()

  // Cargar datos iniciales
  useEffect(() => {
    loadPaymentMethods()
    loadRetentionTypes()
  }, [invoiceId])

  const getApiErrorMessage = (err, fallback) => {
    return err?.response?.data?.error || err?.message || fallback
  }

  const loadPaymentMethods = async () => {
    try {
      setLoading(true)
      const response = await invoicePaymentService.getPaymentMethods(invoiceId)
      setMethods(response.data || [])
      
      const total = (response.data || []).reduce((sum, m) => sum + Number(m.amount || 0), 0)
      setTotalPaid(total)
      
      if (onPaymentUpdate) {
        onPaymentUpdate(total)
      }
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Error al cargar métodos de pago'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadRetentionTypes = async () => {
    try {
      const response = await invoicePaymentService.getRetentionTypes()
      setRetentionTypes(response.data || [])
    } catch (err) {
      console.error('Error loading retention types:', err)
    }
  }

  const handleOpenDialog = (draftPayment = null, index = null) => {
    if (draftPayment) {
      setEditingDraftIndex(index)
      setFormData({
        method: draftPayment.method,
        amount: draftPayment.amount,
        retention_type: draftPayment.retention_type,
        notes: draftPayment.notes || '',
      })
    } else {
      setEditingDraftIndex(null)
      setFormData({
        method: 'CASH',
        amount: '',
        retention_type: null,
        notes: '',
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingDraftIndex(null)
  }

  const handleAddOrUpdateDraft = () => {
    if (!formData.method || !formData.amount) {
      notifyError('Completa todos los campos requeridos')
      return
    }

    const amount = Number(formData.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      notifyError('El monto debe ser mayor a 0')
      return
    }

    const maxAvailable = getRemainingAmount()
    if (amount > maxAvailable + 0.01) {
      notifyError(`El monto no puede superar el disponible: ${formatCurrency(maxAvailable)}`)
      return
    }

    if (formData.method === 'RETENTION' && !formData.retention_type) {
      notifyError('Selecciona el tipo de retención')
      return
    }

    const nextPayment = {
      method: formData.method,
      amount,
      retention_type: formData.method === 'RETENTION' ? formData.retention_type : null,
      notes: formData.notes || '',
    }

    if (editingDraftIndex !== null) {
      const updated = [...draftPayments]
      updated[editingDraftIndex] = nextPayment
      setDraftPayments(updated)
      notifySuccess('Pago pendiente actualizado')
    } else {
      setDraftPayments((prev) => [...prev, nextPayment])
      notifySuccess('Pago agregado a la lista pendiente')
    }

    handleCloseDialog()
  }

  const handleDeleteSaved = async (paymentId) => {
    if (!window.confirm('¿Eliminar este método de pago?')) return

    try {
      setLoading(true)
      await invoicePaymentService.deletePaymentMethod(paymentId)
      notifySuccess('Método de pago eliminado')
      await loadPaymentMethods()
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Error al eliminar método de pago'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDraft = (index) => {
    setDraftPayments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveAllDrafts = async () => {
    if (draftPayments.length === 0) return

    try {
      setLoading(true)
      for (const draft of draftPayments) {
        try {
          await invoicePaymentService.addPaymentMethod(invoiceId, {
            method: draft.method,
            amount: draft.amount,
            retention_type: draft.retention_type,
            notes: draft.notes,
          })
        } catch (innerErr) {
          const msg = innerErr?.response?.data?.error || innerErr?.message || 'Error al guardar un pago'
          notifyError(msg)
          await loadPaymentMethods()
          return
        }
      }
      notifySuccess('Todos los pagos se guardaron correctamente')
      setDraftPayments([])
      await loadPaymentMethods()
    } catch (err) {
      notifyError(getApiErrorMessage(err, 'Error al guardar los pagos pendientes'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getRemainingAmount = () => {
    const draftTotal = draftPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
    if (editingDraftIndex !== null) {
      return invoiceTotal - (totalPaid + draftTotal - Number(draftPayments[editingDraftIndex]?.amount || 0))
    }
    return invoiceTotal - (totalPaid + draftTotal)
  }

  const draftTotal = draftPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const totalWithDrafts = totalPaid + draftTotal
  const isFullyPaid = totalWithDrafts >= invoiceTotal
  const methodLabel = (method, retentionType) => {
    if (method === 'RETENTION') {
      const retType = retentionTypes.find(r => r.name === retentionType)
      return `${paymentMethodOptions.find(m => m.value === method)?.label} - ${retType?.name || retentionType}`
    }
    return paymentMethodOptions.find(m => m.value === method)?.label
  }

  return (
    <Card sx={{ mt: 0 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Formas de Pago</Typography>
          <Box display="flex" gap={1}>
            {!isFullyPaid && (
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => handleOpenDialog()}
              >
                Agregar
              </Button>
            )}
            {draftPayments.length > 0 && (
              <>
                <Button variant="outlined" size="small" onClick={() => setDraftPayments([])} disabled={loading}>
                  Limpiar Pendientes
                </Button>
                <Button variant="contained" size="small" onClick={handleSaveAllDrafts} disabled={loading}>
                  Guardar Todo
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Resumen */}
        <Stack direction="row" spacing={2} sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">Total Factura</Typography>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>{formatCurrency(invoiceTotal)}</Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">Total Pagado</Typography>
            <Typography 
              variant="h6" 
              sx={{ fontWeight: 600, color: totalPaid > 0 ? 'success.main' : 'text.primary' }}
            >
              {formatCurrency(totalPaid)}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">Pendiente de Guardar</Typography>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: draftTotal > 0 ? 'info.main' : 'text.primary' }}
            >
              {formatCurrency(draftTotal)}
            </Typography>
          </Box>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">Falta Pagar</Typography>
            <Typography 
              variant="h6"
              sx={{ fontWeight: 600, color: getRemainingAmount() > 0 ? 'warning.main' : 'success.main' }}
            >
              {formatCurrency(Math.max(0, invoiceTotal - totalWithDrafts))}
            </Typography>
          </Box>
        </Stack>

        {isFullyPaid && (
          <Alert severity="success" sx={{ mb: 2 }}>
            ✓ Con los pagos pendientes, la factura queda completamente pagada
          </Alert>
        )}

        {draftPayments.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Tienes {draftPayments.length} pago(s) pendiente(s) de guardar. Usa "Guardar Todo" para confirmar.
          </Alert>
        )}

        {/* Tabla de métodos guardados */}
        {methods.length > 0 ? (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Forma de Pago</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notas</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {methods.map((method) => (
                  <TableRow key={method.id_invoice_payment}>
                    <TableCell>
                      <Chip 
                        label={methodLabel(method.method, method.retention_type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(method.amount)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {method.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        disabled
                        title="Edición de pagos guardados pendiente de implementación"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteSaved(method.id_invoice_payment)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            Sin formas de pago registradas
          </Typography>
        )}

        {draftPayments.length > 0 && (
          <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'info.50' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Pendientes de Guardar</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Monto</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notas</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {draftPayments.map((payment, index) => (
                  <TableRow key={`${payment.method}-${index}`}>
                    <TableCell>
                      <Chip
                        label={methodLabel(payment.method, payment.retention_type)}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {payment.notes || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(payment, index)}
                        disabled={loading}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteDraft(index)}
                        disabled={loading}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Dialog para agregar/editar */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingDraftIndex !== null ? 'Editar Pago Pendiente' : 'Agregar Pago Pendiente'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              select
              label="Forma de Pago"
              value={formData.method}
              onChange={(e) => {
                setFormData({ ...formData, method: e.target.value, retention_type: null })
              }}
              fullWidth
            >
              {paymentMethodOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            {formData.method === 'RETENTION' && (
              <TextField
                select
                label="Tipo de Retención"
                value={formData.retention_type || ''}
                onChange={(e) => setFormData({ ...formData, retention_type: e.target.value })}
                fullWidth
              >
                {retentionTypes.map((type) => (
                  <MenuItem key={type.id_retention_type} value={type.name}>
                    {type.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            <TextField
              label="Monto"
              type="number"
              inputProps={{ step: '0.01', min: '0', max: getRemainingAmount() }}
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              helperText={`Máximo disponible: ${formatCurrency(getRemainingAmount())}`}
            />

            <TextField
              label="Notas (opcional)"
              multiline
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              fullWidth
              placeholder="Referencia de transferencia, número de cheque, etc"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleAddOrUpdateDraft} variant="contained" disabled={loading}>
            {editingDraftIndex !== null ? 'Actualizar Pendiente' : 'Agregar a Pendientes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
