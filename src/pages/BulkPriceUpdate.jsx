import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  Alert,
  Stack,
  IconButton,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material'
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  TrendingUp as UpdateIcon,
  Clear as ClearIcon
} from '@mui/icons-material'
import { itemService, tagService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import TagChip from '../components/TagChip'

function BulkPriceUpdate() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [tags, setTags] = useState([])
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterTags, setFilterTags] = useState([])

  // Dialog de actualización
  const [openDialog, setOpenDialog] = useState(false)
  const [updatePercentage, setUpdatePercentage] = useState('')
  const [priceType, setPriceType] = useState('both') // 'sale', 'purchase', 'both'
  const [updateType, setUpdateType] = useState('increase') // 'increase', 'decrease'

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [products, searchTerm, filterType, filterTags])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsRes, tagsRes] = await Promise.all([
        itemService.getAll(),
        tagService.getAll()
      ])
      setProducts(productsRes.data)
      setFilteredProducts(productsRes.data)
      setTags(tagsRes.data)
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...products]
    const selectedTagIds = filterTags.map((id) => Number(id))

    // Filtro de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(term) ||
        (p.code && p.code.toLowerCase().includes(term))
      )
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType)
    }

    // Filtro por tag
    // Filtro por tags (múltiples)
    if (filterTags.length > 0) {
      filtered = filtered.filter(p =>
        p.tags && p.tags.some(t => selectedTagIds.includes(Number(t.id)))
      )
    }

    setFilteredProducts(filtered)
  }

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = new Set(filteredProducts.map(p => p.id))
      setSelectedProducts(allIds)
    } else {
      setSelectedProducts(new Set())
    }
  }

  const handleSelectProduct = (productId) => {
    const newSelected = new Set(selectedProducts)
    if (newSelected.has(productId)) {
      newSelected.delete(productId)
    } else {
      newSelected.add(productId)
    }
    setSelectedProducts(newSelected)
  }

  const handleClearFilters = () => {
    setSearchTerm('')
    setFilterType('all')
    setFilterTags([])
    setSelectedProducts(new Set())
  }

  const handleOpenDialog = () => {
    if (selectedProducts.size === 0) {
      alert('Debe seleccionar al menos un producto')
      return
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setUpdatePercentage('')
    setPriceType('both')
    setUpdateType('increase')
  }

  const handleApplyUpdate = async () => {
    if (!updatePercentage || parseFloat(updatePercentage) === 0) {
      alert('Ingrese un porcentaje válido')
      return
    }

    try {
      setLoading(true)
      const percentage = parseFloat(updatePercentage)
      const itemIds = Array.from(selectedProducts)

      // Hacer un único llamado al backend para actualizar todos los precios
      await itemService.bulkUpdatePrices({
        item_ids: itemIds,
        percentage: percentage,
        price_type: priceType,
        update_type: updateType
      })

      alert(`Precios actualizados exitosamente para ${selectedProducts.size} productos`)
      handleCloseDialog()
      setSelectedProducts(new Set())
      await loadData()
    } catch (error) {
      console.error('Error actualizando precios:', error)
      alert('Error al actualizar los precios')
    } finally {
      setLoading(false)
    }
  }

  const selectedCount = selectedProducts.size
  const allSelected = filteredProducts.length > 0 && selectedProducts.size === filteredProducts.length

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Procesando..." />

      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <Button
            startIcon={<BackIcon />}
            onClick={() => navigate('/products')}
            variant="outlined"
          >
            Volver
          </Button>
          <Typography variant="h5" fontWeight="bold">
            Actualización Masiva de Precios
          </Typography>
        </Box>

        {selectedCount > 0 && (
          <Button
            startIcon={<UpdateIcon />}
            onClick={handleOpenDialog}
            variant="contained"
            color="primary"
            size="large"
          >
            Actualizar {selectedCount} producto{selectedCount !== 1 ? 's' : ''}
          </Button>
        )}
      </Box>

      {/* Info alert */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Seleccione los productos que desea actualizar usando los filtros o checkboxes, 
        luego haga clic en "Actualizar" para aplicar un ajuste porcentual a sus precios.
      </Alert>

      {/* Filtros */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar"
              placeholder="Nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Tipo"
              >
                <MenuItem value="all">Todos</MenuItem>
                <MenuItem value="PRODUCT">Producto</MenuItem>
                <MenuItem value="SERVICE">Servicio</MenuItem>
                <MenuItem value="EXTRA_CHARGE">Gasto Extra</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={filterTags}
                onChange={(e) => setFilterTags(e.target.value)}
                label="Tags"
                renderValue={() => (
                  filterTags.length > 0
                    ? `${filterTags.length} tag${filterTags.length !== 1 ? 's' : ''} seleccionado${filterTags.length !== 1 ? 's' : ''}`
                    : 'Seleccionar tags'
                )}
              >
                {tags.map((tag) => (
                  <MenuItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              variant="outlined"
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>

        {filterTags.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Tags seleccionados:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {filterTags.map((tagId) => {
                const tag = tags.find((currentTag) => currentTag.id === tagId)
                return (
                  <Chip
                    key={tagId}
                    label={tag?.name}
                    onDelete={() => setFilterTags(filterTags.filter((id) => id !== tagId))}
                    color="primary"
                    variant="outlined"
                  />
                )
              })}
            </Box>
          </Box>
        )}

        {selectedCount > 0 && (
          <Box mt={2}>
            <Chip
              label={`${selectedCount} producto${selectedCount !== 1 ? 's' : ''} seleccionado${selectedCount !== 1 ? 's' : ''}`}
              color="primary"
              onDelete={() => setSelectedProducts(new Set())}
            />
          </Box>
        )}
      </Paper>

      {/* Tabla de productos */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={selectedCount > 0 && selectedCount < filteredProducts.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Código</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell align="right">Precio Costo</TableCell>
              <TableCell align="right">Precio Venta</TableCell>
              <TableCell align="right">IVA</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="text.secondary">
                    No se encontraron productos
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow
                  key={product.id}
                  hover
                  onClick={() => handleSelectProduct(product.id)}
                  sx={{ cursor: 'pointer' }}
                  selected={selectedProducts.has(product.id)}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                    />
                  </TableCell>
                  <TableCell>{product.code || '-'}</TableCell>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    {(() => {
                      const type = (product.type || '').toUpperCase()
                      const typeLabel = type === 'PRODUCT'
                        ? 'Producto'
                        : type === 'SERVICE'
                          ? 'Servicio'
                          : type === 'EXTRA_CHARGE'
                            ? 'Gasto Extra'
                            : product.type

                      const typeColor = type === 'PRODUCT'
                        ? 'primary'
                        : type === 'SERVICE'
                          ? 'secondary'
                          : 'warning'

                      return (
                    <Chip
                      label={typeLabel}
                      size="small"
                      color={typeColor}
                    />
                      )
                    })()}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {product.tags && product.tags.map(tag => (
                        <TagChip key={tag.id} tag={tag} size="small" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    ${product.purchase_price?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell align="right">
                    ${product.sale_price?.toFixed(2) || '0.00'}
                  </TableCell>
                  <TableCell align="right">{product.iva_rate}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog de actualización */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Actualizar Precios
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Se actualizarán los precios de {selectedCount} producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}.
            </Typography>

            <FormControl component="fieldset" sx={{ mt: 3, width: '100%' }}>
              <FormLabel component="legend">Tipo de actualización</FormLabel>
              <RadioGroup
                value={updateType}
                onChange={(e) => setUpdateType(e.target.value)}
              >
                <FormControlLabel 
                  value="increase" 
                  control={<Radio />} 
                  label="Aumentar precios" 
                />
                <FormControlLabel 
                  value="decrease" 
                  control={<Radio />} 
                  label="Disminuir precios" 
                />
              </RadioGroup>
            </FormControl>

            <TextField
              fullWidth
              label="Porcentaje"
              type="number"
              value={updatePercentage}
              onChange={(e) => setUpdatePercentage(e.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>
              }}
              sx={{ mt: 2 }}
              helperText={`Ejemplo: ingrese 10 para ${updateType === 'increase' ? 'aumentar' : 'disminuir'} un 10%`}
            />

            <FormControl component="fieldset" sx={{ mt: 3, width: '100%' }}>
              <FormLabel component="legend">Aplicar a</FormLabel>
              <RadioGroup
                value={priceType}
                onChange={(e) => setPriceType(e.target.value)}
              >
                <FormControlLabel 
                  value="both" 
                  control={<Radio />} 
                  label="Precio de venta y costo" 
                />
                <FormControlLabel 
                  value="sale" 
                  control={<Radio />} 
                  label="Solo precio de venta" 
                />
                <FormControlLabel 
                  value="purchase" 
                  control={<Radio />} 
                  label="Solo precio de costo" 
                />
              </RadioGroup>
            </FormControl>

            {updatePercentage && (
              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight="bold">
                  Vista previa del cambio:
                </Typography>
                <Typography variant="body2">
                  Un producto con precio ${priceType === 'purchase' ? 'de costo' : 'de venta'} de $100 
                  {updateType === 'increase' ? ' aumentará' : ' disminuirá'} a $
                  {updateType === 'increase' 
                    ? (100 * (1 + parseFloat(updatePercentage || 0) / 100)).toFixed(2)
                    : (100 * (1 - parseFloat(updatePercentage || 0) / 100)).toFixed(2)
                  }
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button 
            onClick={handleApplyUpdate} 
            variant="contained" 
            color="primary"
            disabled={!updatePercentage || parseFloat(updatePercentage) === 0}
          >
            Aplicar Actualización
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default BulkPriceUpdate
