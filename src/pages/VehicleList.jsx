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
  TableSortLabel,
  Paper,
  Chip
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { vehicleService, customerService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'

function VehicleList() {
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('customer')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      // Cargar todos los vehículos
      const vehiclesResponse = await vehicleService.getAll()
      setVehicles(vehiclesResponse.data)
      
      // Cargar clientes para mostrar nombres
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

  const getSortableValue = (vehicle, field) => {
    switch (field) {
      case 'customer':
        return customers[vehicle.id_customer] || ''
      case 'brand':
        return vehicle.brand || ''
      case 'model':
        return vehicle.model || ''
      case 'year':
        return Number(vehicle.year || 0)
      case 'license_plate':
        return vehicle.license_plate || vehicle.plate || ''
      case 'status':
        return vehicle.status || 'Activo'
      default:
        return vehicle[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedVehicles = [...vehicles].sort((left, right) => {
    const leftValue = getSortableValue(left, orderBy)
    const rightValue = getSortableValue(right, orderBy)

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return order === 'asc' ? leftValue - rightValue : rightValue - leftValue
    }

    const comparison = String(leftValue).localeCompare(String(rightValue), 'es', {
      numeric: true,
      sensitivity: 'base',
    })

    return order === 'asc' ? comparison : -comparison
  })

  const sortableColumns = [
    { id: 'customer', label: 'Cliente' },
    { id: 'brand', label: 'Marca' },
    { id: 'model', label: 'Modelo' },
    { id: 'year', label: 'Año' },
    { id: 'license_plate', label: 'Patente' },
    { id: 'status', label: 'Estado' },
  ]

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
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent>
          {vehicles.length === 0 ? (
            <Typography>No hay vehículos registrados</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    {sortableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        sortDirection={orderBy === column.id ? order : false}
                        sx={{ fontWeight: 600, py: 2 }}
                      >
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
                  {sortedVehicles.map((vehicle, index) => (
                    <TableRow
                      key={vehicle.id}
                      sx={{
                        '&:hover': { backgroundColor: 'grey.50' },
                        borderBottom: index === sortedVehicles.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>{customers[vehicle.id_customer] || 'N/A'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{vehicle.brand}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{vehicle.model}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{vehicle.year}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{vehicle.license_plate || vehicle.plate || '-'}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>
                        <Chip 
                          label={vehicle.status || 'Activo'} 
                          color="success" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2.5 }}>
                        <Box display="flex" gap={1} justifyContent="center">
                          <TableActionIconButton
                            kind="access"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            ariaLabel={`Abrir vehículo ${vehicle.brand} ${vehicle.model}`}
                          />
                          <TableActionIconButton
                            kind="workorder"
                          onClick={() => navigate(`/work-orders/new?vehicle=${vehicle.id}`)}
                            ariaLabel={`Crear remito para vehículo ${vehicle.brand} ${vehicle.model}`}
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

export default VehicleList