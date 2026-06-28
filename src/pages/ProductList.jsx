import { useState, useEffect, useCallback } from 'react'
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
  Typography,
  InputAdornment,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon
} from '@mui/icons-material'
import { itemService, stockService, categoryService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import StockBadge from '../components/StockBadge'
import ProductFormModal from '../components/ProductFormModal'
import { PageLayout, TableActionIconButton } from '../components'

const CELL_BORDER = '1px solid #d4d4d4'

function ProductList() {
  const [products, setProducts] = useState([])
  const [stockData, setStockData] = useState({})
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('name')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProductId, setEditProductId] = useState(null)
  const navigate = useNavigate()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)

      const [productsRes, stockRes, catRes] = await Promise.all([
        itemService.getAll(),
        stockService.getTotal(),
        categoryService.getAll()
      ])

      setProducts(productsRes.data)
      setCategories(catRes.data)

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
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleOpenNew = () => {
    setEditProductId(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (id) => {
    setEditProductId(id)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditProductId(null)
  }

  const handleSaved = () => {
    loadData()
  }

  const handleViewStock = (id) => {
    navigate(`/products/${id}/stock`)
  }

  const getCategoryPath = (product) => {
    if (!product.category || !product.category.id) return null
    const cat = product.category
    if (cat.parent_id) {
      const parent = categories.find(c => Number(c.id) === Number(cat.parent_id))
      if (parent) return `${parent.name} > ${cat.name}`
      return cat.name
    }
    return cat.name
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase()))
    if (!filterCategory) return matchesSearch
    const catId = product.category ? product.category.id : null
    return matchesSearch && (
      Number(catId) === Number(filterCategory) ||
      categories.some(c => Number(c.id) === Number(filterCategory) && c.children && c.children.some(sub => Number(sub.id) === Number(catId)))
    )
  })

  const getSortableValue = (product, field) => {
    switch (field) {
      case 'code':
        return product.code || ''
      case 'name':
        return product.name || ''
      case 'category':
        return getCategoryPath(product) || ''
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

  const columns = [
    { id: 'rownum', label: '#', width: 46, align: 'center' },
    { id: 'code', label: 'Código', width: 120 },
    { id: 'name', label: 'Nombre' },
    { id: 'category', label: 'Categoría', width: 170 },
    { id: 'purchase_price', label: 'Costo', width: 120, align: 'right' },
    { id: 'sale_price', label: 'Precio', width: 120, align: 'right' },
    { id: 'iva_rate', label: 'IVA', width: 65, align: 'center' },
    { id: 'stock', label: 'Stock', width: 75, align: 'center' },
    { id: 'actions', label: 'Acciones', width: 110, align: 'center' },
  ]

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const cellPadding = { py: 0.375, px: 1 }

  return (
    <PageLayout
      title="Productos"
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenNew}
          size="large"
        >
          Nuevo Producto
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando productos..." />

      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ pb: '16px !important' }}>
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
              size="small"
            />

            <FormControl sx={{ minWidth: 250 }} size="small">
              <InputLabel>Categoría</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Categoría"
              >
                <MenuItem value="">Todas</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <TableContainer
        component={Paper}
        sx={{
          maxHeight: 'calc(100vh - 320px)',
          borderRadius: 0,
          border: CELL_BORDER,
        }}
      >
        <Table stickyHeader size="small" sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{
                    ...cellPadding,
                    border: CELL_BORDER,
                    fontWeight: 700,
                    backgroundColor: '#f0f0f0',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#444',
                    width: column.width,
                    lineHeight: 1.2,
                  }}
                >
                  {column.id === 'rownum' || column.id === 'actions' ? (
                    column.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      sx={{
                        '&.Mui-active': { color: '#333', fontWeight: 700 },
                        '& .MuiTableSortLabel-icon': { opacity: 0.4, fontSize: '1rem' },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ ...cellPadding, border: CELL_BORDER, py: 4 }}>
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
                    '&:nth-of-type(even)': { backgroundColor: '#f7f7f7' },
                    '&:hover': { backgroundColor: '#e3ecf7' },
                  }}
                >
                  <TableCell align="center" sx={{ ...cellPadding, border: CELL_BORDER, color: '#aaa', fontSize: '0.6875rem' }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ ...cellPadding, border: CELL_BORDER, fontFamily: '"Consolas", "Courier New", monospace', fontSize: '0.75rem' }}>
                    {product.code || '-'}
                  </TableCell>
                  <TableCell sx={{ ...cellPadding, border: CELL_BORDER }}>
                    <Typography sx={{ fontWeight: 500, fontSize: '0.8125rem', lineHeight: 1.3 }}>
                      {product.name}
                    </Typography>
                    {product.description && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6875rem', lineHeight: 1.2, display: 'block' }}>
                        {product.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ ...cellPadding, border: CELL_BORDER, fontSize: '0.75rem' }}>
                    {product.category && product.category.id
                      ? getCategoryPath(product)
                      : <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>-</Typography>
                    }
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellPadding, border: CELL_BORDER, fontVariantNumeric: 'tabular-nums', fontSize: '0.75rem' }}>
                    {formatPrice(product.purchase_price)}
                  </TableCell>
                  <TableCell align="right" sx={{ ...cellPadding, border: CELL_BORDER, fontVariantNumeric: 'tabular-nums' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                      {formatPrice(product.sale_price)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ ...cellPadding, border: CELL_BORDER, fontSize: '0.75rem' }}>
                    {product.iva_rate}%
                  </TableCell>
                  <TableCell align="center" sx={{ ...cellPadding, border: CELL_BORDER }}>
                    <StockBadge quantity={stockData[product.id] || 0} />
                  </TableCell>
                  <TableCell align="center" sx={{ ...cellPadding, border: CELL_BORDER }}>
                    <Stack direction="row" spacing={0.25} justifyContent="center">
                      <TableActionIconButton
                        kind="edit"
                        onClick={() => handleOpenEdit(product.id)}
                        ariaLabel={`Editar producto ${product.name}`}
                      />
                      <TableActionIconButton
                        kind="stock"
                        onClick={() => handleViewStock(product.id)}
                        ariaLabel={`Ver stock de ${product.name}`}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper
        sx={{
          borderTop: 'none',
          border: CELL_BORDER,
          px: 2,
          py: 0.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f0f0f0',
          borderRadius: 0,
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', color: '#555', fontWeight: 500 }}>
          {filteredProducts.length} registro{filteredProducts.length !== 1 ? 's' : ''}
          {products.length !== filteredProducts.length && ` (${products.length} totales)`}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
          MAPSA
        </Typography>
      </Paper>

      <ProductFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={handleSaved}
        productId={editProductId}
      />
    </PageLayout>
  )
}

export default ProductList
