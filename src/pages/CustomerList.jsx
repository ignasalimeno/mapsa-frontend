import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Alert,
  TextField,
  InputAdornment,
  FormControlLabel,
  Checkbox
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon, Download as DownloadIcon } from '@mui/icons-material'
import { customerService } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import ExcelTable from '../components/ExcelTable'

function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showDebtors, setShowDebtors] = useState(false)
  const navigate = useNavigate()

  const handleExportDebtorsCsv = async () => {
    try {
      setError(null)
      const response = await customerService.exportDebtors()
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'clientes_deudores.csv')
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

  const columns = [
    { id: 'customer_number', label: 'N° Cliente', sortValue: (row) => Number(row.customer_number || 0) },
    { id: 'name', label: 'Nombre' },
    { id: 'document_number', label: 'Documento' },
    { id: 'province', label: 'Provincia' },
    { id: 'postal_code', label: 'CP' },
    { id: 'vehicles', label: 'Vehículos' },
    { id: 'phone', label: 'Teléfono' },
    { id: 'email', label: 'Email' },
    {
      id: 'balance',
      label: 'Cuenta Corriente',
      align: 'right',
      sortValue: (row) => Number(row.balance || 0),
      render: (row) => {
        const balance = Number(row.balance || 0)
        return (
          <span style={{ fontWeight: 600, color: balance > 0 ? '#d32f2f' : '#2e7d32' }}>
            {formatCurrency(balance)}
          </span>
        )
      }
    },
  ]

  const renderActions = (row) => (
    <TableActionIconButton
      kind="access"
      onClick={() => navigate(`/customers/${row.id}`)}
      ariaLabel={`Abrir cliente ${row.name}`}
    />
  )

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

      <Box display="flex" gap={2} alignItems="center" flexWrap="wrap" mb={3}>
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

      <ExcelTable
        columns={columns}
        data={filteredCustomers}
        defaultSort="customer_number"
        actions={renderActions}
        emptyMessage={customers.length === 0 ? 'No hay clientes registrados' : 'No se encontraron clientes'}
      />
    </PageLayout>
  )
}

export default CustomerList