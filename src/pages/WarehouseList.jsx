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
  Alert,
  Chip
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import { warehouseService } from '../services/api'
import LoadingOverlay from '../components/LoadingOverlay'

function WarehouseList() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadWarehouses()
  }, [])

  const loadWarehouses = async () => {
    try {
      setLoading(true)
      const response = await warehouseService.getAll()
      setWarehouses(response.data)
    } catch (err) {
      setError('Error al cargar depósitos')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este depósito?')) return
    try {
      await warehouseService.delete(id)
      loadWarehouses()
    } catch (err) {
      setError('No se pudo eliminar el depósito')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <LoadingOverlay open={loading} message="Cargando depósitos..." />

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight="bold">Depósitos</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/warehouses/new')}
        >
          Nuevo Depósito
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.100' }}>
              <TableCell><strong>Nombre</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell align="center"><strong>Estado</strong></TableCell>
              <TableCell align="center"><strong>Acciones</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {warehouses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No hay depósitos</Typography>
                </TableCell>
              </TableRow>
            ) : (
              warehouses.map(wh => (
                <TableRow key={wh.id} hover>
                  <TableCell>{wh.name}</TableCell>
                  <TableCell>{wh.description || '-'}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={wh.is_active ? 'Activo' : 'Inactivo'}
                      color={wh.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary" onClick={() => navigate(`/warehouses/edit/${wh.id}`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(wh.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <Button size="small" onClick={() => navigate(`/warehouses/${wh.id}/stock`)}>
                      Stock
                    </Button>
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

export default WarehouseList
