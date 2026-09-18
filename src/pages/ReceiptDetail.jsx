import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'
import { LoadingOverlay, PageLayout } from '../components'
import { receiptService } from '../services/api'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useConfirm, useNotify } from '../context'

const methodLabels = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHEQUE: 'Cheque',
  ECHEQ: 'E-Cheq',
  CARD_CREDIT: 'Tarjeta Crédito',
  CARD_DEBIT: 'Tarjeta Débito',
  RETENTION: 'Retención',
  OTRO: 'Otro',
}

const invoiceStatusMap = {
  NEW: { label: 'Pendiente', color: 'warning' },
  PARTIAL_PAID: { label: 'Parcial', color: 'info' },
  PAID: { label: 'Pagada', color: 'success' },
  CANCELLED: { label: 'Anulada', color: 'error' },
}

function ReceiptDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { success: notifySuccess, error: notifyError } = useNotify()
  const [receipt, setReceipt] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
  }, [id])

  const load = async () => {
    try {
      setLoading(true)
      const res = await receiptService.getById(id)
      setReceipt(res.data)
    } catch (err) {
      console.error('Error cargando recibo:', err)
      notifyError('No se pudo cargar el recibo')
    } finally {
      setLoading(false)
    }
  }

  const handleVoid = async () => {
    const confirmed = await confirm({
      title: 'Anular recibo',
      message: '¿Anular este recibo? Se revertirán los pagos sobre las facturas.',
      confirmLabel: 'Anular',
      confirmColor: 'error',
    })
    if (!confirmed) return
    try {
      const res = await receiptService.void(id)
      if (res.data?.error) {
        notifyError(res.data.error)
        return
      }
      notifySuccess('Recibo anulado')
      await load()
    } catch (e) {
      notifyError(e?.response?.data?.error || 'No se pudo anular el recibo')
    }
  }

  if (!receipt && !loading) {
    return (
      <PageLayout title="Recibo" onBack={() => navigate('/receipts')}>
        <Typography color="error">Recibo no encontrado</Typography>
      </PageLayout>
    )
  }

  const isCancelled = receipt?.status === 'CANCELLED'

  return (
    <PageLayout
      title={`Recibo ${receipt?.receipt_number || (receipt ? `#${receipt.id_receipt}` : '')}`}
      subtitle={receipt ? `${receipt.customer_name} - ${formatDate(receipt.receipt_date)}` : ''}
      onBack={() => navigate('/receipts')}
      actions={
        receipt && !isCancelled ? (
          <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={handleVoid}>
            Anular Recibo
          </Button>
        ) : null
      }
    >
      {receipt && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="text.secondary">Cliente</Typography>
                  <Typography variant="body1" fontWeight={600}>{receipt.customer_name}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Fecha</Typography>
                  <Typography variant="body1">{formatDate(receipt.receipt_date)}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Canal</Typography>
                  <Typography variant="body1">{receipt.channel}</Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary">Estado</Typography>
                  <Box>
                    <Chip
                      size="small"
                      label={isCancelled ? 'Anulado' : 'Activo'}
                      color={isCancelled ? 'error' : 'success'}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" color="text.secondary">Total</Typography>
                  <Typography variant="h6" fontWeight={700}>{formatCurrency(receipt.total_amount)}</Typography>
                </Grid>
                {receipt.notes && (
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Notas</Typography>
                    <Typography variant="body2">{receipt.notes}</Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Formas de Pago</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Método</TableCell>
                      <TableCell>Cheque / Banco</TableCell>
                      <TableCell>Retención</TableCell>
                      <TableCell>Notas</TableCell>
                      <TableCell align="right">Monto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receipt.lines.map((line) => (
                      <TableRow key={line.id_receipt_line}>
                        <TableCell>{methodLabels[line.method] || line.method}</TableCell>
                        <TableCell>
                          {line.cheque_number || line.bank
                            ? [line.cheque_number, line.bank].filter(Boolean).join(' / ')
                            : '-'}
                        </TableCell>
                        <TableCell>{line.retention_type || line.retention_detail || '-'}</TableCell>
                        <TableCell>{line.notes || '-'}</TableCell>
                        <TableCell align="right">{formatCurrency(line.amount)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4} align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(receipt.total_amount)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Facturas Imputadas</Typography>
              {receipt.invoices.length === 0 ? (
                <Typography color="text.secondary">Sin imputación a facturas (a cuenta).</Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>N° Factura</TableCell>
                        <TableCell>Fecha</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="right">Imputado</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {receipt.invoices.map((inv) => (
                        <TableRow key={inv.id_invoice}>
                          <TableCell>{inv.id_afip || inv.number}</TableCell>
                          <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                          <TableCell align="right">{formatCurrency(inv.total)}</TableCell>
                          <TableCell align="right">{formatCurrency(inv.allocated_amount)}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={invoiceStatusMap[inv.status]?.label || inv.status}
                              color={invoiceStatusMap[inv.status]?.color || 'default'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <LoadingOverlay open={loading} message="Cargando recibo..." />
    </PageLayout>
  )
}

export default ReceiptDetail
