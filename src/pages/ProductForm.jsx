import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Alert,
  Grid,
  MenuItem,
  Typography,
  Autocomplete
} from '@mui/material'
import { Save as SaveIcon, ArrowBack as BackIcon } from '@mui/icons-material'
import { itemService, tagService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import FormCard from '../components/FormCard'
import TagChip from '../components/TagChip'

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
    iva_rate: 21.00
  })
  
  const [selectedTags, setSelectedTags] = useState([])
  const [availableTags, setAvailableTags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTags()
    if (isEdit) {
      loadProduct()
    }
  }, [id])

  const loadTags = async () => {
    try {
      const response = await tagService.getAll()
      setAvailableTags(response.data)
    } catch (err) {
      console.error('Error cargando tags:', err)
    }
  }

  const loadProduct = async () => {
    try {
      setLoading(true)
      const [productRes, tagsRes] = await Promise.all([
        itemService.getById(id),
        tagService.getItemTags(id)
      ])
      setProduct(productRes.data)
      setSelectedTags(tagsRes.data)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      
      let savedProduct
      if (isEdit) {
        const response = await itemService.update(id, product)
        savedProduct = response.data
      } else {
        const response = await itemService.create(product)
        savedProduct = response.data
      }
      
      // Actualizar tags
      if (isEdit) {
        // Obtener tags actuales
        const currentTagsRes = await tagService.getItemTags(id)
        const currentTags = currentTagsRes.data
        
        // Tags a agregar
        const tagsToAdd = selectedTags.filter(
          tag => !currentTags.find(ct => ct.id === tag.id)
        )
        
        // Tags a remover
        const tagsToRemove = currentTags.filter(
          tag => !selectedTags.find(st => st.id === tag.id)
        )
        
        // Ejecutar cambios
        await Promise.all([
          ...tagsToAdd.map(tag => tagService.assignToItem(id, tag.id)),
          ...tagsToRemove.map(tag => tagService.removeFromItem(id, tag.id))
        ])
      } else if (savedProduct) {
        // Asignar tags al nuevo producto
        await Promise.all(
          selectedTags.map(tag => tagService.assignToItem(savedProduct.id, tag.id))
        )
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
      
      <Box display="flex" alignItems="center" mb={4} px={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/products')}
          variant="outlined"
          sx={{ mr: 3 }}
        >
          Volver
        </Button>
      </Box>

      <FormCard
        title={isEdit ? 'Editar Producto' : 'Nuevo Producto'}
        subtitle={isEdit ? 'Modifica los datos del producto' : 'Completa la información del producto'}
        actions={[
          <Button
            key="cancel"
            variant="outlined"
            onClick={() => navigate('/products')}
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
            Guardar Producto
          </Button>
        ]}
      >
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3, borderRadius: 2 }}
          >
            {error}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* INFORMACIÓN */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Información
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Código"
                  name="code"
                  value={product.code}
                  onChange={handleChange}
                  variant="outlined"
                  placeholder="PROD-001"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nombre"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontWeight: 500
                    }
                  }}
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
                  rows={3}
                  variant="outlined"
                  placeholder="Detalles del producto..."
                />
              </Grid>
            </Grid>
          </Grid>

          {/* PRECIOS */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Precios
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Costo"
                  name="purchase_price"
                  type="number"
                  value={product.purchase_price}
                  onChange={handleChange}
                  variant="outlined"
                  size="small"
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 1, color: 'text.secondary', fontSize: '0.9rem' }}>$</Box>
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Venta"
                  name="sale_price"
                  type="number"
                  value={product.sale_price}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  size="small"
                  placeholder="0.00"
                  InputProps={{
                    startAdornment: <Box sx={{ mr: 1, color: 'text.secondary', fontSize: '0.9rem', fontWeight: 600 }}>$</Box>
                  }}
                  sx={{
                    '& .MuiOutlinedInput-input': {
                      fontWeight: 600
                    }
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
                  variant="outlined"
                  size="small"
                  placeholder="21"
                  InputProps={{
                    endAdornment: <Box sx={{ ml: 1, color: 'text.secondary', fontSize: '0.9rem' }}>%</Box>
                  }}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* ETIQUETAS */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              Etiquetas
            </Typography>
            <Grid item xs={12} sm={4}>
              <Autocomplete
                multiple
                options={availableTags}
                getOptionLabel={(option) => option.name}
                value={selectedTags}
                onChange={(event, newValue) => setSelectedTags(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder="Busca y agrega tags..."
                    size="small"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <TagChip
                      key={option.id}
                      tag={option}
                      {...getTagProps({ index })}
                    />
                  ))
                }
              />
            </Grid>
          </Grid>
        </Grid>
      </FormCard>
    </Box>
  )
}

export default ProductForm
