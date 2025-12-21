import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { PageLayout } from '../components';
import { itemService } from '../services/api';
import { formatCurrency } from '../utils/formatters';

// Avoid timezone shifts: format YYYY-MM-DD as DD/MM/YYYY without Date()
const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

function ItemAnalysis() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [usage, setUsage] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [withdrawalDialog, setWithdrawalDialog] = useState(false);
  const [withdrawalForm, setWithdrawalForm] = useState({
    withdrawal_date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      loadUsage();
    }
  }, [selectedItem, startDate, endDate]);

  const loadItems = async () => {
    try {
      const response = await itemService.getAll();
      setItems(response.data);
    } catch (err) {
      console.error('Error loading items:', err);
      setError('Error al cargar items');
    }
  };

  const loadUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await itemService.getUsage(selectedItem, startDate, endDate);
      setUsage(response.data);
    } catch (err) {
      console.error('Error loading usage:', err);
      setError('Error al cargar datos de uso');
    } finally {
      setLoading(false);
    }
  };

    const handleCreateWithdrawal = async () => {
      try {
        setLoading(true);
        await itemService.createWithdrawal(selectedItem, withdrawalForm);
        setWithdrawalDialog(false);
        setWithdrawalForm({
          withdrawal_date: new Date().toISOString().split('T')[0],
          amount: '',
          description: ''
        });
        await loadUsage();
      } catch (err) {
        console.error('Error creating withdrawal:', err);
        setError('Error al crear retiro');
      } finally {
        setLoading(false);
      }
    };
  // Calculate running total and weekly sums
  const enrichedData = () => {
    let runningTotal = 0;
    const weeklyTotals = {};
    
    // First pass: calculate weekly totals
      usage.filter(row => row.type === 'usage').forEach(row => {
      const weekKey = `${row.year}-W${row.week_number}`;
      weeklyTotals[weekKey] = (weeklyTotals[weekKey] || 0) + row.total;
    });
    
    // Second pass: enrich with accumulated and weekly sum
    const enriched = usage.map(row => {
      runningTotal += row.total;
      const weekKey = `${row.year}-W${row.week_number}`;
      
      return {
        ...row,
        accumulated: runningTotal,
        weekly_sum: weeklyTotals[weekKey],
        weekKey
      };
    });
    
    return enriched;
  };
  
  // Get unique weeks for alternating colors
  const getWeekColor = (weekKey, uniqueWeeks) => {
    const weekIndex = uniqueWeeks.indexOf(weekKey);
    return weekIndex % 2 === 0 ? '#e3f2fd' : '#e8f5e9'; // Light blue and light green
  };

  const data = enrichedData();
  const uniqueWeeks = [...new Set(data.map(row => row.weekKey))];

  return (
    <PageLayout
      title="Análisis de Items"
      subtitle="Historial de uso de items en órdenes de trabajo"
      onBack={() => navigate(-1)}
    >
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                select
                label="Seleccionar Item"
                value={selectedItem}
                onChange={(e) => setSelectedItem(e.target.value)}
                fullWidth
              >
                <MenuItem value="">Seleccionar...</MenuItem>
                {items.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name} ({item.type})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Fecha Desde"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                type="date"
                label="Fecha Hasta"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setWithdrawalDialog(true)}
                  disabled={!selectedItem}
                  fullWidth
                  sx={{ height: '56px' }}
                >
                  Registrar Retiro
                </Button>
              </Grid>
          </Grid>
        </CardContent>
      </Card>

      {loading && (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && selectedItem && data.length === 0 && (
        <Alert severity="info">No hay registros para este item en el rango seleccionado</Alert>
      )}

      {!loading && data.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Historial de Uso - {items.find(i => i.id === parseInt(selectedItem))?.name}
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha OT</TableCell>
                    <TableCell>Cliente</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Precio Unit.</TableCell>
                    <TableCell align="right">Monto</TableCell>
                    <TableCell align="right">Acumulado</TableCell>
                    <TableCell align="center">Semana</TableCell>
                    <TableCell align="right">Suma Semana</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.map((row, index) => {
                    const bgColor = getWeekColor(row.weekKey, uniqueWeeks);
                      const isWithdrawal = row.type === 'withdrawal';
                      const textColor = isWithdrawal ? '#8B0000' : 'inherit';
                    return (
                      <TableRow key={`${row.id_work_order}-${index}`} sx={{ bgcolor: bgColor }}>
                          <TableCell sx={{ color: textColor }}>{formatDateDisplay(row.date)}</TableCell>
                          <TableCell sx={{ color: textColor, fontWeight: isWithdrawal ? 600 : 400 }}>
                            {row.customer_name}
                            {isWithdrawal && row.description && ` - ${row.description}`}
                          </TableCell>
                          <TableCell align="right" sx={{ color: textColor }}>{row.quantity || '-'}</TableCell>
                          <TableCell align="right" sx={{ color: textColor }}>{row.unit_price ? formatCurrency(row.unit_price, false) : '-'}</TableCell>
                          <TableCell align="right" sx={{ color: textColor, fontWeight: isWithdrawal ? 600 : 400 }}>
                            {formatCurrency(row.total, false)}
                          </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatCurrency(row.accumulated, false)}
                        </TableCell>
                          <TableCell align="center" sx={{ color: textColor }}>{row.year} S{row.week_number}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: textColor }}>
                            {isWithdrawal ? '-' : formatCurrency(row.weekly_sum, false)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
            <Box mt={2} display="flex" justifyContent="space-between">
              <Typography variant="subtitle1">
                Total de registros: {data.length}
              </Typography>
              <Typography variant="h6" color="primary">
                Total Acumulado: {formatCurrency(data[data.length - 1]?.accumulated || 0, false)}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

        {/* Dialog Registrar Retiro */}
        <Dialog
          open={withdrawalDialog}
          onClose={() => setWithdrawalDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Registrar Retiro</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  type="date"
                  label="Fecha del Retiro"
                  value={withdrawalForm.withdrawal_date}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, withdrawal_date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  type="number"
                  label="Monto"
                  value={withdrawalForm.amount}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                  fullWidth
                  required
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Descripción (opcional)"
                  value={withdrawalForm.description}
                  onChange={(e) => setWithdrawalForm({ ...withdrawalForm, description: e.target.value })}
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setWithdrawalDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleCreateWithdrawal}
              variant="contained"
              disabled={!withdrawalForm.amount || parseFloat(withdrawalForm.amount) <= 0}
            >
              Registrar
            </Button>
          </DialogActions>
        </Dialog>
    </PageLayout>
  );
}

export default ItemAnalysis;
