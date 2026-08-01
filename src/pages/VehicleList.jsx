import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  Alert,
  Chip,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { vehicleService, customerService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import ExcelTable from '../components/ExcelTable'
import { useChannel } from '../context'

function VehicleList() {
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { channel } = useChannel()

  useEffect(() => {
    loadData()
  }, [channel])

  const loadData = async () => {
    try {
      setLoading(true)
      const vehiclesResponse = await vehicleService.getAll()
      setVehicles(vehiclesResponse.data)

      const customersResponse = await customerService.getAll()
      const customersMap = {}
      customersResponse.data.forEach(customer => {
        customersMap[customer.id] = customer.name
      })
      setCustomers(customersMap)
    } catch (err) {
      setError('Error al cargar vehículos')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    {
      id: 'customer',
      label: 'Cliente',
      sortable: true,
      render: (row) => customers[row.id_customer] || 'N/A',
      sortValue: (row) => customers[row.id_customer] || '',
    },
    { id: 'brand', label: 'Marca' },
    { id: 'model', label: 'Modelo' },
    { id: 'year', label: 'Año' },
    {
      id: 'license_plate',
      label: 'Patente',
      render: (row) => row.license_plate || row.plate || '-',
    },
    {
      id: 'status',
      label: 'Estado',
      render: (row) => (
        <Chip
          label={row.status || 'Activo'}
          color="success"
          size="small"
        />
      ),
      sortValue: (row) => row.status || 'Activo',
    },
  ]

  const renderActions = (row) => (
    <>
      <TableActionIconButton
        kind="access"
        onClick={() => navigate(`/vehicles/${row.id}`)}
        ariaLabel={`Abrir vehículo ${row.brand} ${row.model}`}
      />
      <span style={{ display: 'inline-block', width: 8 }} />
      <TableActionIconButton
        kind="workorder"
        onClick={() => navigate(`/work-orders/new?vehicle_id=${row.id}`)}
        ariaLabel={`Crear remito para vehículo ${row.brand} ${row.model}`}
      />
    </>
  )

  return (
    <PageLayout
      title="Vehículos"
      subtitle="Listado de vehículos registrados"
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/vehicles/new')}
        >
          Nuevo Vehículo
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando vehículos..." />
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
          <ExcelTable
            columns={columns}
            data={vehicles}
            defaultSort="customer"
            actions={renderActions}
            emptyMessage="No hay vehículos registrados"
          />
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default VehicleList
