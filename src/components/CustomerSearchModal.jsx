import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  Paper,
} from '@mui/material'
import { Search as SearchIcon, PersonAddAlt1 as SelectIcon } from '@mui/icons-material'
import { StyledDialog } from '.'

function CustomerSearchModal({ open, onClose, customers, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers
    const term = searchTerm.toLowerCase()
    return customers.filter(customer =>
      customer.name?.toLowerCase().includes(term) ||
      String(customer.customer_number || '').toLowerCase().includes(term) ||
      (customer.cuit || '').toLowerCase().includes(term) ||
      (customer.document_number || '').toLowerCase().includes(term) ||
      (customer.vehicles || '').toLowerCase().includes(term)
    )
  }, [customers, searchTerm])

  const handleSelect = (customer) => {
    setSearchTerm('')
    onSelect(customer)
    onClose()
  }

  const handleClose = () => {
    setSearchTerm('')
    onClose()
  }

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      title="Buscar cliente"
      subtitle="Buscá por n° de cliente, nombre, CUIT o patente"
    >
      <TextField
        fullWidth
        autoFocus
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre, n° cliente, CUIT o patente..."
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }} style={{ width: 90 }}>N° Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CUIT/CUIL</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Vehículos</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }} style={{ width: 110 }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {searchTerm
                      ? 'No se encontraron clientes con ese criterio'
                      : 'No hay clientes registrados'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow
                  key={customer.id}
                  hover
                  onClick={() => handleSelect(customer)}
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2">{customer.customer_number || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {customer.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{customer.cuit || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    {customer.vehicles ? (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {customer.vehicles.split(' / ').map((plate, i) => (
                          <Chip key={i} label={plate} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<SelectIcon />}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelect(customer)
                      }}
                      sx={{ px: 1.5, minWidth: 100 }}
                    >
                      Elegir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          {filteredCustomers.length} de {customers.length} clientes
        </Typography>
        <Button onClick={handleClose} variant="outlined">
          Cerrar
        </Button>
      </Box>
    </StyledDialog>
  )
}

export default CustomerSearchModal
