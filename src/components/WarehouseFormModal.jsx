import { useState, useEffect } from 'react'
import {
  Button,
  TextField,
  Alert,
  Grid,
  Box,
  CircularProgress,
  Stack,
  Paper,
  Divider,
  Typography,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Save as SaveIcon,
  Warehouse as WarehouseIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { warehouseService } from '../services/api'
import { StyledDialog } from '../components'

function SectionHeader({ icon: Icon, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      <Icon sx={{ fontSize: 18, color: 'primary.main', opacity: 0.85 }} />
      <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', lineHeight: 1 }}>
        {label}
      </Typography>
    </Stack>
  )
}

const initialWarehouse = {
  name: '',
  description: '',
  is_active: true
}

function WarehouseFormModal({ open, onClose, onSaved, warehouseId }) {
  const isEdit = Boolean(warehouseId)
  const [warehouse, setWarehouse] = useState({ ...initialWarehouse })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      if (isEdit) {
        loadWarehouse()
      } else {
        setWarehouse({ ...initialWarehouse })
        setError(null)
      }
    }
  }, [open, warehouseId])

  const loadWarehouse = async () => {
    try {
      setLoading(true)
      const response = await warehouseService.getById(warehouseId)
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
      setSaving(true)
      setError(null)
      if (isEdit) {
        await warehouseService.update(warehouseId, warehouse)
      } else {
        await warehouseService.create(warehouse)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError('Error al guardar depósito')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setError(null)
      onClose()
    }
  }

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar Depósito' : 'Nuevo Depósito'}
      icon={<WarehouseIcon />}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={handleClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            form="warehouse-form"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving || loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <Box component="form" id="warehouse-form" noValidate onSubmit={handleSubmit}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
            )}

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
              <SectionHeader icon={WarehouseIcon} label="Identificación" />
              <Divider sx={{ mb: 2 }} />
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={warehouse.name}
                onChange={handleChange}
                required
                size="small"
                variant="outlined"
              />
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
              <SectionHeader icon={InfoIcon} label="Complementario" />
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="description"
                  value={warehouse.description}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  size="small"
                  variant="outlined"
                />
                {isEdit && (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={warehouse.is_active}
                        onChange={handleChange}
                        name="is_active"
                      />
                    }
                    label={warehouse.is_active ? 'Activo' : 'Inactivo'}
                  />
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </Box>
    </StyledDialog>
  )
}

export default WarehouseFormModal
