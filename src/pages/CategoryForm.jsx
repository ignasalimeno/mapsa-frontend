import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Alert,
  Grid,
  Typography,
  Divider,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Category as CategoryIcon,
  Notes
} from '@mui/icons-material'
import { categoryService } from '../services/api'
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

function CategoryForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [category, setCategory] = useState({
    name: '',
    parent_id: null,
    description: ''
  })
  const [parentCategories, setParentCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadParentCategories()
    if (isEdit) loadCategory()
  }, [id])

  const loadParentCategories = async () => {
    try {
      const response = await categoryService.getAll()
      setParentCategories(response.data.filter(c => !c.parent_id && (!id || Number(c.id) !== Number(id))))
    } catch (err) {
      console.error('Error cargando categorías:', err)
    }
  }

  const loadCategory = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getById(id)
      setCategory(response.data)
    } catch (err) {
      setError('Error al cargar la categoría')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setCategory({
      ...category,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      if (isEdit) {
        await categoryService.update(id, category)
      } else {
        await categoryService.create(category)
      }
      navigate('/categories')
    } catch (err) {
      setError('Error al guardar categoría')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 3 }}>
      <LoadingOverlay open={loading} message="Guardando categoría..." />

      <FormCard
        title={isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
        subtitle="Completa la información de la categoría"
        headerLeft={
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/categories')}
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
            onClick={() => navigate('/categories')}
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
            Guardar Categoría
          </Button>
        ]}
      >
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <FormSection icon={CategoryIcon} label="Identificación">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={category.name}
                onChange={handleChange}
                required
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
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
          </FormSection>

          <FormSection icon={Notes} label="Complementario">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={category.description}
                onChange={handleChange}
                multiline
                rows={3}
                variant="outlined"
              />
            </Grid>
          </FormSection>
        </Stack>
      </FormCard>
    </Box>
  )
}

export default CategoryForm
