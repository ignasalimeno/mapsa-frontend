import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
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
import { Visibility as ViewIcon } from '@mui/icons-material'
import { customerService, accountService } from '../services/api'
import { formatCurrency } from '../utils/formatters'

function AccountList() {
  const [customers, setCustomers] = useState([])
  const [accounts, setAccounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar clientes
      const customersResponse = await customerService.getAll()
      setCustomers(customersResponse.data)
      
      // Cargar saldos de cuenta corriente para cada cliente
      const accountsData = {}
      for (const customer of customersResponse.data) {
        try {
          const accountResponse = await accountService.getCustomerAccount(customer.id)
          accountsData[customer.id] = accountResponse.data
        } catch (err) {
          // Si no tiene cuenta corriente, inicializar en 0
          accountsData[customer.id] = { balance: 0, movements: [] }
        }
      }
      setAccounts(accountsData)
      
    } catch (err) {
      setError('Error al cargar cuentas corrientes')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getBalanceColor = (balance) => {
    if (balance > 0) return 'success'
    if (balance < 0) return 'error'
    return 'default'
  }

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
  if (error) return <Alert severity="error">{error}</Alert>

  return (
    <Box>
      <Typography variant="h4" mb={3}>Cuentas Corrientes</Typography>
      
      <Card>
        <CardContent>
          {customers.length === 0 ? (
            <Typography>No hay clientes registrados</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Cliente</TableCell>
                    <TableCell>Documento</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell align="right">Saldo</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="center">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customers.map(customer => {
                    const account = accounts[customer.id] || { balance: 0 }
                    const balance = account.balance || 0
                    
                    return (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.name}</TableCell>
                        <TableCell>{customer.document_number || '-'}</TableCell>
                        <TableCell>{customer.phone || '-'}</TableCell>
                        <TableCell align="right">
                          <Typography 
                            color={balance > 0 ? 'error.main' : balance < 0 ? 'success.main' : 'text.primary'}
                            fontWeight="bold"
                          >
                            {formatCurrency(balance, false)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={balance === 0 ? 'Al día' : balance > 0 ? 'A favor' : 'Debe'} 
                            color={getBalanceColor(balance)}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            color="primary"
                            onClick={() => navigate(`/customers/${customer.id}/account`)}
                            title="Ver Detalle"
                          >
                            <ViewIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default AccountList