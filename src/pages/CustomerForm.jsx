import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Alert,
  Grid
} from '@mui/material'
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material'
import { customerService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import FormCard from '../components/FormCard'

function CustomerForm() {
  const [customer, setCustomer] = useState({
    name: '',
    document_number: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      console.log('Enviando cliente:', customer)
      const response = await customerService.create(customer)
      console.log('Respuesta:', response)
      navigate('/customers')
    } catch (err) {
      console.error('Error completo:', err)
      const errorMessage = err.response?.data?.detail || err.message || 'Error al crear cliente'
      setError(`Error al crear cliente: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 3 }}>
      <LoadingOverlay open={loading} message="Guardando cliente..." />
      
      <Box display="flex" alignItems="center" mb={4} px={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/customers')}
          variant="outlined"
          sx={{ mr: 3 }}
        >
          Volver
        </Button>
      </Box>

      <FormCard
        title="Nuevo Cliente"
        subtitle="Completa la información del cliente para agregarlo al sistema"
        actions={[
          <Button
            key="cancel"
            variant="outlined"
            onClick={() => navigate('/customers')}
            disabled={loading}
          >
            Cancelar
          </Button>,
          <Button
            key="save"
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
            onClick={handleSubmit}
            size="large"
          >
            Guardar Cliente
          </Button>
        ]}
      >
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              '& .MuiAlert-message': { fontWeight: 500 }
            }}
          >
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre completo"
              name="name"
              value={customer.name}
              onChange={handleChange}
              required
              variant="outlined"
              sx={{ '& .MuiInputLabel-asterisk': { color: 'error.main' } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Número de documento"
              name="document_number"
              value={customer.document_number}
              onChange={handleChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Teléfono"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              variant="outlined"
              placeholder="Ej: +54 11 1234-5678"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Correo electrónico"
              name="email"
              type="email"
              value={customer.email}
              onChange={handleChange}
              variant="outlined"
              placeholder="cliente@email.com"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Dirección"
              name="address"
              value={customer.address}
              onChange={handleChange}
              variant="outlined"
              placeholder="Calle, número, ciudad"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notas adicionales"
              name="notes"
              multiline
              rows={4}
              value={customer.notes}
              onChange={handleChange}
              variant="outlined"
              placeholder="Información adicional sobre el cliente..."
            />
          </Grid>
        </Grid>
      </FormCard>
    </Box>
  )
}

export default CustomerForm