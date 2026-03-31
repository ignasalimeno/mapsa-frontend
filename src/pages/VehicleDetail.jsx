import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Alert,
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
  Typography,
  Paper,
} from '@mui/material'
import { vehicleService, workOrderService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import { formatCurrency, formatNumber, formatDate } from '../utils/formatters'

function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVehicleData()
  }, [id])

  const getWorkOrderAmount = (workOrder) => {
    if (workOrder.status !== 'INVOICED') return null
    return Number(workOrder.final_total || 0)
  }

  const loadVehicleData = async () => {
    try {
      setLoading(true)
      const [vehicleRes, workOrdersRes] = await Promise.all([
        vehicleService.getById(id),
        workOrderService.getAll({ vehicle_id: id })
      ])
      
      setVehicle(vehicleRes.data)
      setWorkOrders(workOrdersRes.data)
    } catch (err) {
      setError('Error al cargar datos del vehículo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout
      title={`Vehículo ${vehicle.brand} ${vehicle.model}`}
      subtitle={`Patente ${vehicle.plate || vehicle.license_plate || '-'}`}
      onBack={() => navigate(-1)}
      actions={(
        <Button variant="outlined" onClick={() => navigate(`/customers/${vehicle.customer_id}`)}>
          Volver al Cliente
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando vehículo..." />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {!vehicle && <Alert severity="error">Vehículo no encontrado</Alert>}

      {vehicle && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" mb={2}>Detalle del Vehículo</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Marca:</strong> {vehicle.brand}</Typography>
                  <Typography><strong>Modelo:</strong> {vehicle.model}</Typography>
                  <Typography><strong>Motor:</strong> {vehicle.engine || 'No especificado'}</Typography>
                  <Typography><strong>VIN:</strong> {vehicle.vin || 'No especificado'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Año:</strong> {vehicle.year || 'No especificado'}</Typography>
                  <Typography><strong>Patente:</strong> {vehicle.plate || vehicle.license_plate || 'No especificada'}</Typography>
                  <Typography><strong>Kilómetros:</strong> {formatNumber(vehicle.current_km || 0)}</Typography>
                  <Typography><strong>Notas:</strong> {vehicle.notes || 'Sin notas'}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Remitos</Typography>
                <Button
                  variant="contained"
                  onClick={() => navigate(`/work-orders/new?vehicle=${vehicle.id}`)}
                >
                  Nuevo Remito
                </Button>
              </Box>

              {workOrders.length === 0 ? (
                <Typography>No hay remitos para este vehículo</Typography>
              ) : (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>N° Remito</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Patente</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Fecha Apertura</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Estado</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>Descripción</TableCell>
                        <TableCell sx={{ fontWeight: 600, py: 2 }}>KM</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Monto</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {workOrders.map((workOrder, index) => (
                        <TableRow
                          key={workOrder.id}
                          sx={{
                            '&:hover': { backgroundColor: 'grey.50' },
                            borderBottom: index === workOrders.length - 1 ? 'none' : '1px solid #e2e8f0',
                          }}
                        >
                          <TableCell sx={{ py: 2.5 }}>{workOrder.external_id || '-'}</TableCell>
                          <TableCell sx={{ py: 2.5 }}>{vehicle.plate || vehicle.license_plate || '-'}</TableCell>
                          <TableCell sx={{ py: 2.5 }}>{formatDate(workOrder.open_date)}</TableCell>
                          <TableCell sx={{ py: 2.5 }}>
                            <Chip
                              size="small"
                              label={getStatusLabel(workOrder.status)}
                              color={getStatusColor(workOrder.status)}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 2.5 }}>{workOrder.description || '-'}</TableCell>
                          <TableCell sx={{ py: 2.5 }}>{workOrder.km_at_entry ? formatNumber(workOrder.km_at_entry) : '-'}</TableCell>
                          <TableCell align="right" sx={{ py: 2.5, fontWeight: 600 }}>
                            {getWorkOrderAmount(workOrder) !== null
                              ? formatCurrency(getWorkOrderAmount(workOrder), false)
                              : '-'}
                          </TableCell>
                          <TableCell align="center" sx={{ py: 2.5 }}>
                            <TableActionIconButton
                              kind="access"
                              onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}
                              ariaLabel={`Abrir remito ${workOrder.external_id || workOrder.id}`}
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
    </PageLayout>
  )
}

function getStatusColor(status) {
  const colors = {
    OPEN: 'info',
    IN_PROGRESS: 'warning',
    READY: 'success',
    INVOICED: 'primary',
    CANCELLED: 'error',
  }
  return colors[status] || 'default'
}

function getStatusLabel(status) {
  const labels = {
    OPEN: 'Abierto',
    IN_PROGRESS: 'En Progreso',
    READY: 'Listo',
    INVOICED: 'Facturado',
    CANCELLED: 'Cancelado',
  }
  return labels[status] || status
}

export default VehicleDetail