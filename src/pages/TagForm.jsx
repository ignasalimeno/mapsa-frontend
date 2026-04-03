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
  Stack
} from '@mui/material'
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  LabelOutlined,
  PaletteOutlined,
  Notes
} from '@mui/icons-material'
import { tagService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import FormCard from '../components/FormCard'

const DEFAULT_TAG_COLOR = '#2563eb'

function normalizeHexColor(value) {
  const raw = String(value || '').trim()
  if (!raw) return DEFAULT_TAG_COLOR

  const withHash = raw.startsWith('#') ? raw : `#${raw}`
  return /^#[0-9A-Fa-f]{6}$/.test(withHash) ? withHash.toLowerCase() : DEFAULT_TAG_COLOR
}

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

function TagForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [tag, setTag] = useState({
    name: '',
    description: '',
    color: DEFAULT_TAG_COLOR
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
      setTag({
        ...response.data,
        color: normalizeHexColor(response.data?.color)
      })
    } catch (err) {
      setError('Error al cargar el tag')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setTag({
      ...tag,
      [name]: name === 'color' ? normalizeHexColor(value) : value
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

      <FormCard
        title={isEdit ? 'Editar Tag' : 'Nuevo Tag'}
        subtitle="Completa la información del tag"
        headerLeft={
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/tags')}
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
        <Stack spacing={2.5}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <FormSection icon={LabelOutlined} label="Identificación">
            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={tag.name}
                onChange={handleChange}
                required
                variant="outlined"
                size="small"
              />
            </Grid>
          </FormSection>

          <FormSection icon={PaletteOutlined} label="Visual">
            <Grid item xs={12} sm={5}>
              <TextField
                fullWidth
                label="Código de color"
                name="color"
                value={tag.color}
                onChange={handleChange}
                variant="outlined"
                size="small"
                placeholder="#2563eb"
              />
            </Grid>
            <Grid item xs={12} sm={7}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: tag.color
                  }}
                />
                <Box
                  component="input"
                  type="color"
                  name="color"
                  value={tag.color}
                  onChange={handleChange}
                  sx={{
                    width: 64,
                    height: 38,
                    p: 0,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer'
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Vista previa: {tag.color.toUpperCase()}
                </Typography>
              </Stack>
            </Grid>
          </FormSection>

          <FormSection icon={Notes} label="Complementario">
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción"
                name="description"
                value={tag.description}
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

export default TagForm
