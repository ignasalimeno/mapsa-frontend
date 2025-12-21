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
  Chip
} from '@mui/material'
import { Add as AddIcon, Visibility as ViewIcon, Build as WorkOrderIcon } from '@mui/icons-material'
import { vehicleService, customerService } from '../services/api'
import { PageLayout } from '../components'

function VehicleList() {
  const [vehicles, setVehicles] = useState([])
  const [customers, setCustomers] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <PageLayout
      title="Vehículos"
      subtitle="Listado de vehículos registrados"
      onBack={() => navigate(-1)}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Lista de Vehículos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/vehicles/new')}
        >
          Nuevo Vehículo
        </Button>
      </Box>

      <Card>
        <CardContent>
          {vehicles.length === 0 ? (
            <Typography>No hay vehículos registrados</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Marca</TableCell>
                    <TableCell>Modelo</TableCell>
                    <TableCell>Año</TableCell>
                    <TableCell>Patente</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicles.map(vehicle => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{customers[vehicle.id_customer] || 'N/A'}</TableCell>
                      <TableCell>{vehicle.brand}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>{vehicle.year}</TableCell>
                      <TableCell>{vehicle.license_plate}</TableCell>
                      <TableCell>
                        <Chip 
                          label={vehicle.status || 'Activo'} 
                          color="success" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          color="primary"
                          onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                          title="Ver Detalle"
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          color="secondary"
                          onClick={() => navigate(`/work-orders/new?vehicle=${vehicle.id}`)}
                          title="Nuevo Remito"
                        >
                          <WorkOrderIcon />
                        </IconButton>
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