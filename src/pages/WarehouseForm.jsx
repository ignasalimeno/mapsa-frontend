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
  Container
} from '@mui/material'
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material'
import { warehouseService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import FormCard from '../components/FormCard'

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

      <Box display="flex" alignItems="center" mb={4} px={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/warehouses')}
          variant="outlined"
          sx={{ mr: 3 }}
        >
          Volver
        </Button>
      </Box>

      <FormCard
        title={isEdit ? 'Editar Depósito' : 'Nuevo Depósito'}
        subtitle="Completa la información del depósito"
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
        <Container maxWidth="sm" disableGutters>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* IDENTIFICACIÓN */}
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.3 }}>
                Identificación
              </Typography>
            </Grid>
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

            {/* COMPLEMENTARIO */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.3 }}>
                Complementario
              </Typography>
            </Grid>
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

            {/* ESTADO (solo en edición) */}
            {isEdit && (
              <>
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: 0.3 }}>
                    Estado
                  </Typography>
                </Grid>
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
              </>
            )}
          </Grid>
        </Container>
      </FormCard>
    </Box>
  )
}

export default WarehouseForm
