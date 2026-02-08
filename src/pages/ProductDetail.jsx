import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Grid,
  Paper,
  Typography,
  Stack,
  Divider
} from '@mui/material'
import { ArrowBack as BackIcon, Edit as EditIcon } from '@mui/icons-material'
import { itemService, tagService, stockService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import TagChip from '../components/TagChip'
import StockBadge from '../components/StockBadge'
import PriceDisplay from '../components/PriceDisplay'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [tags, setTags] = useState([])
  const [stockByWarehouse, setStockByWarehouse] = useState([])

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productRes, tagsRes, stockRes] = await Promise.all([
        itemService.getById(id),
        tagService.getItemTags(id),
        stockService.getByItem(id)
      ])
      setProduct(productRes.data)
      setTags(tagsRes.data)
      setStockByWarehouse(stockRes.data)
    } catch (error) {
      console.error('Error cargando producto:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!product) {
    return (
      <Box sx={{ p: 3 }}>
        <LoadingOverlay open={loading} message="Cargando producto..." />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando producto..." />

      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/products')}
          variant="outlined"
        >
          Volver
        </Button>
        <Button
          startIcon={<EditIcon />}
          onClick={() => navigate(`/products/edit/${id}`)}
          variant="contained"
        >
          Editar Producto
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Información principal */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              {product.name}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Código: {product.code || '-'}
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Tipo: {product.type}
            </Typography>

            {product.description && (
              <Typography sx={{ mt: 2 }}>
                {product.description}
              </Typography>
            )}

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Precios
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50',
                    border: '2px solid',
                    borderColor: 'primary.main'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Precio de Costo
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="primary.main">
                    ${product.purchase_price?.toFixed(2) || '0.00'}
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'success.50',
                    border: '2px solid',
                    borderColor: 'success.main'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Precio de Venta
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    ${product.sale_price?.toFixed(2) || '0.00'}
                  </Typography>
                  {product.sale_price && product.purchase_price && (
                    <Typography variant="caption" color="text.secondary">
                      Margen: {(((product.sale_price - product.purchase_price) / product.purchase_price) * 100).toFixed(1)}%
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'grey.50',
                    border: '2px solid',
                    borderColor: 'grey.400'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    IVA
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {product.iva_rate}%
                  </Typography>
                  {product.sale_price && (
                    <Typography variant="caption" color="text.secondary">
                      +${(product.sale_price * product.iva_rate / 100).toFixed(2)}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'info.50',
                    border: '2px solid',
                    borderColor: 'info.main'
                  }}
                >
                  <Typography variant="caption" color="text.secondary" display="block">
                    Precio Final (con IVA)
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    ${(product.sale_price * (1 + product.iva_rate / 100)).toFixed(2)}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tags */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tags
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tags.length === 0 ? (
                <Typography color="text.secondary">Sin tags</Typography>
              ) : (
                tags.map(tag => (
                  <TagChip key={tag.id} tag={tag} />
                ))
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Stock por depósito */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" fontWeight="bold">
                Stock por depósito
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate(`/products/${id}/stock`)}
              >
                Ver gestión de stock
              </Button>
            </Box>
            <Stack spacing={1}>
              {stockByWarehouse.map((row) => (
                <Box
                  key={row.id_warehouse}
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                >
                  <Typography>{row.warehouse_name}</Typography>
                  <StockBadge quantity={row.quantity} />
                </Box>
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProductDetail
