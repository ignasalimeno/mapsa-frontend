import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  Alert,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TableSortLabel,
  TextField,
  InputAdornment
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { workOrderService, customerService, vehicleService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel, useConfirm, useNotify } from '../context'

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
  const [vehiclePlates, setVehiclePlates] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('external_id')
  const navigate = useNavigate()
  const { channel } = useChannel()
  const confirm = useConfirm()
  const { error: notifyError, success: notifySuccess } = useNotify()
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
      const vehiclePlatesMap = {}
      vehiclesResponse.data.forEach(vehicle => {
        vehiclesMap[vehicle.id] = `${vehicle.brand} ${vehicle.model} (${vehicle.plate || 'Sin patente'})`
        vehiclePlatesMap[vehicle.id] = vehicle.plate || ''
      })
      setVehicles(vehiclesMap)
      setVehiclePlates(vehiclePlatesMap)
      
    } catch (err) {
      setError('Error al cargar órdenes de trabajo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (workOrder) => {
    const confirmed = await confirm({
      title: 'Eliminar remito',
      message: `Vas a eliminar el remito ${workOrder.external_id || '-'}. Esta accion no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      confirmColor: 'error',
    })
    if (!confirmed) return

    try {
      await workOrderService.delete(workOrder.id)
      await loadData()
      notifySuccess('Remito eliminado correctamente')
    } catch (err) {
      setError('Error al eliminar remito')
      notifyError('No se pudo eliminar el remito')
      console.error(err)
    }
  }

  const getWorkOrderAmount = (workOrder) => {
    if (workOrder.status !== 'INVOICED') return null
    return Number(workOrder.final_total || 0)
  }

  const getSortableValue = (workOrder, key) => {
    switch (key) {
      case 'external_id':
        return (workOrder.external_id || '').toString().toLowerCase()
      case 'customer_name':
        return (customers[workOrder.customer_id] || '').toLowerCase()
      case 'vehicle_name':
        return (vehicles[workOrder.vehicle_id] || '').toLowerCase()
      case 'plate':
        return (vehiclePlates[workOrder.vehicle_id] || '').toLowerCase()
      case 'description':
        return (workOrder.description || '').toLowerCase()
      case 'status':
        return (statusMap[workOrder.status]?.label || workOrder.status || '').toLowerCase()
      case 'open_date':
        return new Date(workOrder.open_date || 0).getTime()
      case 'final_total':
        return getWorkOrderAmount(workOrder) ?? -1
      default:
        return (workOrder[key] || '').toString().toLowerCase()
    }
  }

  const sortedWorkOrders = [...filteredWorkOrders].sort((a, b) => {
    const aValue = getSortableValue(a, orderBy)
    const bValue = getSortableValue(b, orderBy)

    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(property)
  }

  const sortableColumns = [
    { id: 'external_id', label: 'N° de Remito' },
    { id: 'customer_name', label: 'Cliente' },
    { id: 'plate', label: 'Patente' },
    { id: 'description', label: 'Descripción' },
    { id: 'status', label: 'Estado' },
    { id: 'open_date', label: 'Fecha' },
    { id: 'final_total', label: 'Monto', align: 'right' },
  ]

  // Invoice creation is handled from the edit/detail page.

  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <PageLayout
      title="Remitos"
      subtitle="Listado y gestión de remitos"
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/work-orders/new')}
        >
          Nuevo Remito
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando remitos..." />

      <Box mb={3}>
        <TextField
          fullWidth
          placeholder="Buscar por cliente, vehículo o N° de Remito..."
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
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    {sortableColumns.map((column) => (
                      <TableCell key={column.id} align={column.align || 'left'} sx={{ fontWeight: 600, py: 2 }}>
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
                  {sortedWorkOrders.map((workOrder, index) => (
                    <TableRow
                      key={workOrder.id}
                      sx={{
                        '&:hover': { backgroundColor: 'grey.50' },
                        borderBottom: index === sortedWorkOrders.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        {workOrder.external_id ? (
                          <Typography sx={{ fontWeight: 600 }}>{workOrder.external_id}</Typography>
                        ) : (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>{customers[workOrder.customer_id] || 'N/A'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{vehiclePlates[workOrder.vehicle_id] || '-'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{workOrder.description}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip
                          label={(statusMap[workOrder.status]?.label) || 'Abierta'}
                          color={(statusMap[workOrder.status]?.color) || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>{formatDate(workOrder.open_date)}</TableCell>
                      <TableCell align="right" sx={{ py: 2.5, fontWeight: 600 }}>
                        {getWorkOrderAmount(workOrder) !== null
                          ? formatCurrency(getWorkOrderAmount(workOrder), false)
                          : '-'}
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2.5 }}>
                        <Box display="flex" gap={1} justifyContent="center">
                          <TableActionIconButton
                            kind="access"
                            onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}
                            ariaLabel={`Abrir remito ${workOrder.external_id || workOrder.id}`}
                          />
                          <TableActionIconButton
                            kind="delete"
                            onClick={() => handleDelete(workOrder)}
                            ariaLabel={`Eliminar remito ${workOrder.external_id || workOrder.id}`}
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
    </PageLayout>
  )
}

export default WorkOrderList