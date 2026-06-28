import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Grid,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Switch,
  FormControlLabel
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { warehouseService } from '../services/api'

const BORDER = '1px solid #d4d4d4'

const initialWarehouse = {
  name: '',
  description: '',
  is_active: true
}

function Section({ label, children }) {
  return (
    <Paper sx={{ border: BORDER, borderRadius: 0 }}>
      <Box sx={{ backgroundColor: '#f0f0f0', px: 2, py: 0.75, borderBottom: BORDER }}>
        <Typography sx={{ fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#444' }}>
          {label}
        </Typography>
      </Box>
      <Box sx={{ p: 2 }}>
        {children}
      </Box>
    </Paper>
  )
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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={saving}
      PaperProps={{
        sx: { borderRadius: 0, border: BORDER, boxShadow: 'none' }
      }}
    >
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: 3, py: 2, borderBottom: BORDER, backgroundColor: '#fafafa' }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
            {isEdit ? 'Editar Depósito' : 'Nuevo Depósito'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ px: 3, py: 2 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={32} />
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 0, border: BORDER }}>
                  {error}
                </Alert>
              )}

              <Section label="Identificación">
                <Grid container spacing={2}>
                  <Grid item xs={12}>
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
                  </Grid>
                </Grid>
              </Section>

              <Box sx={{ mt: 1.5 }}>
                <Section label="Complementario">
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
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
                    </Grid>
                    {isEdit && (
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
                        />
                      </Grid>
                    )}
                  </Grid>
                </Section>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: BORDER, backgroundColor: '#fafafa' }}>
          <Button onClick={handleClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving || loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default WarehouseFormModal
