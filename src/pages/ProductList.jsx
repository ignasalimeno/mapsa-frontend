import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
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
import { PageLayout, ExcelTable, TableActionIconButton } from '../components'

function ProductList() {
  const [products, setProducts] = useState([])
  const [stockData, setStockData] = useState({})
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
  }

  const columns = [
    { id: 'code', label: 'Código', mono: true },
    {
      id: 'name',
      label: 'Nombre',
      sortValue: (row) => row.name || '',
      render: (row) => (
        <Box>
          <Box sx={{ fontWeight: 500 }}>{row.name}</Box>
          {row.description && (
            <Box sx={{ fontSize: '0.6875rem', color: 'text.secondary', lineHeight: 1.2 }}>
              {row.description}
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Categoría',
      sortValue: (row) => getCategoryPath(row) || '',
      render: (row) => {
        const path = getCategoryPath(row)
        return path || <Box component="span" sx={{ color: 'text.secondary' }}>-</Box>
      },
    },
    { id: 'purchase_price', label: 'Costo', align: 'right', mono: true, sortValue: (row) => Number(row.purchase_price || 0), render: (row) => formatPrice(row.purchase_price) },
    {
      id: 'sale_price',
      label: 'Precio',
      align: 'right',
      mono: true,
      sortValue: (row) => Number(row.sale_price || 0),
      render: (row) => <Box sx={{ fontWeight: 600, fontSize: 'inherit' }}>{formatPrice(row.sale_price)}</Box>,
    },
    { id: 'iva_rate', label: 'IVA', align: 'center', sortValue: (row) => Number(row.iva_rate || 0), render: (row) => `${row.iva_rate}%` },
    {
      id: 'stock',
      label: 'Stock',
      align: 'center',
      sortValue: (row) => Number(stockData[row.id] || 0),
      render: (row) => <StockBadge quantity={stockData[row.id] || 0} />,
    },
  ]

  const actions = (row) => (
    <Stack direction="row" spacing={0.25} justifyContent="center">
      <TableActionIconButton
        kind="edit"
        onClick={() => handleOpenEdit(row.id)}
        ariaLabel={`Editar producto ${row.name}`}
      />
      <TableActionIconButton
        kind="stock"
        onClick={() => handleViewStock(row.id)}
        ariaLabel={`Ver stock de ${row.name}`}
      />
    </Stack>
  )

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

      <ExcelTable
        columns={columns}
        data={filteredProducts}
        actions={actions}
      />

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
