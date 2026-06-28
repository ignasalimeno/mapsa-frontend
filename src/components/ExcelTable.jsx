import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Typography,
  Box
} from '@mui/material'

const CELL_BORDER = '1px solid #d4d4d4'

const cellPadding = { py: 0.375, px: 1 }

function ExcelTable({
  columns,
  data,
  defaultSort,
  defaultOrder = 'asc',
  maxHeight = 'calc(100vh - 320px)',
  onRowClick,
  actions,
  footer,
  emptyMessage = 'No se encontraron registros',
  dense = true,
}) {
  const [order, setOrder] = useState(defaultOrder)
  const [orderBy, setOrderBy] = useState(defaultSort || (columns[0]?.id))

  const handleRequestSort = (field) => {
    const isAsc = orderBy === field && order === 'asc'
    setOrder(isAsc ? 'desc' : 'asc')
    setOrderBy(field)
  }

  const getSortableValue = (row, field) => {
    const col = columns.find(c => c.id === field)
    if (col?.sortValue) return col.sortValue(row)
    const val = row[field]
    return val ?? ''
  }

  const sortedData = [...data].sort((left, right) => {
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

  const totalCols = columns.length + (actions ? 1 : 0)

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          maxHeight,
          borderRadius: 0,
          border: CELL_BORDER,
        }}
      >
        <Table stickyHeader size="small" sx={{ borderCollapse: 'collapse' }}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align || 'left'}
                  sortDirection={orderBy === column.id ? order : false}
                  sx={{
                    ...cellPadding,
                    border: CELL_BORDER,
                    fontWeight: 700,
                    backgroundColor: '#f0f0f0',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#444',
                    width: column.width,
                    lineHeight: 1.2,
                  }}
                >
                  {column.sortable !== false ? (
                    <TableSortLabel
                      active={orderBy === column.id}
                      direction={orderBy === column.id ? order : 'asc'}
                      onClick={() => handleRequestSort(column.id)}
                      sx={{
                        '&.Mui-active': { color: '#333', fontWeight: 700 },
                        '& .MuiTableSortLabel-icon': { opacity: 0.4, fontSize: '1rem' },
                      }}
                    >
                      {column.label}
                    </TableSortLabel>
                  ) : (
                    column.label
                  )}
                </TableCell>
              ))}
              {actions && (
                <TableCell
                  align="center"
                  sx={{
                    ...cellPadding,
                    border: CELL_BORDER,
                    fontWeight: 700,
                    backgroundColor: '#f0f0f0',
                    fontSize: '0.6875rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#444',
                    width: 110,
                    lineHeight: 1.2,
                  }}
                >
                  Acciones
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={totalCols} align="center" sx={{ ...cellPadding, border: CELL_BORDER, py: 4 }}>
                  <Typography color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, index) => (
                <TableRow
                  key={row.id || index}
                  onClick={() => onRowClick?.(row)}
                  sx={{
                    cursor: onRowClick ? 'pointer' : undefined,
                    '&:nth-of-type(even)': { backgroundColor: '#f7f7f7' },
                    '&:hover': { backgroundColor: '#e3ecf7' },
                  }}
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      sx={{
                        ...cellPadding,
                        border: CELL_BORDER,
                        fontSize: column.id === 'rownum' ? '0.6875rem' : column.mono ? '0.75rem' : '0.8125rem',
                        fontFamily: column.mono ? '"Consolas", "Courier New", monospace' : undefined,
                        fontVariantNumeric: column.align === 'right' ? 'tabular-nums' : undefined,
                        color: column.id === 'rownum' ? '#aaa' : undefined,
                        lineHeight: 1.3,
                      }}
                    >
                      {column.render ? column.render(row) : (row[column.id] ?? '-')}
                    </TableCell>
                  ))}
                  {actions && (
                    <TableCell align="center" sx={{ ...cellPadding, border: CELL_BORDER }}>
                      {typeof actions === 'function' ? actions(row) : actions}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {footer !== false && (
        <Paper
          sx={{
            borderTop: 'none',
            border: CELL_BORDER,
            px: 2,
            py: 0.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f0f0f0',
            borderRadius: 0,
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', color: '#555', fontWeight: 500 }}>
            {typeof footer === 'string' ? footer : `${data.length} registro${data.length !== 1 ? 's' : ''}`}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
            MAPSA
          </Typography>
        </Paper>
      )}
    </>
  )
}

export default ExcelTable
