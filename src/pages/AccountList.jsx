import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Alert,
  Typography,
  Button,
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
import { Download as DownloadIcon } from '@mui/icons-material'
import { customerService, accountService } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useChannel } from '../context'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'

function AccountList() {
  const [customers, setCustomers] = useState([])
  const [accounts, setAccounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('name')
  const navigate = useNavigate()
  const { channel } = useChannel()

  useEffect(() => {
    loadData()
  }, [channel])

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

  const handleExport = async () => {
    try {
      const response = await customerService.exportDebtors()
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'clientes_deudores.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar clientes deudores')
      console.error(err)
    }
  }

  const getSortableValue = (customer, field) => {
    const account = accounts[customer.id] || { balance: 0 }

    switch (field) {
      case 'name':
        return customer.name || ''
      case 'document_number':
        return customer.document_number || ''
      case 'phone':
        return customer.phone || ''
      case 'balance':
        return Number(account.balance || 0)
      case 'status':
        if ((account.balance || 0) === 0) return 'Al día'
        return account.balance > 0 ? 'A favor' : 'Debe'
      default:
        return customer[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedCustomers = [...customers].sort((left, right) => {
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
    { id: 'name', label: 'Cliente' },
    { id: 'document_number', label: 'Documento' },
    { id: 'phone', label: 'Teléfono' },
    { id: 'balance', label: 'Saldo', align: 'right' },
    { id: 'status', label: 'Estado' },
  ]

  return (
    <PageLayout
      title="Cuentas Corrientes"
      subtitle={`${customers.length} cliente${customers.length !== 1 ? 's' : ''}`}
      actions={(
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={handleExport}>
          Exportar Deudores
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando cuentas corrientes..." />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Card>
        <CardContent>
          {customers.length === 0 ? (
            <Typography>No hay clientes registrados</Typography>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'grey.50' }}>
                    {sortableColumns.map((column) => (
                      <TableCell
                        key={column.id}
                        align={column.align || 'left'}
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
                  {sortedCustomers.map((customer, index) => {
                    const account = accounts[customer.id] || { balance: 0 }
                    const balance = account.balance || 0
                    
                    return (
                      <TableRow
                        key={customer.id}
                        sx={{
                          '&:hover': { backgroundColor: 'grey.50' },
                          borderBottom: index === sortedCustomers.length - 1 ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        <TableCell sx={{ py: 2.5 }}>{customer.name}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.document_number || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{customer.phone || '-'}</TableCell>
                        <TableCell align="right" sx={{ py: 2.5 }}>
                          <Typography 
                            color={balance > 0 ? 'error.main' : balance < 0 ? 'success.main' : 'text.primary'}
                            fontWeight="bold"
                          >
                            {formatCurrency(balance, false)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip 
                            label={balance === 0 ? 'Al día' : balance > 0 ? 'A favor' : 'Debe'} 
                            color={getBalanceColor(balance)}
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2.5 }}>
                          <TableActionIconButton
                            kind="access"
                            onClick={() => navigate(`/customers/${customer.id}/account`)}
                            ariaLabel={`Abrir cuenta corriente de ${customer.name}`}
                          />
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
    </PageLayout>
  )
}

export default AccountList