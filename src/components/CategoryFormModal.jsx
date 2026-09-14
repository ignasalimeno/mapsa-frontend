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
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Save as SaveIcon,
  Category as CategoryIcon,
  Info as InfoIcon
} from '@mui/icons-material'
import { categoryService } from '../services/api'
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

const initialCategory = {
  name: '',
  parent_id: null,
  description: ''
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
    <StyledDialog
      open={open}
      onClose={handleClose}
      title={isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
      icon={<CategoryIcon />}
      maxWidth="sm"
      actions={
        <>
          <Button onClick={handleClose} disabled={saving} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            form="category-form"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            disabled={saving || loading}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </>
      }
    >
      <Box component="form" id="category-form" noValidate onSubmit={handleSubmit}>
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
              <SectionHeader icon={CategoryIcon} label="Identificación" />
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
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
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
              <SectionHeader icon={InfoIcon} label="Complementario" />
              <Divider sx={{ mb: 2 }} />
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
            </Paper>
          </Stack>
        )}
      </Box>
    </StyledDialog>
  )
}

export default CategoryFormModal
