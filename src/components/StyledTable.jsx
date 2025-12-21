import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Box,
  Typography,
  Button
} from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

function StyledTable({ 
  columns, 
  data, 
  emptyMessage = "No hay datos disponibles",
  emptyAction,
  emptyActionLabel = "Agregar elemento"
}) {
  if (data.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {emptyMessage}
        </Typography>
        {emptyAction && (
          <>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Comienza agregando el primer elemento
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={emptyAction}
            >
              {emptyActionLabel}
            </Button>
          </>
        )}
      </Box>
    )
  }

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            {columns.map((column, index) => (
              <TableCell 
                key={index}
                align={column.align || 'left'}
                sx={{ fontWeight: 600, py: 2 }}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              sx={{
                '&:hover': { backgroundColor: 'grey.50' },
                borderBottom: rowIndex === data.length - 1 ? 'none' : '1px solid #e2e8f0'
              }}
            >
              {columns.map((column, colIndex) => (
                <TableCell 
                  key={colIndex}
                  align={column.align || 'left'}
                  sx={{ py: 2.5 }}
                >
                  {column.render ? column.render(row, rowIndex) : row[column.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

export default StyledTable