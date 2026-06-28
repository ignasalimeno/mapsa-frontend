import { useEffect, useState } from 'react'
import {
  Button,
  Alert,
  Chip,
  Stack
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { categoryService } from '../services/api'
import ExcelTable from '../components/ExcelTable'
import CategoryFormModal from '../components/CategoryFormModal'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import { useConfirm, useNotify } from '../context'

function CategoryList() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editCategoryId, setEditCategoryId] = useState(null)

  const confirm = useConfirm()
  const { error: notifyError, success: notifySuccess } = useNotify()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryService.getAll()
      setCategories(response.data)
    } catch (err) {
      setError('Error al cargar categorías')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    setEditCategoryId(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (id) => {
    setEditCategoryId(id)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditCategoryId(null)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: 'Eliminar categoría',
      message: 'Vas a eliminar esta categoría. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar',
      confirmColor: 'error',
    })
    if (!confirmed) return
    try {
      await categoryService.delete(id)
      await loadCategories()
      notifySuccess('Categoría eliminada correctamente')
    } catch (err) {
      setError('Error al eliminar categoría')
      notifyError('No se pudo eliminar la categoría')
    }
  }

  const getSortableValue = (cat, field) => {
    switch (field) {
      case 'name':
        return cat.name || ''
      case 'description':
        return cat.description || ''
      default:
        return cat[field] ?? ''
    }
  }

  const columns = [
    { id: 'name', label: 'Categoría' },
    { id: 'description', label: 'Descripción' },
    {
      id: 'children',
      label: 'Subcategorías',
      sortable: false,
      render: (row) => (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {row.children && row.children.length > 0 ? (
            row.children.map(sub => (
              <Chip
                key={sub.id}
                label={sub.name}
                size="small"
                variant="outlined"
                sx={{ bgcolor: 'rgba(25, 118, 210, 0.08)', borderColor: 'rgba(25, 118, 210, 0.25)', color: 'primary.main' }}
              />
            ))
          ) : (
            <span>-</span>
          )}
        </Stack>
      ),
    },
  ]

  const renderActions = (row) => (
    <>
      <TableActionIconButton
        kind="edit"
        onClick={() => handleOpenEdit(row.id)}
        ariaLabel={`Editar categoría ${row.name}`}
      />
      <span style={{ display: 'inline-block', width: 8 }} />
      <TableActionIconButton
        kind="delete"
        onClick={() => handleDelete(row.id)}
        ariaLabel={`Eliminar categoría ${row.name}`}
      />
    </>
  )

  return (
    <PageLayout
      title="Categorías"
      subtitle={`${categories.length} categoría${categories.length !== 1 ? 's' : ''}`}
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenNew}
        >
          Nueva Categoría
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando categorías..." />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <ExcelTable
        columns={columns}
        data={categories}
        defaultSort="name"
        actions={renderActions}
        emptyMessage="No hay categorías"
        footer={false}
      />

      <CategoryFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={loadCategories}
        categoryId={editCategoryId}
      />
    </PageLayout>
  )
}

export default CategoryList
