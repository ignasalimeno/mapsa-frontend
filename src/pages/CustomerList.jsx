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
  TextField,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material'
import { customerService } from '../services/api'
import { formatCurrency } from '../utils/formatters'

function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDebtors, setShowDebtors] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      const response = await customerService.getAll()
      setCustomers(response.data)
    } catch (err) {
      setError('Error al cargar clientes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase()
    const vehicles = (customer.vehicles || '').toLowerCase()
    const matchesSearch = (
      customer.name?.toLowerCase().includes(search) ||
      customer.document_number?.toLowerCase().includes(search) ||
      vehicles.includes(search)
    )
    const isDebtor = !showDebtors || Number(customer.balance || 0) > 0
    return (
      matchesSearch && isDebtor
    )
  })

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress size={48} /></Box>
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} px={3}>
        <Box>
          <Typography variant="h4" gutterBottom>Lista de Clientes</Typography>
          <Typography variant="body2" color="text.secondary">
            {filteredCustomers.length} de {customers.length} cliente{customers.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/customers/new')}
          size="large"
          sx={{ 
            px: 3,
            py: 1.5,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          }}
        >
          Nuevo Cliente
        </Button>
      </Box>
      
      <Box px={3}>
        <Box mb={3} display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            fullWidth
            placeholder="Buscar por nombre, documento o patente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ backgroundColor: 'white', flex: 1 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showDebtors}
                onChange={(e) => setShowDebtors(e.target.checked)}
              />
            }
            label="Solo deudores"
          />
        </Box>

        <Card sx={{ overflow: 'hidden' }}>
          <CardContent sx={{ p: 0 }}>
            {filteredCustomers.length === 0 ? (
              <Box p={6} textAlign="center">
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {customers.length === 0 ? 'No hay clientes registrados' : 'No se encontraron clientes'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={3}>
                  {customers.length === 0 ? 'Comienza agregando tu primer cliente al sistema' : 'Intenta con otro término de búsqueda'}
                </Typography>
                {customers.length === 0 && <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/customers/new')}
                >
                  Agregar Cliente
                </Button>}
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>N° Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Documento</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Provincia</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>CP</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Cuenta Corriente</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Vehículos</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Teléfono</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Email</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((customer, index) => (
                      <TableRow 
                        key={customer.id}
                        sx={{ 
                          '&:hover': { backgroundColor: 'grey.50' },
                          borderBottom: index === filteredCustomers.length - 1 ? 'none' : '1px solid #e2e8f0'
                        }}
                      >
                        <TableCell sx={{ py: 2.5, fontWeight: 600 }}>{customer.customer_number || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5, fontWeight: 500 }}>{customer.name}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.document_number || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.province || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.postal_code || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5, fontWeight: 600, color: Number(customer.balance || 0) > 0 ? 'error.main' : 'success.main' }}>
                          {formatCurrency(customer.balance || 0, false)}
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.vehicles || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.phone || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.email || '-'}</TableCell>
                        <TableCell align="center" sx={{ py: 2.5 }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            sx={{ px: 3 }}
                          >
                            Acceder
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}

export default CustomerList