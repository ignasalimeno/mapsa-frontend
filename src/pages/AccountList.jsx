import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, Typography, Button, Chip } from '@mui/material'
import { Download as DownloadIcon } from '@mui/icons-material'
import { customerService, accountService } from '../services/api'
import { formatCurrency } from '../utils/formatters'
import { useChannel } from '../context'
import { LoadingOverlay, PageLayout, TableActionIconButton, ExcelTable } from '../components'

function AccountList() {
  const [customers, setCustomers] = useState([])
  const [accounts, setAccounts] = useState({})
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
      const customersResponse = await customerService.getAll()
      setCustomers(customersResponse.data)
      const accountsData = {}
      for (const customer of customersResponse.data) {
        try {
          const accountResponse = await accountService.getCustomerAccount(customer.id)
          accountsData[customer.id] = accountResponse.data
        } catch (err) {
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
      setError('Error al exportar clientes deudores')
      console.error(err)
    }
  }

  const renderActions = (customer) => (
    <TableActionIconButton
      kind="access"
      onClick={() => navigate(`/customers/${customer.id}/account`)}
      ariaLabel={`Abrir cuenta corriente de ${customer.name}`}
    />
  )

  const columns = [
    { id: 'name', label: 'Cliente' },
    { id: 'document_number', label: 'Documento' },
    { id: 'phone', label: 'Teléfono' },
    {
      id: 'balance',
      label: 'Saldo',
      align: 'right',
      render: (row) => {
        const balance = (accounts[row.id] || { balance: 0 }).balance || 0
        return (
          <Typography
            color={balance > 0 ? 'error.main' : balance < 0 ? 'success.main' : 'text.primary'}
            fontWeight="bold"
          >
            {formatCurrency(balance)}
          </Typography>
        )
      },
      sortValue: (row) => Number((accounts[row.id] || { balance: 0 }).balance || 0),
    },
    {
      id: 'status',
      label: 'Estado',
      render: (row) => {
        const balance = (accounts[row.id] || { balance: 0 }).balance || 0
        return (
          <Chip
            label={balance === 0 ? 'Al día' : balance > 0 ? 'A favor' : 'Debe'}
            color={getBalanceColor(balance)}
            size="small"
          />
        )
      },
      sortValue: (row) => {
        const balance = (accounts[row.id] || { balance: 0 }).balance || 0
        if (balance === 0) return 'Al día'
        return balance > 0 ? 'A favor' : 'Debe'
      },
    },
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
      <ExcelTable
        columns={columns}
        data={customers}
        defaultSort="name"
        actions={renderActions}
        emptyMessage="No hay clientes registrados"
      />
    </PageLayout>
  )
}

export default AccountList