import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Alert,
  Grid,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  Paper,
  Stack
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Warehouse,
  Notes,
  ToggleOn
} from '@mui/icons-material'
import { warehouseService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import FormCard from '../components/FormCard'

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

function FormSection({ icon, label, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2,
        borderColor: 'divider',
        backgroundColor: 'background.paper'
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

function WarehouseForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [warehouse, setWarehouse] = useState({
    name: '',
    description: '',
    is_active: true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEdit) loadWarehouse()
  }, [id])

  const loadWarehouse = async () => {
    try {
      setLoading(true)
      const response = await warehouseService.getById(id)
      setWarehouse(response.data)
    } catch (err) {
      setError('Error al cargar el depósito')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target
    setWarehouse({
      ...warehouse,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      if (isEdit) {
        await warehouseService.update(id, warehouse)
      } else {
        await warehouseService.create(warehouse)
      }
      navigate('/warehouses')
    } catch (err) {
      setError('Error al guardar depósito')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 3 }}>
      <LoadingOverlay open={loading} message="Guardando depósito..." />

      <FormCard
        title={isEdit ? 'Editar Depósito' : 'Nuevo Depósito'}
        subtitle="Completa la información del depósito"
        headerLeft={
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/warehouses')}
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
            onClick={() => navigate('/warehouses')}
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
            Guardar Depósito
          </Button>
        ]}
      >
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <FormSection icon={Warehouse} label="Identificación">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={warehouse.name}
                onChange={handleChange}
                required
                variant="outlined"
                size="small"
              />
            </Grid>
          </FormSection>

          <FormSection icon={Notes} label="Complementario">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={warehouse.description}
                onChange={handleChange}
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
          </FormSection>

          {isEdit && (
            <FormSection icon={ToggleOn} label="Estado">
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={warehouse.is_active}
                      onChange={handleChange}
                      name="is_active"
                    />
                  }
                  label={warehouse.is_active ? 'Activo' : 'Inactivo'}
                  sx={{ display: 'flex', alignItems: 'center' }}
                />
              </Grid>
            </FormSection>
          )}
        </Stack>
      </FormCard>
    </Box>
  )
}

export default WarehouseForm
