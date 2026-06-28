import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Button,
  Alert,
  Chip,
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'
import { warehouseService } from '../services/api'
import { LoadingOverlay, PageLayout, TableActionIconButton } from '../components'
import ExcelTable from '../components/ExcelTable'
import WarehouseFormModal from '../components/WarehouseFormModal'
import { useConfirm, useNotify } from '../context'

function WarehouseList() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editWarehouseId, setEditWarehouseId] = useState(null)
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

  const handleOpenNew = () => {
    setEditWarehouseId(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (id) => {
    setEditWarehouseId(id)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditWarehouseId(null)
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

  const columns = [
    { id: 'name', label: 'Nombre', width: 200 },
    { id: 'description', label: 'Descripción', width: 300 },
    {
      id: 'is_active',
      label: 'Estado',
      align: 'center',
      width: 100,
      render: (row) => (
        <Chip
          label={row.is_active ? 'Activo' : 'Inactivo'}
          color={row.is_active ? 'success' : 'default'}
          size="small"
        />
      ),
    },
  ]

  const renderActions = (row) => (
    <>
      <TableActionIconButton
        kind="edit"
        onClick={() => handleOpenEdit(row.id)}
        ariaLabel={`Editar depósito ${row.name}`}
      />
      <span style={{ display: 'inline-block', width: 8 }} />
      <TableActionIconButton
        kind="delete"
        onClick={() => handleDelete(row.id)}
        ariaLabel={`Eliminar depósito ${row.name}`}
      />
      <span style={{ display: 'inline-block', width: 8 }} />
      <TableActionIconButton
        kind="stock"
        onClick={() => navigate(`/warehouses/${row.id}/stock`)}
        ariaLabel={`Ver stock de depósito ${row.name}`}
      />
    </>
  )

  return (
    <PageLayout
      title="Depósitos"
      subtitle={`${warehouses.length} depósito${warehouses.length !== 1 ? 's' : ''}`}
      actions={(
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenNew}
        >
          Nuevo Depósito
        </Button>
      )}
    >
      <LoadingOverlay open={loading} message="Cargando depósitos..." />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <ExcelTable
        columns={columns}
        data={warehouses}
        defaultSort="name"
        actions={renderActions}
      />

      <WarehouseFormModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={loadWarehouses}
        warehouseId={editWarehouseId}
      />
    </PageLayout>
  )
}

export default WarehouseList
