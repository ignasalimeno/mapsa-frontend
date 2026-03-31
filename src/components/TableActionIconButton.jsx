import { IconButton, Tooltip } from '@mui/material'
import {
  ArrowUpward as ArrowUpwardIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Inventory as InventoryIcon,
  Build as BuildIcon,
  Percent as PercentIcon,
} from '@mui/icons-material'

const STYLE_BY_KIND = {
  access: {
    backgroundColor: 'primary.main',
    hoverColor: 'primary.dark',
    title: 'Acceder',
    icon: ArrowUpwardIcon,
  },
  delete: {
    backgroundColor: 'error.main',
    hoverColor: 'error.dark',
    title: 'Eliminar',
    icon: DeleteIcon,
  },
  edit: {
    backgroundColor: 'info.main',
    hoverColor: 'info.dark',
    title: 'Editar',
    icon: EditIcon,
  },
  stock: {
    backgroundColor: 'secondary.main',
    hoverColor: 'secondary.dark',
    title: 'Stock',
    icon: InventoryIcon,
  },
  workorder: {
    backgroundColor: 'warning.main',
    hoverColor: 'warning.dark',
    title: 'Nuevo remito',
    icon: BuildIcon,
  },
  percent: {
    backgroundColor: 'warning.main',
    hoverColor: 'warning.dark',
    title: 'Actualizar porcentajes',
    icon: PercentIcon,
  },
}

function TableActionIconButton({
  kind = 'access',
  onClick,
  ariaLabel,
  title,
  disabled = false,
}) {
  const config = STYLE_BY_KIND[kind] || STYLE_BY_KIND.access
  const Icon = config.icon

  return (
    <Tooltip title={title || config.title}>
      <span>
        <IconButton
          onClick={onClick}
          aria-label={ariaLabel || config.title}
          size="small"
          disabled={disabled}
          sx={{
            width: 32,
            height: 32,
            backgroundColor: config.backgroundColor,
            color: 'common.white',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: config.hoverColor,
            },
            '&.Mui-disabled': {
              backgroundColor: 'action.disabledBackground',
              color: 'action.disabled',
            },
          }}
        >
          <Icon fontSize="small" />
        </IconButton>
      </span>
    </Tooltip>
  )
}

export default TableActionIconButton
