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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { categoryService } from '../services/api'

const BORDER = '1px solid #d4d4d4'

const initialCategory = {
  name: '',
  parent_id: null,
  description: ''
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

function CategoryFormModal({ open, onClose, onSaved, categoryId }) {
  const isEdit = Boolean(categoryId)
  const [category, setCategory] = useState({ ...initialCategory })
  const [parentCategories, setParentCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      loadParentCategories()
      if (isEdit) {
        loadCategory()
      } else {
        setCategory({ ...initialCategory })
        setError(null)
      }
    }
  }, [open, categoryId])

  const loadParentCategories = async () => {
    try {
      const response = await categoryService.getAll()
      setParentCategories(response.data.filter(c => !c.parent_id && (!categoryId || Number(c.id) !== Number(categoryId))))
    } catch (err) {
      console.error('Error cargando categorías:', err)
    }
  }

  const loadCategory = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getById(categoryId)
      setCategory(response.data)
    } catch (err) {
      setError('Error al cargar la categoría')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setCategory({ ...category, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSaving(true)
      setError(null)
      if (isEdit) {
        await categoryService.update(categoryId, category)
      } else {
        await categoryService.create(category)
      }
      onSaved()
      onClose()
    } catch (err) {
      setError('Error al guardar categoría')
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
            {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
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
                      value={category.name}
                      onChange={handleChange}
                      required
                      size="small"
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Categoría padre</InputLabel>
                      <Select
                        name="parent_id"
                        value={category.parent_id || ''}
                        onChange={(e) => setCategory({ ...category, parent_id: e.target.value || null })}
                        label="Categoría padre"
                      >
                        <MenuItem value="">
                          <Typography variant="body2" color="text.secondary">(Es categoría principal)</Typography>
                        </MenuItem>
                        {parentCategories.map((cat) => (
                          <MenuItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Section>

              <Box sx={{ mt: 1.5 }}>
                <Section label="Complementario">
                  <TextField
                    fullWidth
                    label="Descripción"
                    name="description"
                    value={category.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    size="small"
                    variant="outlined"
                  />
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

export default CategoryFormModal
