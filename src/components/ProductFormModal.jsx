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
  Stack
} from '@mui/material'
import { Save as SaveIcon } from '@mui/icons-material'
import { itemService, categoryService } from '../services/api'
import { CategorySelect } from '../components'

const BORDER = '1px solid #d4d4d4'

const initialProduct = {
  code: '',
  name: '',
  type: 'PRODUCT',
  purchase_price: '0.00',
  sale_price: '0.00',
  iva_rate: 21.00,
  id_category: null
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

function ProductFormModal({ open, onClose, onSaved, productId }) {
  const isEdit = Boolean(productId)
  const [product, setProduct] = useState({ ...initialProduct })
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (open) {
      loadCategories()
      if (isEdit) {
        loadProduct()
      } else {
        setProduct({ ...initialProduct })
        setSelectedCategory(null)
        setError(null)
      }
    }
  }, [open, productId])

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
        itemService.getById(productId),
        categoryService.getItemCategory(productId)
      ])
      const data = productRes.data
      setProduct({
        code: data.code || '',
        name: data.name || '',
        type: data.type || 'PRODUCT',
        purchase_price: Number(data.purchase_price || 0).toFixed(2),
        sale_price: Number(data.sale_price || 0).toFixed(2),
        iva_rate: data.iva_rate || 21.00,
        id_category: data.id_category || null
      })
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

  const handleBlur = (e) => {
    const { name, value } = e.target
    if ((name === 'purchase_price' || name === 'sale_price') && value !== '') {
      setProduct(prev => ({ ...prev, [name]: Number(value).toFixed(2) }))
    }
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
      setSaving(true)
      setError(null)

      const payload = {
        ...product,
        purchase_price: parseFloat(product.purchase_price) || 0,
        sale_price: parseFloat(product.sale_price) || 0,
        iva_rate: parseFloat(product.iva_rate) || 0
      }

      if (isEdit) {
        await itemService.update(productId, payload)
      } else {
        const response = await itemService.create(payload)
        if (selectedCategory && response.data) {
          await categoryService.assignToItem(response.data.id, { id_category: selectedCategory.id })
        }
      }

      onSaved()
      onClose()
    } catch (err) {
      console.error('Error al guardar:', err)
      setError(err.response?.data?.detail || 'Error al guardar el producto')
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
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={saving}
      PaperProps={{
        sx: { borderRadius: 0, border: BORDER, boxShadow: 'none' }
      }}
    >
      <Box component="form" noValidate onSubmit={handleSubmit}>
        <DialogTitle sx={{ px: 3, py: 2, borderBottom: BORDER, backgroundColor: '#fafafa' }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
            {isEdit ? 'Editar Producto' : 'Nuevo Producto'}
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

              <Section label="Categoría">
                <CategorySelect
                  categories={categories}
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  label="Categoría"
                />
              </Section>

              <Box sx={{ mt: 1.5 }}>
                <Section label="Información General">
                  <Stack spacing={2}>
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
                  </Stack>
                </Section>
              </Box>

              <Box sx={{ mt: 1.5 }}>
                <Section label="Precios">
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Costo"
                        name="purchase_price"
                        value={product.purchase_price}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        size="small"
                        variant="outlined"
                        inputProps={{ step: 0.01 }}
                        InputProps={{
                          startAdornment: <Box component="span" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>$</Box>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Precio de Venta"
                        name="sale_price"
                        value={product.sale_price}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        size="small"
                        variant="outlined"
                        inputProps={{ step: 0.01 }}
                        InputProps={{
                          startAdornment: <Box component="span" sx={{ mr: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>$</Box>
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="IVA"
                        name="iva_rate"
                        value={product.iva_rate}
                        onChange={handleChange}
                        size="small"
                        variant="outlined"
                        InputProps={{
                          endAdornment: <Box component="span" sx={{ ml: 0.5, color: 'text.secondary', fontSize: '0.8rem' }}>%</Box>
                        }}
                      />
                    </Grid>
                  </Grid>
                </Section>
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: BORDER, backgroundColor: '#fafafa' }}>
          <Button
            onClick={handleClose}
            disabled={saving}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
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

export default ProductFormModal
