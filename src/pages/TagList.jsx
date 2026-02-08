import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Percent as PercentIcon } from '@mui/icons-material'
import { tagService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'
import TagChip from '../components/TagChip'

function TagList() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [selectedTag, setSelectedTag] = useState(null)
  const [percentage, setPercentage] = useState(0)
  const [applyTo, setApplyTo] = useState('sale')

  const navigate = useNavigate()

  useEffect(() => {
    loadTags()
  }, [])

  const loadTags = async () => {
    try {
      setLoading(true)
      const response = await tagService.getAll()
      setTags(response.data)
    } catch (err) {
      setError('Error al cargar tags')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este tag?')) return
    try {
      await tagService.delete(id)
      loadTags()
    } catch (err) {
      setError('Error al eliminar tag')
    }
  }

  const openBulk = (tag) => {
    setSelectedTag(tag)
    setPercentage(0)
    setApplyTo('sale')
    setBulkOpen(true)
  }

  const handleBulkUpdate = async () => {
    try {
      await tagService.bulkUpdatePrices(selectedTag.id, {
        percentage: Number(percentage),
        apply_to: applyTo
      })
      setBulkOpen(false)
    } catch (err) {
      setError('Error al actualizar precios')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando tags..." />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Tags</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tags/new')}
        >
          Nuevo Tag
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Tag</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No hay tags</Typography>
                </TableCell>
              </TableRow>
            ) : (
              tags.map(tag => (
                <TableRow key={tag.id} hover>
                  <TableCell>
                    <TagChip tag={tag} />
                  </TableCell>
                  <TableCell>{tag.description || '-'}</TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => navigate(`/tags/edit/${tag.id}`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="secondary" onClick={() => openBulk(tag)}>
                      <PercentIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(tag.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={bulkOpen} onClose={() => setBulkOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Actualizar precios por tag</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Tag seleccionado: {selectedTag?.name}
          </Typography>
          <TextField
            fullWidth
            label="Porcentaje"
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            select
            label="Aplicar a"
            value={applyTo}
            onChange={(e) => setApplyTo(e.target.value)}
          >
            <MenuItem value="sale">Precio de venta</MenuItem>
            <MenuItem value="purchase">Precio de compra</MenuItem>
            <MenuItem value="both">Ambos</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleBulkUpdate}>Aplicar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default TagList
