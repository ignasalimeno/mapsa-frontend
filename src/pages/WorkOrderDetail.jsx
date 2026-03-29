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
  Grid,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon
} from '@mui/icons-material'
import { workOrderService, invoiceService, paymentService, accountService } from '../services/api'
import { PageLayout } from '../components'
import { formatCurrency, formatNumber } from '../utils/formatters'

function WorkOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [workOrder, setWorkOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [account, setAccount] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'cash', reference: '' })
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceFile, setInvoiceFile] = useState(null)

  useEffect(() => {
    loadWorkOrderData()
  }, [id])

  const loadWorkOrderData = async () => {
    try {
      setLoading(true)
      const response = await workOrderService.getById(id)
      setWorkOrder(response.data)
      // Load account info for balance context
      try {
        const accResp = await accountService.getCustomerAccount(response.data.customer_id)
        setAccount(accResp.data)
      } catch (e) {
        console.warn('No account info', e)
      }
    } catch (err) {
      setError('Error al cargar orden de trabajo')
      console.error('Error al cargar orden de trabajo:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateDeliveryNote = async () => {
    try {
      setGenerating(true)
      const resp = await workOrderService.generateDeliveryNote(id)
      const data = resp.data
      if (data.error) throw new Error(data.error)
      await loadWorkOrderData()
      alert(`Remito generado: ${data.delivery_note_number}`)
    } catch (e) {
      console.error(e)
      alert('Error al generar remito')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateInvoice = async () => {
    setInvoiceModalOpen(true)
  }

  const handleDeleteWorkOrder = async () => {
    const confirmed = window.confirm(`¿Eliminar el remito ${workOrder.external_id || `#${workOrder.id}`}? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    try {
      await workOrderService.delete(id)
      navigate('/work-orders')
    } catch (err) {
      console.error(err)
      alert('Error al eliminar remito')
    }
  }

  const handleConfirmInvoice = async () => {
    try {
      setGenerating(true)
      const resp = await invoiceService.createFromWorkOrder(id)
      const data = resp.data
      if (data.error) throw new Error(data.error)

      if (invoiceFile) {
        try {
          await invoiceService.uploadAttachment(data.id_invoice, invoiceFile)
        } catch (uploadErr) {
          console.error('Error subiendo adjunto', uploadErr)
          alert('Factura creada pero hubo un error subiendo el adjunto')
        }
      }

      await loadWorkOrderData()
      setInvoiceModalOpen(false)
      setInvoiceFile(null)
      alert(`Factura ${data.number} creada. Movimiento #${data.movement_id}`)
    } catch (e) {
      console.error(e)
      alert('Error al generar factura')
    } finally {
      setGenerating(false)
    }
  }

  const openPaymentModal = () => setPaymentOpen(true)
  const closePaymentModal = () => setPaymentOpen(false)
  const submitPayment = async () => {
    try {
      setGenerating(true)
      const amount = parseFloat(String(paymentForm.amount).replace(/[^\d.,]/g, '').replace(/,/g, '.'))
      const payload = {
        customer_id: workOrder.customer_id,
        amount,
        method: paymentForm.method,
        reference: paymentForm.reference,
        invoice_id: undefined,
      }
      const resp = await paymentService.register(payload)
      const data = resp.data
      if (data.error) throw new Error(data.error)
      await loadWorkOrderData()
      setPaymentForm({ amount: '', method: 'cash', reference: '' })
      closePaymentModal()
      alert('Pago registrado')
    } catch (e) {
      console.error(e)
      alert('Error al registrar pago')
    } finally {
      setGenerating(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'info'
      case 'IN_PROGRESS': return 'warning'
      case 'READY': return 'success'
      case 'INVOICED': return 'primary'
      case 'CANCELLED': return 'error'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN': return 'Abierto'
      case 'IN_PROGRESS': return 'En Progreso'
      case 'READY': return 'Listo'
      case 'INVOICED': return 'Facturado'
      case 'CANCELLED': return 'Cancelado'
      default: return status
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>
  }

  if (!workOrder) {
    return <Alert severity="error">Remito no encontrado</Alert>
  }

  return (
    <PageLayout
      title={`Remito #${workOrder.id}`}
      subtitle={`${workOrder.customer_name} - ${workOrder.vehicle_info}`}
      onBack={() => navigate(-1)}
    >
      {/* Información General */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Información General</Typography>
            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteWorkOrder}
              >
                Borrar
              </Button>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/work-orders/${id}/edit`)}
              >
                Editar Remito
              </Button>
            </Box>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Cliente</Typography>
              <Typography variant="body1" mb={2}>{workOrder.customer_name}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Vehículo</Typography>
              <Typography variant="body1" mb={2}>{workOrder.vehicle_info}</Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Estado</Typography>
              <Box mb={2}>
                <Chip 
                  label={getStatusText(workOrder.status)} 
                  color={getStatusColor(workOrder.status)}
                  size="medium"
                />
              </Box>
              
              <Typography variant="subtitle2" color="text.secondary">Fecha de Apertura</Typography>
              <Typography variant="body1" mb={2}>
                {new Date(workOrder.open_date).toLocaleDateString()}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">Descripción</Typography>
              <Typography variant="body1" mb={2}>
                {workOrder.description || 'Sin descripción'}
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary">KM al Ingreso</Typography>
              <Typography variant="body1" mb={2}>
                {workOrder.km_at_entry ? formatNumber(workOrder.km_at_entry) : 'No especificado'}
              </Typography>
            </Grid>
            
            {workOrder.observations && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Observaciones</Typography>
                <Typography variant="body1">{workOrder.observations}</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Resumen Financiero */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={3}>Resumen Financiero</Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box textAlign="center" p={3} sx={{ backgroundColor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="h4" fontWeight={700} color="primary.main">
                  {formatCurrency(workOrder.final_total || 0, false)}
                </Typography>
                <Typography variant="subtitle1" color="primary.main">
                  Total del Remito
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign="center" p={3} sx={{ backgroundColor: 'success.50', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight={600} color="success.main">
                  {getStatusText(workOrder.status)}
                </Typography>
                <Typography variant="subtitle1" color="success.main">
                  Estado Actual
                </Typography>
                <Box mt={2} display="flex" gap={1} justifyContent="center">
                  <Button
                    variant="outlined"
                    disabled={generating || workOrder.status !== 'OPEN'}
                    onClick={handleGenerateDeliveryNote}
                  >
                    Generar Remito
                  </Button>
                  <Button
                    variant="contained"
                    disabled={generating || workOrder.status !== 'OPEN'}
                    onClick={handleGenerateInvoice}
                  >
                    Generar Factura
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={generating}
                    onClick={openPaymentModal}
                  >
                    Registrar Pago
                  </Button>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box textAlign="center" p={3} sx={{ backgroundColor: 'info.50', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight={600} color="info.main">
                  {new Date(workOrder.open_date).toLocaleDateString()}
                </Typography>
                <Typography variant="subtitle1" color="info.main">
                  Fecha de Apertura
                </Typography>
              </Box>
            </Grid>
          </Grid>
          
          <Box mt={3} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Para ver y editar los items de este remito, haz clic en "Editar Remito"
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Modal Generar Factura con adjunto opcional */}
      <Dialog open={invoiceModalOpen} onClose={() => setInvoiceModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Generar Factura</DialogTitle>
        <DialogContent dividers>
          <Typography gutterBottom>
            Adjunta una imagen (opcional) para asociarla a la factura.
          </Typography>
          <Button variant="outlined" component="label" disabled={generating}>
            Seleccionar archivo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
            />
          </Button>
          {invoiceFile && (
            <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
              {invoiceFile.name} ({Math.round(invoiceFile.size / 1024)} KB)
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setInvoiceModalOpen(false); setInvoiceFile(null); }} disabled={generating}>Cancelar</Button>
          <Button variant="contained" onClick={handleConfirmInvoice} disabled={generating}>
            {generating ? 'Generando...' : 'Generar Factura'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      {paymentOpen && (
        <Card sx={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 1300, minWidth: 400 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>Registrar Pago</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Monto"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Método"
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  fullWidth
                >
                  <MenuItem value="cash">Efectivo</MenuItem>
                  <MenuItem value="transfer">Transferencia</MenuItem>
                  <MenuItem value="card">Tarjeta</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Referencia"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  fullWidth
                />
              </Grid>
              {account && (
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">Balance actual: {formatCurrency(account.balance || 0, false)}</Typography>
                </Grid>
              )}
              <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
                <Button onClick={closePaymentModal}>Cancelar</Button>
                <Button variant="contained" onClick={submitPayment}>Registrar</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </PageLayout>
  )
}

export default WorkOrderDetail