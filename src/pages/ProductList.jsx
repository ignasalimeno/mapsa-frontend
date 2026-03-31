import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
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
  Search as SearchIcon
} from '@mui/icons-material'
import { itemService, stockService, tagService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import StockBadge from '../components/StockBadge'
import { PageLayout, TableActionIconButton } from '../components'

function ProductList() {
  const [products, setProducts] = useState([])
  const [stockData, setStockData] = useState({})
  const [productTags, setProductTags] = useState({})
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTag, setFilterTag] = useState('')
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('name')
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

      // Cargar tags por producto para mostrar en grilla y filtrar por tag
      const tagsEntries = await Promise.all(
        productsRes.data.map(async (product) => {
          try {
            const res = await tagService.getItemTags(product.id)
            return [product.id, res.data || []]
          } catch {
            return [product.id, product.tags || []]
          }
        })
      )
      setProductTags(Object.fromEntries(tagsEntries))
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
    const tagList = productTags[product.id] || product.tags || []
    const matchesTag = !filterTag || tagList.some(tag => String(tag.id) === String(filterTag))
    return matchesSearch && matchesTag
  })

  const getSortableValue = (product, field) => {
    switch (field) {
      case 'code':
        return product.code || ''
      case 'name':
        return product.name || ''
      case 'tags':
        return (productTags[product.id] || product.tags || []).map((tag) => tag.name).join(', ')
      case 'purchase_price':
        return Number(product.purchase_price || 0)
      case 'sale_price':
        return Number(product.sale_price || 0)
      case 'iva_rate':
        return Number(product.iva_rate || 0)
      case 'stock':
        return Number(stockData[product.id] || 0)
      default:
        return product[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedProducts = [...filteredProducts].sort((left, right) => {
    const leftValue = getSortableValue(left, orderBy)
    const rightValue = getSortableValue(right, orderBy)

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return order === 'asc' ? leftValue - rightValue : rightValue - leftValue
    }

    const comparison = String(leftValue).localeCompare(String(rightValue), 'es', {
      numeric: true,
      sensitivity: 'base',
    })

    return order === 'asc' ? comparison : -comparison
  })

  const sortableColumns = [
    { id: 'code', label: 'Código' },
    { id: 'name', label: 'Nombre' },
    { id: 'tags', label: 'Tags' },
    { id: 'purchase_price', label: 'Costo', align: 'right' },
    { id: 'sale_price', label: 'Precio', align: 'right' },
    { id: 'iva_rate', label: 'IVA %', align: 'center' },
    { id: 'stock', label: 'Stock', align: 'center' },
  ]

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  return (
    <PageLayout
      title="Productos"
      subtitle={`${filteredProducts.length} producto${filteredProducts.length !== 1 ? 's' : ''}`}
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/products/new')}
          size="large"
        >
          Nuevo Producto
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando productos..." />

      <Card sx={{ mb: 3 }}>
        <CardContent>
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
        </CardContent>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              {sortableColumns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{ fontWeight: 600, py: 2 }}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleRequestSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No se encontraron productos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map((product, index) => (
                <TableRow
                  key={product.id}
                  sx={{
                    '&:hover': { backgroundColor: 'grey.50' },
                    borderBottom: index === sortedProducts.length - 1 ? 'none' : '1px solid #e2e8f0',
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>{product.code || '-'}</TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Typography variant="body2" fontWeight="medium">
                      {product.name}
                    </Typography>
                    {product.description && (
                      <Typography variant="caption" color="text.secondary">
                        {product.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {(productTags[product.id] || product.tags || []).length === 0 ? (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      ) : (
                        (productTags[product.id] || product.tags || []).map((tag) => (
                          <Chip
                            key={`${product.id}-${tag.id}`}
                            label={tag.name}
                            size="small"
                            variant="outlined"
                            sx={{
                              bgcolor: 'rgba(25, 118, 210, 0.08)',
                              borderColor: 'rgba(25, 118, 210, 0.25)',
                              color: 'primary.main'
                            }}
                          />
                        ))
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2.5 }}>
                    {formatPrice(product.purchase_price)}
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2.5 }}>
                    <Typography fontWeight="bold">
                      {formatPrice(product.sale_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2.5 }}>
                    {product.iva_rate}%
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2.5 }}>
                    {product.type === 'PRODUCT' && (
                      <StockBadge quantity={stockData[product.id] || 0} />
                    )}
                  </TableCell>
                  <TableCell align="center" sx={{ py: 2.5 }}>
                    <Stack direction="row" spacing={1} justifyContent="center">
                      <TableActionIconButton
                        kind="edit"
                        onClick={() => handleEdit(product.id)}
                        ariaLabel={`Editar producto ${product.name}`}
                      />
                      {product.type === 'PRODUCT' && (
                        <TableActionIconButton
                          kind="stock"
                          onClick={() => handleViewStock(product.id)}
                          ariaLabel={`Ver stock de ${product.name}`}
                        />
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </PageLayout>
  )
}

export default ProductList
