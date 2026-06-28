import { useState, useEffect } from 'react'
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
  ArrowBack as BackIcon
} from '@mui/icons-material'
import { itemService, categoryService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import { CategorySelect } from '../components'

const BORDER = '1px solid #d4d4d4'

function ProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [product, setProduct] = useState({
    code: '',
    name: '',
    type: 'PRODUCT',
    description: '',
    purchase_price: 0,
    sale_price: 0,
    unit: 'unidad',
    iva_rate: 21.00,
    id_category: null
  })

  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadCategories()
    if (isEdit) {
      loadProduct()
    }
  }, [id])

  const loadCategories = async () => {
    try {
      const response = await categoryService.getAll()
      setCategories(response.data)
    } catch (err) {
      console.error('Error cargando categorías:', err)
    }
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      const [productRes, catRes] = await Promise.all([
        itemService.getById(id),
        categoryService.getItemCategory(id)
      ])
      setProduct(productRes.data)
      setSelectedCategory(catRes.data || null)
    } catch (err) {
      setError('Error al cargar el producto')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setProduct({
      ...product,
      [e.target.name]: e.target.value
    })
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setProduct(prev => ({
      ...prev,
      id_category: category ? category.id : null
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)

      if (isEdit) {
        await itemService.update(id, product)
      } else {
        const response = await itemService.create(product)
        if (selectedCategory && response.data) {
          await categoryService.assignToItem(response.data.id, { id_category: selectedCategory.id })
        }
      }

      navigate('/products')
    } catch (err) {
      console.error('Error al guardar:', err)
      setError(err.response?.data?.detail || 'Error al guardar el producto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default', py: 3 }}>
      <LoadingOverlay open={loading} message="Guardando producto..." />

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ maxWidth: 800, mx: 'auto', mt: 2 }}
      >
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate('/products')}
              variant="text"
              size="small"
              sx={{ mb: 0.5, color: '#555', fontWeight: 500, textTransform: 'none', pl: 0, '&:hover': { bgcolor: 'transparent', color: '#000' } }}
            >
              Volver a Productos
            </Button>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
              {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              onClick={() => navigate('/products')}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveIcon />}
              disabled={loading}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Guardar
            </Button>
          </Stack>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 0, border: BORDER }}>
            {error}
          </Alert>
        )}

        {/* Información general */}
        <Paper sx={{ border: BORDER, borderRadius: 0, mb: 2 }}>
          <Box sx={{ backgroundColor: '#f0f0f0', px: 2, py: 1, borderBottom: BORDER }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#444' }}>
              Información General
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Código"
                  name="code"
                  value={product.code}
                  onChange={handleChange}
                  placeholder="PROD-001"
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  required
                  size="small"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  multiline
                  rows={2}
                  size="small"
                  variant="outlined"
                  placeholder="Detalles del producto..."
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Precios */}
        <Paper sx={{ border: BORDER, borderRadius: 0, mb: 2 }}>
          <Box sx={{ backgroundColor: '#f0f0f0', px: 2, py: 1, borderBottom: BORDER }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#444' }}>
              Precios
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Costo"
                  name="purchase_price"
                  type="number"
                  value={product.purchase_price}
                  onChange={handleChange}
                  size="small"
                  placeholder="0.00"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>$</Box>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Precio de Venta"
                  name="sale_price"
                  type="number"
                  value={product.sale_price}
                  onChange={handleChange}
                  required
                  size="small"
                  placeholder="0.00"
                  variant="outlined"
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>$</Box>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="IVA"
                  name="iva_rate"
                  type="number"
                  value={product.iva_rate}
                  onChange={handleChange}
                  size="small"
                  placeholder="21"
                  variant="outlined"
                  InputProps={{
                    endAdornment: <Box sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>%</Box>
                  }}
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Categoría */}
        <Paper sx={{ border: BORDER, borderRadius: 0 }}>
          <Box sx={{ backgroundColor: '#f0f0f0', px: 2, py: 1, borderBottom: BORDER }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#444' }}>
              Categoría
            </Typography>
          </Box>
          <Box sx={{ p: 2 }}>
            <CategorySelect
              categories={categories}
              value={selectedCategory}
              onChange={handleCategoryChange}
              label="Categoría"
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}

export default ProductForm
