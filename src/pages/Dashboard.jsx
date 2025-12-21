import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material'
import {
  People as PeopleIcon,
  DirectionsCar as CarIcon,
  Assignment as WorkOrderIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material'
import { customerService, vehicleService, workOrderService } from '../services/api'
import { PageLayout } from '../components'

function Dashboard() {
  const [stats, setStats] = useState({
    customers: 0,
    vehicles: 0,
    workOrders: 0,
    openWorkOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      
      const [customersRes, vehiclesRes, workOrdersRes] = await Promise.all([
        customerService.getAll(),
        vehicleService.getAll(),
        workOrderService.getAll()
      ])
      
      const workOrders = workOrdersRes.data
      const openWorkOrders = workOrders.filter(wo => 
        wo.status === 'Abierta' || wo.status === 'En Progreso'
      ).length
      
      setStats({
        customers: customersRes.data.length,
        vehicles: vehiclesRes.data.length,
        workOrders: workOrders.length,
        openWorkOrders
      })
    } catch (err) {
      setError('Error al cargar estadísticas')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon, color, onClick }) => (
    <Card sx={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="h6">
              {title}
            </Typography>
            <Typography variant="h3" color={color}>
              {value}
            </Typography>
          </Box>
          <Box color={color}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Resumen general del sistema"
    >
      <Box>
      
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clientes"
            value={stats.customers}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="primary.main"
            onClick={() => navigate('/customers')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Vehículos"
            value={stats.vehicles}
            icon={<CarIcon sx={{ fontSize: 40 }} />}
            color="secondary.main"
            onClick={() => navigate('/vehicles')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Órdenes Totales"
            value={stats.workOrders}
            icon={<WorkOrderIcon sx={{ fontSize: 40 }} />}
            color="success.main"
            onClick={() => navigate('/work-orders')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Órdenes Abiertas"
            value={stats.openWorkOrders}
            icon={<WorkOrderIcon sx={{ fontSize: 40 }} />}
            color="warning.main"
            onClick={() => navigate('/work-orders')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" mb={2}>Acciones Rápidas</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button 
                  variant="outlined" 
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/customers/new')}
                >
                  Nuevo Cliente
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<WorkOrderIcon />}
                  onClick={() => navigate('/work-orders/new')}
                >
                  Nuevo Remito
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<AccountIcon />}
                  onClick={() => navigate('/account')}
                >
                  Ver Cuentas Corrientes
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </PageLayout>
  )
}

export default Dashboard