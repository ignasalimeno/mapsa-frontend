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
  Paper,
  Stack,
  Autocomplete,
  Chip
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
          {/* Información Básica */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Información Básica
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Código"
              name="code"
              value={product.code}
              onChange={handleChange}
              variant="outlined"
              placeholder="Ej: PROD-001"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Nombre"
              name="name"
              value={product.name}
              onChange={handleChange}
              required
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Tipo"
              name="type"
              value={product.type}
              onChange={handleChange}
              required
            >
              <MenuItem value="PRODUCT">Producto</MenuItem>
              <MenuItem value="SERVICE">Servicio</MenuItem>
              <MenuItem value="EXTRA_CHARGE">Gasto Extra</MenuItem>
            </TextField>
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
              variant="outlined"
            />
          </Grid>

          {/* Precios */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Precios
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Precio de Compra"
              name="purchase_price"
              type="number"
              value={product.purchase_price}
              onChange={handleChange}
              variant="outlined"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Precio de Venta"
              name="sale_price"
              type="number"
              value={product.sale_price}
              onChange={handleChange}
              required
              variant="outlined"
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>
              }}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="IVA %"
              name="iva_rate"
              type="number"
              value={product.iva_rate}
              onChange={handleChange}
              variant="outlined"
              InputProps={{
                endAdornment: <Typography>%</Typography>
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Unidad"
              name="unit"
              value={product.unit}
              onChange={handleChange}
              variant="outlined"
              placeholder="Ej: unidad, kg, litro"
            />
          </Grid>

          {/* Tags */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
              Etiquetas
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
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
                  label="Tags"
                  placeholder="Selecciona tags"
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
      </FormCard>
    </Box>
  )
}

export default ProductForm
