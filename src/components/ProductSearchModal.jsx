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
} from '@mui/material'
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material'
import { StyledDialog } from '.'
import { formatCurrency } from '../utils/formatters'

function ProductSearchModal({ open, onClose, items, tags, onAddItem }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)

  const filteredItems = useMemo(() => {
    let result = items
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(item =>
        item.name.toLowerCase().includes(term) ||
        (item.code || '').toLowerCase().includes(term)
      )
    }
    if (selectedTag) {
      result = result.filter(item =>
        (item.tags || []).some(t => Number(t.id) === Number(selectedTag))
      )
    }
    return result
  }, [items, searchTerm, selectedTag])

  const handleClose = () => {
    setSearchTerm('')
    setSelectedTag(null)
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
        <Chip
          label="Todas"
          variant={selectedTag === null ? 'filled' : 'outlined'}
          color="primary"
          onClick={() => setSelectedTag(null)}
        />
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.name}
            variant={selectedTag === tag.id ? 'filled' : 'outlined'}
            color="primary"
            onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
          />
        ))}
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.50' }}>
              <TableCell sx={{ fontWeight: 600 }}>Producto</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Código</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tipo</TableCell>
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
                    {searchTerm || selectedTag
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
                    {item.tags && item.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                        {item.tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            variant="outlined"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        ))}
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{item.code || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={item.type === 'service' ? 'Servicio' : 'Producto'}
                      color={item.type === 'service' ? 'secondary' : 'info'}
                      size="small"
                      variant="outlined"
                    />
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
