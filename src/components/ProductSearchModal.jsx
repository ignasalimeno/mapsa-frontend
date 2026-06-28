import { useState, useMemo } from 'react'
import {
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material'
import { StyledDialog } from '.'
import { formatCurrency } from '../utils/formatters'

function ProductSearchModal({ open, onClose, items, categories, onAddItem }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const filteredItems = useMemo(() => {
    let result = items
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.code || '').toLowerCase().includes(term)
      )
    }
    if (selectedCategory) {
      const catId = Number(selectedCategory)
      result = result.filter(item => {
        if (!item.category) return false
        const productCatId = Number(item.category.id)
        if (productCatId === catId) return true
        const cat = categories.find(c => Number(c.id) === catId)
        if (cat && cat.children) {
          return cat.children.some(sub => Number(sub.id) === productCatId)
        }
        return false
      })
    }
    return result
  }, [items, searchTerm, selectedCategory])

  const handleClose = () => {
    setSearchTerm('')
    setSelectedCategory('')
    onClose()
  }

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      title="Buscar productos"
      subtitle="Explorá y agregá productos o servicios al remito"
    >
      <TextField
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar por nombre o código..."
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Categoría</InputLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Producto</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Categoría</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Costo</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Precio Venta</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {searchTerm || selectedCategory
                      ? 'No se encontraron productos con esos filtros'
                      : 'No hay productos disponibles'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ '&:last-child td': { border: 0 } }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.code || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    {item.category && item.category.id ? (
                      <Chip
                        label={item.category.name}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem' }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatCurrency(item.purchase_price || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.sale_price || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => onAddItem(item)}
                      sx={{ px: 1.5, minWidth: 90 }}
                    >
                      Agregar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={handleClose} variant="outlined">
          Cerrar
        </Button>
      </Box>
    </StyledDialog>
  )
}

export default ProductSearchModal
