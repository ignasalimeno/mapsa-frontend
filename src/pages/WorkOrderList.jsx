import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material'
import { workOrderService, customerService, vehicleService } from '../services/api'
import { PageLayout } from '../components'
import { formatDate } from '../utils/formatters'
import { useChannel } from '../context'

// Map backend status codes to Spanish labels and MUI chip colors
const statusMap = {
  OPEN: { label: 'Abierta', color: 'info' },
  IN_PROGRESS: { label: 'En Progreso', color: 'warning' },
  READY: { label: 'Lista', color: 'success' },
  INVOICED: { label: 'Facturada', color: 'primary' },
  CANCELLED: { label: 'Cancelada', color: 'error' },
}

function WorkOrderList() {
  const [workOrders, setWorkOrders] = useState([])
  const [filteredWorkOrders, setFilteredWorkOrders] = useState([])
  const [customers, setCustomers] = useState({})
  const [vehicles, setVehicles] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const { channel } = useChannel()
  // Single access button: view/edit in one place

  useEffect(() => {
    loadData()
  }, [channel])

  useEffect(() => {
    applyFilters()
  }, [workOrders, searchTerm])

  const applyFilters = () => {
    if (!searchTerm.trim()) {
      setFilteredWorkOrders(workOrders)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = workOrders.filter(wo => {
      const customerName = (customers[wo.customer_id] || '').toLowerCase()
      const vehicleInfo = (vehicles[wo.vehicle_id] || 'sin vehículo').toLowerCase()
      const externalId = (wo.external_id || '').toLowerCase()
      const woId = wo.id.toString()
      
      return customerName.includes(term) || 
             vehicleInfo.includes(term) || 
             externalId.includes(term) ||
             woId.includes(term)
    })
    
    setFilteredWorkOrders(filtered)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar órdenes de trabajo
      const workOrdersResponse = await workOrderService.getAll()
      setWorkOrders(workOrdersResponse.data)
      setFilteredWorkOrders(workOrdersResponse.data)
      
      // Cargar clientes
      const customersResponse = await customerService.getAll()
      const customersMap = {}
      customersResponse.data.forEach(customer => {
        customersMap[customer.id] = customer.name
      })
      setCustomers(customersMap)
      
      // Cargar vehículos
      const vehiclesResponse = await vehicleService.getAll()
      const vehiclesMap = {}
      vehiclesResponse.data.forEach(vehicle => {
        vehiclesMap[vehicle.id] = `${vehicle.brand} ${vehicle.model} (${vehicle.plate || 'Sin patente'})`
      })
      setVehicles(vehiclesMap)
      
    } catch (err) {
      setError('Error al cargar órdenes de trabajo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (workOrder) => {
    const confirmed = window.confirm(`¿Eliminar el remito ${workOrder.external_id || `#${workOrder.id}`}? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    try {
      await workOrderService.delete(workOrder.id)
      await loadData()
    } catch (err) {
      setError('Error al eliminar remito')
      console.error(err)
    }
  }

  // Invoice creation is handled from the edit/detail page.

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <PageLayout
      title="Remitos"
      subtitle="Listado y gestión de remitos"
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Remitos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/work-orders/new')}
        >
          Nuevo Remito
        </Button>
      </Box>

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Buscar por cliente, vehículo, N° de Remito o ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Card>
        <CardContent>
          {filteredWorkOrders.length === 0 ? (
            <Typography>
              {searchTerm ? 'No se encontraron remitos con ese criterio' : 'No hay remitos registrados'}
            </Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>N° Remito</TableCell>
                    <TableCell>N° de Remito</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Vehículo</TableCell>
                    <TableCell>Descripción</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredWorkOrders.map(workOrder => (
                    <TableRow key={workOrder.id}>
                      <TableCell>#{workOrder.id}</TableCell>
                      <TableCell>
                        {workOrder.external_id ? (
                          <Chip label={workOrder.external_id} size="small" variant="outlined" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>{customers[workOrder.customer_id] || 'N/A'}</TableCell>
                      <TableCell>{vehicles[workOrder.vehicle_id] || 'Sin vehículo'}</TableCell>
                      <TableCell>{workOrder.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={(statusMap[workOrder.status]?.label) || 'Abierta'}
                          color={(statusMap[workOrder.status]?.color) || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(workOrder.open_date)}</TableCell>
                      <TableCell align="center">
                        <Box display="flex" gap={1} justifyContent="center">
                          <Button
                            variant="outlined"
                            onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}
                          >
                            Ver / Editar
                          </Button>
                          <Button
                            color="error"
                            variant="outlined"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDelete(workOrder)}
                          >
                            Borrar
                          </Button>
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
    </PageLayout>
  )
}

export default WorkOrderList