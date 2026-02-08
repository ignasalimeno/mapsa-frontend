import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Alert,
  Grid
} from '@mui/material'
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material'
import { tagService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import FormCard from '../components/FormCard'

function TagForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [tag, setTag] = useState({
    name: '',
    description: '',
    color: '#2563eb'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isEdit) loadTag()
  }, [id])

  const loadTag = async () => {
    try {
      setLoading(true)
      const response = await tagService.getById(id)
      setTag(response.data)
    } catch (err) {
      setError('Error al cargar el tag')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setTag({
      ...tag,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      if (isEdit) {
        await tagService.update(id, tag)
      } else {
        await tagService.create(tag)
      }
      navigate('/tags')
    } catch (err) {
      setError('Error al guardar tag')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 3 }}>
      <LoadingOverlay open={loading} message="Guardando tag..." />

      <Box display="flex" alignItems="center" mb={4} px={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/tags')}
          variant="outlined"
          sx={{ mr: 3 }}
        >
          Volver
        </Button>
      </Box>

      <FormCard
        title={isEdit ? 'Editar Tag' : 'Nuevo Tag'}
        subtitle="Completa la información del tag"
        actions={[
          <Button
            key="cancel"
            variant="outlined"
            onClick={() => navigate('/tags')}
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
            Guardar Tag
          </Button>
        ]}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={tag.name}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Color"
              name="color"
              value={tag.color}
              onChange={handleChange}
              placeholder="#2563eb"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descripción"
              name="description"
              value={tag.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </FormCard>
    </Box>
  )
}

export default TagForm
