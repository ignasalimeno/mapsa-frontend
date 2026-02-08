import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Typography,
  InputAdornment,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Inventory as StockIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { itemService, stockService, tagService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import StockBadge from '../components/StockBadge'

function ProductList() {
  const [products, setProducts] = useState([])
  const [stockData, setStockData] = useState({})
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [filterType, setFilterType] = useState('PRODUCT')
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Cargar productos, stock y tags en paralelo
      const [productsRes, stockRes, tagsRes] = await Promise.all([
        itemService.getAll(),
        stockService.getTotal(),
        tagService.getAll()
      ])
      
      setProducts(productsRes.data)
      setTags(tagsRes.data)
      
      // Crear un mapa de stock por producto
      const stockMap = {}
      stockRes.data.forEach(item => {
        stockMap[item.id] = item.total_quantity
      })
      setStockData(stockMap)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id) => {
    navigate(`/products/edit/${id}`)
  }

  const handleViewStock = (id) => {
    navigate(`/products/${id}/stock`)
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesType = !filterType || product.type === filterType
    // TODO: Filtrar por tag cuando tengamos la info de tags por producto
    return matchesSearch && matchesType
  })

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando productos..." />
      
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">
          Productos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/products/new')}
          size="large"
        >
          Nuevo Producto
        </Button>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={filterType}
              label="Tipo"
              onChange={(e) => setFilterType(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="PRODUCT">Productos</MenuItem>
              <MenuItem value="SERVICE">Servicios</MenuItem>
              <MenuItem value="EXTRA_CHARGE">Gastos Extra</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Tag</InputLabel>
            <Select
              value={filterTag}
              label="Tag"
              onChange={(e) => setFilterTag(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {tags.map(tag => (
                <MenuItem key={tag.id} value={tag.id}>{tag.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Tabla */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Código</strong></TableCell>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Tipo</strong></TableCell>
              <TableCell align="right"><strong>Costo</strong></TableCell>
              <TableCell align="right"><strong>Precio</strong></TableCell>
              <TableCell align="center"><strong>IVA %</strong></TableCell>
              <TableCell align="center"><strong>Stock</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No se encontraron productos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell>{product.code || '-'}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {product.name}
                    </Typography>
                    {product.description && (
                      <Typography variant="caption" color="text.secondary">
                        {product.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.type}
                      size="small"
                      color={product.type === 'PRODUCT' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatPrice(product.purchase_price)}
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold">
                      {formatPrice(product.sale_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {product.iva_rate}%
                  </TableCell>
                  <TableCell align="center">
                    {product.type === 'PRODUCT' && (
                      <StockBadge quantity={stockData[product.id] || 0} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(product.id)}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    {product.type === 'PRODUCT' && (
                      <IconButton
                        size="small"
                        onClick={() => handleViewStock(product.id)}
                        color="info"
                      >
                        <StockIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ProductList
