import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Card,
  CardContent,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Alert,
  Chip
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { warehouseService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import { useConfirm, useNotify } from '../context'

function WarehouseList() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('name')
  const navigate = useNavigate()
  const confirm = useConfirm()
  const { error: notifyError, success: notifySuccess } = useNotify()

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
    const confirmed = await confirm({
      title: 'Eliminar depósito',
      message: 'Vas a eliminar este depósito. Esta accion no se puede deshacer.',
      confirmLabel: 'Eliminar',
      confirmColor: 'error',
    })
    if (!confirmed) return
    try {
      await warehouseService.delete(id)
      await loadWarehouses()
      notifySuccess('Depósito eliminado correctamente')
    } catch (err) {
      setError('No se pudo eliminar el depósito')
      notifyError('No se pudo eliminar el depósito')
    }
  }

  const getSortableValue = (warehouse, field) => {
    switch (field) {
      case 'name':
        return warehouse.name || ''
      case 'description':
        return warehouse.description || ''
      case 'is_active':
        return warehouse.is_active ? 1 : 0
      default:
        return warehouse[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedWarehouses = [...warehouses].sort((left, right) => {
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
    { id: 'name', label: 'Nombre' },
    { id: 'description', label: 'Descripción' },
    { id: 'is_active', label: 'Estado', align: 'center' },
  ]

  return (
    <PageLayout
      title="Depósitos"
      subtitle={`${warehouses.length} depósito${warehouses.length !== 1 ? 's' : ''}`}
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/warehouses/new')}
        >
          Nuevo Depósito
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando depósitos..." />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 0 }}>
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
                {sortedWarehouses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No hay depósitos</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedWarehouses.map((wh, index) => (
                    <TableRow
                      key={wh.id}
                      sx={{
                        '&:hover': { backgroundColor: 'grey.50' },
                        borderBottom: index === sortedWarehouses.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>{wh.name}</TableCell>
                      <TableCell sx={{ py: 2.5 }}>{wh.description || '-'}</TableCell>
                      <TableCell align="center" sx={{ py: 2.5 }}>
                        <Chip
                          label={wh.is_active ? 'Activo' : 'Inactivo'}
                          color={wh.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center" sx={{ py: 2.5 }}>
                        <TableActionIconButton
                          kind="edit"
                          onClick={() => navigate(`/warehouses/edit/${wh.id}`)}
                          ariaLabel={`Editar depósito ${wh.name}`}
                        />
                        <span style={{ display: 'inline-block', width: 8 }} />
                        <TableActionIconButton
                          kind="delete"
                          onClick={() => handleDelete(wh.id)}
                          ariaLabel={`Eliminar depósito ${wh.name}`}
                        />
                        <span style={{ display: 'inline-block', width: 8 }} />
                        <TableActionIconButton
                          kind="stock"
                          onClick={() => navigate(`/warehouses/${wh.id}/stock`)}
                          ariaLabel={`Ver stock de depósito ${wh.name}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </PageLayout>
  )
}

export default WarehouseList
