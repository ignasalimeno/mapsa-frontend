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
  TableSortLabel,
  TextField,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material'
import { customerService, invoiceService } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'

function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDebtors, setShowDebtors] = useState(false)
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('customer_number')
  const navigate = useNavigate()

  const handleExportDebtorsCsv = async () => {
    try {
      setError(null)
      const response = await invoiceService.list({})
      const allInvoices = response.data || []
      const debtorInvoices = allInvoices
        .filter((inv) => Number(inv.balance || 0) > 0)
        .sort((a, b) => {
          const byCustomer = (a.customer_name || '').localeCompare(b.customer_name || '')
          if (byCustomer !== 0) return byCustomer
          return (a.number || '').localeCompare(b.number || '')
        })

      const totalByCustomer = debtorInvoices.reduce((acc, inv) => {
        const key = String(inv.customer_id)
        acc[key] = (acc[key] || 0) + Number(inv.balance || 0)
        return acc
      }, {})

      const headers = [
        'cliente',
        'id_comprobante',
        'valor_facturado',
        'valor_adeudado',
        'total_cte',
      ]

      const escapeCsv = (value) => {
        const text = value === null || value === undefined ? '' : String(value)
        return `"${text.replace(/"/g, '""')}"`
      }

      const lines = [
        headers.join(','),
        ...debtorInvoices.map((inv) => {
          const customerLabel = `${inv.customer_name || ''} (${inv.customer_number || '-'})`
          return [
            customerLabel,
            inv.id_afip || '',
            Number(inv.total || 0).toFixed(2),
            Number(inv.balance || 0).toFixed(2),
            Number(totalByCustomer[String(inv.customer_id)] || 0).toFixed(2),
          ].map(escapeCsv).join(',')
        }),
      ]

      const csv = `\uFEFF${lines.join('\n')}`
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'detalle_facturas_deudores.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar detalle de facturas deudoras')
      console.error(err)
    }
  }

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

  const getSortableValue = (customer, key) => {
    switch (key) {
      case 'balance':
        return Number(customer.balance || 0)
      case 'customer_number':
        return Number(customer.customer_number || 0)
      case 'name':
      case 'document_number':
      case 'province':
      case 'postal_code':
      case 'vehicles':
      case 'phone':
      case 'email':
        return (customer[key] || '').toString().toLowerCase()
      default:
        return (customer[key] || '').toString().toLowerCase()
    }
  }

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
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
    { id: 'customer_number', label: 'N° Cliente' },
    { id: 'name', label: 'Nombre' },
    { id: 'document_number', label: 'Documento' },
    { id: 'province', label: 'Provincia' },
    { id: 'postal_code', label: 'CP' },
    { id: 'balance', label: 'Cuenta Corriente' },
    { id: 'vehicles', label: 'Vehículos' },
    { id: 'phone', label: 'Teléfono' },
    { id: 'email', label: 'Email' },
  ]

  return (
    <PageLayout
      title="Clientes"
      subtitle={`${filteredCustomers.length} de ${customers.length} cliente${customers.length !== 1 ? 's' : ''}`}
      actions={(
        <>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportDebtorsCsv}
          >
            Exportar Deudores CSV
          </Button>
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
        </>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando clientes..." />
      {error && <Alert severity="error" sx={{ borderRadius: 2, mb: 3 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
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
        </CardContent>
      </Card>

      <Box>
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
                      {sortableColumns.map((column) => (
                        <TableCell key={column.id} sx={{ fontWeight: 600, py: 2 }}>
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
                    {sortedCustomers.map((customer, index) => (
                      <TableRow 
                        key={customer.id}
                        sx={{ 
                          '&:hover': { backgroundColor: 'grey.50' },
                          borderBottom: index === sortedCustomers.length - 1 ? 'none' : '1px solid #e2e8f0'
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
                          <TableActionIconButton
                            kind="access"
                            onClick={() => navigate(`/customers/${customer.id}`)}
                            ariaLabel={`Abrir cliente ${customer.name}`}
                          />
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
    </PageLayout>
  )
}

export default CustomerList