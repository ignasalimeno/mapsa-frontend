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
  Alert
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { tagService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import TagChip from '../components/TagChip'
import { useConfirm, useNotify } from '../context'

function TagList() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [order, setOrder] = useState('asc')
  const [orderBy, setOrderBy] = useState('name')

  const navigate = useNavigate()
  const confirm = useConfirm()
  const { error: notifyError, success: notifySuccess } = useNotify()

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
    const confirmed = await confirm({
      title: 'Eliminar tag',
      message: 'Vas a eliminar este tag. Esta accion no se puede deshacer.',
      confirmLabel: 'Eliminar',
      confirmColor: 'error',
    })
    if (!confirmed) return
    try {
      await tagService.delete(id)
      await loadTags()
      notifySuccess('Tag eliminado correctamente')
    } catch (err) {
      setError('Error al eliminar tag')
      notifyError('No se pudo eliminar el tag')
    }
  }

  const getSortableValue = (tag, field) => {
    switch (field) {
      case 'name':
        return tag.name || ''
      case 'description':
        return tag.description || ''
      default:
        return tag[field] ?? ''
    }
  }

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const sortedTags = [...tags].sort((left, right) => {
    const leftValue = getSortableValue(left, orderBy)
    const rightValue = getSortableValue(right, orderBy)

    const comparison = String(leftValue).localeCompare(String(rightValue), 'es', {
      numeric: true,
      sensitivity: 'base',
    })

    return order === 'asc' ? comparison : -comparison
  })

  const sortableColumns = [
    { id: 'name', label: 'Tag' },
    { id: 'description', label: 'Descripción' },
  ]

  return (
    <PageLayout
      title="Tags"
      subtitle={`${tags.length} tag${tags.length !== 1 ? 's' : ''}`}
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/tags/new')}
        >
          Nuevo Tag
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando tags..." />

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
                {sortedTags.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">No hay tags</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTags.map((tag, index) => (
                    <TableRow
                      key={tag.id}
                      sx={{
                        '&:hover': { backgroundColor: 'grey.50' },
                        borderBottom: index === sortedTags.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 2.5 }}>
                        <TagChip tag={tag} />
                      </TableCell>
                      <TableCell sx={{ py: 2.5 }}>{tag.description || '-'}</TableCell>
                      <TableCell align="center" sx={{ py: 2.5 }}>
                        <TableActionIconButton
                          kind="edit"
                          onClick={() => navigate(`/tags/edit/${tag.id}`)}
                          ariaLabel={`Editar tag ${tag.name}`}
                        />
                        <span style={{ display: 'inline-block', width: 8 }} />
                        <TableActionIconButton
                          kind="delete"
                          onClick={() => handleDelete(tag.id)}
                          ariaLabel={`Eliminar tag ${tag.name}`}
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

export default TagList
