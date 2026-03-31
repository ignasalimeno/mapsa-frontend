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
import { Add as AddIcon } from '@mui/icons-material'
import { accountService, customerService, invoiceService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { PageLayout } from '../components'

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
  const [movementForm, setMovementForm] = useState({
    type: 'PAYMENT', // PAYMENT, DEBIT_NOTE, CREDIT_NOTE
    amount: '',
    method: 'CASH', // CASH, TRANSFER, CHEQUE, ECHEQ
    date: new Date().toISOString().slice(0,10),
    description: '',
    cheque_number: '',
    bank: '',
    external_id: ''
  })
  const [allocations, setAllocations] = useState({})
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [attachmentsLoading, setAttachmentsLoading] = useState(false)

  useEffect(() => {
    loadAccountData()
  }, [id])

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

  // Auto-distribute amount across invoice balances (FIFO)
  const autoDistribute = () => {
    const total = parseFloat(movementForm.amount || '0')
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

  // Submit unified movement
  const handleSubmitMovement = async () => {
    try {
      const amount = parseFloat(movementForm.amount || '0')
      if (!amount || amount <= 0) {
        alert('Ingrese un monto válido')
        return
      }

      if (movementForm.type === 'PAYMENT') {
        // Payment with allocations
        const allocArray = Object.entries(allocations)
          .map(([invoice_id, amt]) => ({ invoice_id: Number(invoice_id), amount: parseFloat(amt || '0') }))
          .filter(a => a.amount > 0)

        const sumAlloc = allocArray.reduce((acc, a) => acc + a.amount, 0)
        if (sumAlloc > amount + 0.0001) {
          alert('La suma de asignaciones supera el monto total')
          return
        }

        const payload = {
          total_amount: amount,
          method: movementForm.method,
          payment_date: movementForm.date,
          notes: movementForm.description || '',
          cheque_number: movementForm.cheque_number || null,
          bank: movementForm.bank || null,
          allocations: allocArray
        }

        const response = await accountService.createCustomerPayment(id, payload)
        
        if (response.data?.error) {
          alert(`Error: ${response.data.error}`)
          return
        }
        
        alert('Pago registrado exitosamente')
      } else {
        // Debit/Credit Note
        const payload = {
          amount: amount,
          description: movementForm.description,
          type: movementForm.type,
          direction: movementForm.type === 'DEBIT_NOTE' ? 'DEBIT' : 'CREDIT',
          external_id: movementForm.external_id
        }
        await accountService.createMovement(id, payload)
        alert('Movimiento registrado exitosamente')
      }

      // Cerrar modal y limpiar ANTES de recargar datos
      setMovementModalOpen(false)
      setAllocations({})
      setMovementForm({
        type: 'PAYMENT',
        amount: '',
        method: 'CASH',
        date: new Date().toISOString().split('T')[0],
        description: '',
        cheque_number: '',
        bank: '',
        external_id: ''
      })
      
      // Recargar datos para reflejar los cambios
      await loadAccountData()
    } catch (e) {
      console.error('Error completo:', e)
      const errorMsg = e.response?.data?.error || e.message || 'Error desconocido al registrar el movimiento'
      alert(`Error al registrar el movimiento: ${errorMsg}`)
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
                Saldo: {formatCurrency(account.balance || 0, false)}
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
                    <TableCell>Factura</TableCell>
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
                      <TableCell>{inv.number || `#${inv.id}`}</TableCell>
                      <TableCell>
                        <Chip 
                          label={inv.invoice_type || 'B'} 
                          size="small" 
                          color={inv.invoice_type === 'A' ? 'primary' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{inv.date ? formatDate(inv.date) : '-'}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.total_amount || 0, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.paid_amount || 0, false)}</TableCell>
                      <TableCell align="right">{formatCurrency(inv.balance || 0, false)}</TableCell>
                      <TableCell>
                        <Chip
                          label={inv.status || 'N/A'}
                          color={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIAL_PAID' ? 'warning' : 'default'}
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
                      {movement.external_id ? (
                        <Chip label={movement.external_id} size="small" variant="outlined" />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      {movement.direction === 'DEBIT' ? formatCurrency(movement.amount, false) : '-'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      {movement.direction === 'CREDIT' ? formatCurrency(movement.amount, false) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {(!account.movements || account.movements.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Sin movimientos</TableCell>
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
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
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

            {/* Método de Pago (solo si es PAYMENT) */}
            {movementForm.type === 'PAYMENT' && (
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Método de Pago"
                  value={movementForm.method}
                  onChange={(e) => setMovementForm({ ...movementForm, method: e.target.value })}
                  fullWidth
                  required
                >
                  <MenuItem value="CASH">Efectivo</MenuItem>
                  <MenuItem value="TRANSFER">Transferencia</MenuItem>
                  <MenuItem value="CHEQUE">Cheque</MenuItem>
                  <MenuItem value="ECHEQ">E-Cheq</MenuItem>
                </TextField>
              </Grid>
            )}

            {/* Monto */}
            <Grid item xs={12} md={movementForm.type === 'PAYMENT' ? 12 : 6}>
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

            {/* Campos específicos para Cheque/E-Cheq */}
            {movementForm.type === 'PAYMENT' && (movementForm.method === 'CHEQUE' || movementForm.method === 'ECHEQ') && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Número de Cheque"
                    value={movementForm.cheque_number}
                    onChange={(e) => setMovementForm({ ...movementForm, cheque_number: e.target.value })}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Banco"
                    value={movementForm.bank}
                    onChange={(e) => setMovementForm({ ...movementForm, bank: e.target.value })}
                    fullWidth
                  />
                </Grid>
              </>
            )}

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
                    disabled={!movementForm.amount || parseFloat(movementForm.amount) <= 0}
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
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Factura</TableCell>
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
                            <TableCell>{inv.number || `#${inv.id}`}</TableCell>
                            <TableCell>{inv.date}</TableCell>
                            <TableCell align="right">{formatCurrency(balance, false)}</TableCell>
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
                <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Monto Total:</Typography>
                      <Typography variant="h6">{formatCurrency(parseFloat(movementForm.amount || 0), false)}</Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Asignado:</Typography>
                      <Typography variant="h6" color="primary.main">
                        {formatCurrency(Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0), false)}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">Sin Asignar:</Typography>
                      <Typography variant="h6" color={
                        (parseFloat(movementForm.amount || 0) - Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0)) > 0 
                          ? 'warning.main' 
                          : 'success.main'
                      }>
                        {formatCurrency(
                          parseFloat(movementForm.amount || 0) - Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0),
                          false
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
    </PageLayout>
  )
}

export default AccountDetail