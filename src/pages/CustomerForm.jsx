import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Alert,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
  Paper,
  Stack,
  Chip,
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  PersonOutline,
  ReceiptLong,
  ContactPhone,
  LocationOn,
  Notes,
} from '@mui/icons-material'
import { customerService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import FormCard from '../components/FormCard'

const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut',
  'Cordoba', 'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy',
  'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquen',
  'Rio Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucuman',
]

// --- Reusable section header component ---
function SectionHeader({ icon: Icon, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      <Icon sx={{ fontSize: 18, color: 'primary.main', opacity: 0.85 }} />
      <Typography
        variant="overline"
        sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Stack>
  )
}

// --- Reusable section card ---
function FormSection({ icon, label, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <SectionHeader icon={icon} label={label} />
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {children}
      </Grid>
    </Paper>
  )
}

function CustomerForm() {
  const [customer, setCustomer] = useState({
    customer_number: '',
    name: '',
    document_number: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    postal_code: '',
    notes: '',
    cuit: '',
    tax_condition: 'CONSUMIDOR_FINAL',
    contact: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const loadNextNumber = async () => {
      try {
        const response = await customerService.getNextNumber()
        setCustomer(prev => ({
          ...prev,
          customer_number: response.data?.next_customer_number || '',
        }))
      } catch (err) {
        console.error('Error loading next customer number:', err)
      }
    }
    loadNextNumber()
  }, [])

  const handleChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      await customerService.create(customer)
      navigate('/customers')
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Error al crear cliente'
      setError(`Error al crear cliente: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  const fieldProps = {
    fullWidth: true,
    variant: 'outlined',
    size: 'small',
    onChange: handleChange,
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 3 }}>
      <LoadingOverlay open={loading} message="Guardando cliente..." />

      <FormCard
        title="Nuevo Cliente"
        subtitle="Completá la información del cliente para agregarlo al sistema"
        headerLeft={
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/customers')}
            variant="text"
            size="small"
            sx={{ mb: 1 }}
          >
            Volver
          </Button>
        }
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
          </Button>,
        ]}
      >
        {/* Remove the inner Container — let FormCard control the width */}
        <Stack spacing={2.5}>
          {error && (
            <Alert
              severity="error"
              sx={{ borderRadius: 2, '& .MuiAlert-message': { fontWeight: 500 } }}
            >
              {error}
            </Alert>
          )}

          {/* IDENTIFICACIÓN */}
          <FormSection icon={PersonOutline} label="Identificación">
            <Grid item xs={12} sm={6}>
              <TextField
                {...fieldProps}
                label="Número de cliente"
                name="customer_number"
                type="number"
                value={customer.customer_number}
                required
                InputProps={{
                  startAdornment: (
                    <Chip label="#" size="small" sx={{ mr: 0.5, height: 20, fontSize: 11 }} />
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...fieldProps}
                label="Nombre completo"
                name="name"
                value={customer.name}
                required
                placeholder="Razón social o nombre"
              />
            </Grid>
          </FormSection>

          {/* FISCAL */}
          <FormSection icon={ReceiptLong} label="Fiscal">
            <Grid item xs={12} sm={6}>
              <TextField
                {...fieldProps}
                label="Número de documento"
                name="document_number"
                value={customer.document_number}
                placeholder="12345678"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...fieldProps}
                label="CUIT"
                name="cuit"
                value={customer.cuit}
                placeholder="20-12345678-9"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel>Condición frente al IVA</InputLabel>
                <Select
                  name="tax_condition"
                  value={customer.tax_condition}
                  onChange={handleChange}
                  label="Condición frente al IVA"
                >
                  <MenuItem value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</MenuItem>
                  <MenuItem value="CONSUMIDOR_FINAL">Consumidor Final</MenuItem>
                  <MenuItem value="EXENTO">Exento</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </FormSection>

          {/* CONTACTO */}
          <FormSection icon={ContactPhone} label="Contacto">
            <Grid item xs={12} sm={6}>
              <TextField
                {...fieldProps}
                label="Persona de contacto"
                name="contact"
                value={customer.contact}
                placeholder="Nombre y apellido"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...fieldProps}
                label="Teléfono"
                name="phone"
                value={customer.phone}
                placeholder="+54 11 1234-5678"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                {...fieldProps}
                label="Correo electrónico"
                name="email"
                type="email"
                value={customer.email}
                placeholder="cliente@email.com"
              />
            </Grid>
          </FormSection>

          {/* UBICACIÓN */}
          <FormSection icon={LocationOn} label="Ubicación">
            <Grid item xs={12}>
              <TextField
                {...fieldProps}
                label="Dirección"
                name="address"
                value={customer.address}
                placeholder="Calle, número, piso/dpto, ciudad"
              />
            </Grid>
            <Grid item xs={12} sm={8}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel shrink>Provincia</InputLabel>
                <Select
                  name="province"
                  value={customer.province}
                  onChange={handleChange}
                  label="Provincia"
                  displayEmpty
                  notched
                  renderValue={(val) =>
                    val ? val : <span style={{ color: '#9e9e9e' }}>Seleccioná una provincia</span>
                  }
                >
                  {PROVINCES.map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                {...fieldProps}
                label="Código postal"
                name="postal_code"
                value={customer.postal_code}
                placeholder="B1644"
              />
            </Grid>
          </FormSection>

          {/* NOTAS */}
          <Paper
            variant="outlined"
            sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider', backgroundColor: 'background.paper' }}
          >
            <SectionHeader icon={Notes} label="Notas adicionales" />
            <Divider sx={{ mb: 2 }} />
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              name="notes"
              multiline
              rows={4}
              value={customer.notes}
              onChange={handleChange}
              placeholder="Información adicional sobre el cliente..."
            />
          </Paper>
        </Stack>
      </FormCard>
    </Box>
  )
}

export default CustomerForm