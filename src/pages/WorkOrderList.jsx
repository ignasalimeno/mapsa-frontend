import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Alert,
  Typography,
  Chip,
  TextField,
  InputAdornment
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { workOrderService, customerService, vehicleService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton, ExcelTable } from '../components'
import { formatCurrency, formatDate } from '../utils/formatters'
import { useChannel, useConfirm, useNotify } from '../context'
import { WORK_ORDER_STATUS } from '../constants/workOrderStatus'

function WorkOrderList() {
  const [workOrders, setWorkOrders] = useState([])
  const [filteredWorkOrders, setFilteredWorkOrders] = useState([])
  const [customers, setCustomers] = useState({})
  const [vehicles, setVehicles] = useState({})
  const [vehiclePlates, setVehiclePlates] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const navigate = useNavigate()
  const { channel } = useChannel()
  const confirm = useConfirm()
  const { error: notifyError, success: notifySuccess } = useNotify()

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

      const workOrdersResponse = await workOrderService.getAll()
      setWorkOrders(workOrdersResponse.data)
      setFilteredWorkOrders(workOrdersResponse.data)

      const customersResponse = await customerService.getAll()
      const customersMap = {}
      customersResponse.data.forEach(customer => {
        customersMap[customer.id] = customer.name
      })
      setCustomers(customersMap)

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
    if (workOrder.invoice_total != null) return Number(workOrder.invoice_total || 0)
    return Number(workOrder.final_total || 0) + Number(workOrder.total_iva || 0)
  }

  const columns = [
    {
      id: 'external_id',
      label: 'N° de Remito',
      sortValue: (row) => (row.external_id || '').toString().toLowerCase(),
      render: (row) => row.external_id ? (
        <Typography sx={{ fontWeight: 600 }}>{row.external_id}</Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">-</Typography>
      ),
    },
    {
      id: 'customer_name',
      label: 'Cliente',
      sortValue: (row) => (customers[row.customer_id] || '').toLowerCase(),
      render: (row) => customers[row.customer_id] || 'N/A',
    },
    {
      id: 'plate',
      label: 'Patente',
      sortValue: (row) => (vehiclePlates[row.vehicle_id] || '').toLowerCase(),
      render: (row) => vehiclePlates[row.vehicle_id] || '-',
    },
    {
      id: 'description',
      label: 'Descripción',
      sortValue: (row) => (row.description || '').toLowerCase(),
    },
    {
      id: 'status',
      label: 'Estado',
      sortValue: (row) => (WORK_ORDER_STATUS[row.status]?.label || row.status || '').toLowerCase(),
      render: (row) => (
        <Chip
          label={(WORK_ORDER_STATUS[row.status]?.label) || 'Abierto'}
          color={(WORK_ORDER_STATUS[row.status]?.color) || 'default'}
          size="small"
        />
      ),
    },
    {
      id: 'open_date',
      label: 'Fecha',
      sortValue: (row) => new Date(row.open_date || 0).getTime(),
      render: (row) => formatDate(row.open_date),
    },
    {
      id: 'final_total',
      label: 'Monto',
      align: 'right',
      sortValue: (row) => getWorkOrderAmount(row),
      render: (row) => (
        <Typography sx={{ fontWeight: 600 }}>{formatCurrency(getWorkOrderAmount(row))}</Typography>
      ),
    },
  ]

  const renderActions = (row) => (
    <Box display="flex" gap={1} justifyContent="center">
      <TableActionIconButton
        kind="access"
        onClick={() => navigate(`/work-orders/${row.id}/edit`)}
        ariaLabel={`Abrir remito ${row.external_id || row.id}`}
      />
      <TableActionIconButton
        kind="delete"
        onClick={() => handleDelete(row)}
        ariaLabel={`Eliminar remito ${row.external_id || row.id}`}
      />
    </Box>
  )

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

      <ExcelTable
        columns={columns}
        data={filteredWorkOrders}
        defaultSort="open_date"
        defaultOrder="desc"
        actions={renderActions}
        emptyMessage={searchTerm ? 'No se encontraron remitos con ese criterio' : 'No hay remitos registrados'}
      />
    </PageLayout>
  )
}

export default WorkOrderList
