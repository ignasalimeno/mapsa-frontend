import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  MenuItem,
  Divider,
  Stack,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Delete as DeleteIcon,
  DirectionsCar,
  Notes,
  Person as PersonIcon,
  Home as HomeIcon,
  Description as NotesIcon,
} from "@mui/icons-material";
import {
  customerService,
  vehicleService,
  workOrderService,
  accountService,
  invoicePaymentService,
  receiptService,
} from "../services/api";
import { LoadingOverlay, StyledDialog, TableActionIconButton, ExcelTable } from '../components';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useConfirm, useNotify } from '../context';
import { WORK_ORDER_STATUS } from '../constants/workOrderStatus';

const PROVINCES = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Cordoba',
  'Corrientes', 'Entre Rios', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
  'Mendoza', 'Misiones', 'Neuquen', 'Rio Negro', 'Salta', 'San Juan',
  'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucuman',
];

const TAB_CONTENT_HEIGHT = 'calc(100vh - 300px)';

const paymentMethodLabels = {
  CASH: 'Efectivo',
  TRANSFER: 'Transferencia',
  CHEQUE: 'Cheque',
  ECHEQ: 'E-Cheq',
  CARD_CREDIT: 'Tarjeta de Crédito',
  CARD_DEBIT: 'Tarjeta de Débito',
  RETENTION: 'Retención',
  OTRO: 'Otro',
};

const RETENTION_PREFIX = 'RETENTION__';

const composeMethodValue = (method, retentionType) =>
  method === 'RETENTION' ? `${RETENTION_PREFIX}${retentionType || ''}` : method;

const parseMethodValue = (value) => {
  if (value?.startsWith(RETENTION_PREFIX)) {
    return { method: 'RETENTION', retention_type: value.slice(RETENTION_PREFIX.length) };
  }
  return { method: value, retention_type: '' };
};

function SectionHeader({ icon: Icon, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      <Icon sx={{ fontSize: 18, color: 'primary.main', opacity: 0.85 }} />
      <Typography variant="overline" sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', lineHeight: 1 }}>
        {label}
      </Typography>
    </Stack>
  );
}

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { error: notifyError, success: notifySuccess } = useNotify();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // Customer data
  const [customer, setCustomer] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  // Vehicles
  const [vehicles, setVehicles] = useState([]);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [vehicleDialogMode, setVehicleDialogMode] = useState('create');
  const [editVehicle, setEditVehicle] = useState(null);
  const [newVehicle, setNewVehicle] = useState({
    brand: "", model: "", internal_number: "", year: "", plate: "", engine: "", vin: "", current_km: "", notes: "",
  });

  // Work orders
  const [workOrders, setWorkOrders] = useState([]);

  // Account
  const [account, setAccount] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [movements, setMovements] = useState([]);
  const [receipts, setReceipts] = useState([]);

  // Payment / Movement modal
  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: 'PAYMENT',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    description: '',
    external_id: '',
    receipt_number: '',
    receipt_date: new Date().toISOString().slice(0, 10),
    iva_percentage: '21',
  });

  // Payment lines
  const [paymentLines, setPaymentLines] = useState([]);
  const [paymentLineModalOpen, setPaymentLineModalOpen] = useState(false);
  const [editingPaymentLineIndex, setEditingPaymentLineIndex] = useState(null);
  const [retentionTypes, setRetentionTypes] = useState([]);
  const [paymentLineForm, setPaymentLineForm] = useState({
    method: 'CASH', amount: '', retention_type: '', notes: '',
    cheque_number: '', bank: '', receipt_number: '', receipt_date: '',
  });

  // Allocations
  const [allocations, setAllocations] = useState({});

  // Delete payment
  const [deletePaymentModalOpen, setDeletePaymentModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);

  // Attachments
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  // Delete customer
  const [deleteCustomerModalOpen, setDeleteCustomerModalOpen] = useState(false);

  const invoiceStatusMap = {
    NEW: { label: 'Pendiente', color: 'warning' },
    PARTIAL_PAID: { label: 'Parcial', color: 'info' },
    PAID: { label: 'Pagada', color: 'success' },
    CANCELLED: { label: 'Anulada', color: 'error' },
  };

  useEffect(() => {
    loadAllData();
    loadRetentionTypes();
  }, [id]);

  const loadRetentionTypes = async () => {
    try {
      const response = await invoicePaymentService.getRetentionTypes();
      setRetentionTypes(response.data || []);
    } catch (err) {
      setRetentionTypes([]);
    }
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [customerRes, vehiclesRes, workOrdersRes, accountRes, invoicesRes, receiptsRes] = await Promise.all([
        customerService.getById(id),
        vehicleService.getAll(id),
        workOrderService.getAll({ customer_id: id }),
        accountService.getCustomerAccount(id),
        accountService.listCustomerInvoices(id),
        receiptService.list({ customer_id: id, include_voided: 'true' }),
      ]);
      setCustomer(customerRes.data);
      setEditForm(customerRes.data);
      setVehicles(vehiclesRes.data);
      setWorkOrders(workOrdersRes.data);
      setAccount(accountRes.data);
      setMovements(accountRes.data?.movements || []);
      setInvoices(invoicesRes.data);
      setReceipts(receiptsRes.data || []);
    } catch (err) {
      setError("Error al cargar datos del cliente");
    } finally {
      setLoading(false);
    }
  };

  // Vehicle handlers
  const resetVehicleForm = () => {
    setNewVehicle({ brand: "", model: "", internal_number: "", year: "", plate: "", engine: "", vin: "", current_km: "", notes: "" });
    setEditVehicle(null);
    setVehicleDialogMode('create');
  };

  const handleSaveVehicle = async () => {
    try {
      const payload = { ...newVehicle, id_customer: parseInt(id), year: newVehicle.year ? parseInt(newVehicle.year) : null, current_km: newVehicle.current_km ? parseInt(newVehicle.current_km) : 0 };
      if (vehicleDialogMode === 'create') {
        await vehicleService.create(payload);
        notifySuccess('Vehículo agregado correctamente');
      } else if (editVehicle) {
        await vehicleService.update(editVehicle.id, payload);
        notifySuccess('Vehículo actualizado correctamente');
      }
      setVehicleDialog(false);
      resetVehicleForm();
      await loadAllData();
    } catch (err) {
      notifyError(err?.response?.data?.error || 'No se pudo guardar el vehículo');
    }
  };

  const handleOpenEditVehicle = (vehicle) => {
    setEditVehicle(vehicle);
    setNewVehicle({
      brand: vehicle.brand || "", model: vehicle.model || "", internal_number: vehicle.internal_number || "",
      year: vehicle.year || "", plate: vehicle.plate || "", engine: vehicle.engine || "",
      vin: vehicle.vin || "", current_km: vehicle.current_km || "", notes: vehicle.notes || "",
    });
    setVehicleDialogMode('edit');
    setVehicleDialog(true);
  };

  const handleOpenCreateVehicle = () => { resetVehicleForm(); setVehicleDialog(true); };

  // Customer edit
  const handleSaveCustomer = async () => {
    try {
      await customerService.update(id, editForm);
      setCustomer(editForm);
      setEditModalOpen(false);
      notifySuccess('Cliente actualizado correctamente');
    } catch (err) {
      notifyError('No se pudieron guardar los cambios');
    }
  };

  const handleCancelEdit = () => { setEditForm(customer); setEditModalOpen(false); };

  // Delete customer
  const handleDeleteCustomer = async () => {
    try {
      await customerService.delete(id);
      notifySuccess('Cliente eliminado correctamente');
      navigate('/customers');
    } catch (err) {
      notifyError(err?.response?.data?.error || 'No se pudo eliminar el cliente');
    }
  };

  // Filters
  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!vehicleSearchTerm.trim()) return true;
    const term = vehicleSearchTerm.toLowerCase();
    return (vehicle.plate || '').toLowerCase().includes(term) || (vehicle.internal_number || '').toLowerCase().includes(term);
  });

  const getWorkOrderPlate = (workOrder) => {
    if (workOrder.plates) return workOrder.plates;
    if (!workOrder.vehicle_ids || workOrder.vehicle_ids.length === 0) return '-';
    return workOrder.vehicle_ids.map((vid) => { const v = vehicles.find((vv) => vv.id === vid); return v?.plate || `#${vid}`; }).join(' / ');
  };

  const getWorkOrderAmount = (workOrder) => {
    if (workOrder.status !== 'INVOICED') return null;
    return Number(workOrder.final_total || 0);
  };

  // Payment lines helpers
  const totalPaymentLines = paymentLines.reduce((sum, line) => sum + Number(line.amount || 0), 0);

  const openPaymentLineModal = (line = null, index = null) => {
    if (line) {
      setEditingPaymentLineIndex(index);
      setPaymentLineForm({
        method: composeMethodValue(line.method, line.retention_type),
        amount: String(line.amount), retention_type: line.retention_type || '',
        notes: line.notes || '', cheque_number: line.cheque_number || '',
        bank: line.bank || '', receipt_number: line.receipt_number || '', receipt_date: line.receipt_date || '',
      });
    } else {
      setEditingPaymentLineIndex(null);
      setPaymentLineForm({ method: 'CASH', amount: '', retention_type: '', notes: '', cheque_number: '', bank: '', receipt_number: '', receipt_date: '' });
    }
    setPaymentLineModalOpen(true);
  };

  const addOrUpdatePaymentLine = () => {
    const amount = Number(paymentLineForm.amount || 0);
    if (!amount || amount <= 0) { notifyError('Ingrese un monto válido'); return; }
    const { method, retention_type } = parseMethodValue(paymentLineForm.method);
    if (method === 'RETENTION' && !retention_type) { notifyError('Seleccione un tipo de retención'); return; }
    const nextLine = { method, amount, retention_type: method === 'RETENTION' ? retention_type : '', notes: paymentLineForm.notes || '', cheque_number: paymentLineForm.cheque_number || '', bank: paymentLineForm.bank || '', receipt_number: paymentLineForm.receipt_number?.trim() || '', receipt_date: paymentLineForm.receipt_date || '' };
    if (editingPaymentLineIndex !== null) {
      const updated = [...paymentLines]; updated[editingPaymentLineIndex] = nextLine; setPaymentLines(updated);
    } else { setPaymentLines((prev) => [...prev, nextLine]); }
    setPaymentLineModalOpen(false);
    setEditingPaymentLineIndex(null);
    notifySuccess('Forma de pago agregada');
  };

  const deletePaymentLine = (index) => { setPaymentLines((prev) => prev.filter((_, i) => i !== index)); };

  const splitAllocationsForAmount = (baseAllocations, lineAmount) => {
    const totalBase = baseAllocations.reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const lineInt = Math.round(Number(lineAmount || 0) * 100) / 100;
    if (lineInt <= 0 || totalBase <= 0) return [];
    const withFraction = baseAllocations.map((a) => {
      const raw = (Number(a.amount || 0) / totalBase) * lineInt;
      const floored = Math.floor(raw * 100) / 100;
      return { invoice_id: a.invoice_id, amount: floored, fraction: raw - floored };
    });
    let currentSum = withFraction.reduce((sum, a) => sum + a.amount, 0);
    let remainder = Math.round((lineInt - currentSum) * 100) / 100;
    withFraction.sort((a, b) => b.fraction - a.fraction);
    let idx = 0;
    while (remainder > 0.009 && withFraction.length > 0) { withFraction[idx % withFraction.length].amount = Math.round((withFraction[idx % withFraction.length].amount + 0.01) * 100) / 100; remainder = Math.round((remainder - 0.01) * 100) / 100; idx += 1; }
    return withFraction.filter((a) => a.amount > 0).map((a) => ({ invoice_id: a.invoice_id, amount: a.amount }));
  };

  const autoDistribute = () => {
    const total = parseFloat(totalPaymentLines || '0');
    if (!total || total <= 0 || invoices.length === 0) return;
    let remaining = total;
    const nextAlloc = {};
    for (const inv of invoices) {
      const balance = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0))));
      if (remaining <= 0) break;
      const assign = Math.min(balance, remaining);
      if (assign > 0) { nextAlloc[inv.id] = assign.toFixed(2); remaining -= assign; }
    }
    setAllocations(nextAlloc);
  };

  const handleSubmitMovement = async () => {
    try {
      const isPaymentLike = movementForm.type === 'PAYMENT' || movementForm.type === 'RECEIPT';
      if (isPaymentLike) {
        if (paymentLines.length === 0) { notifyError('Agrega al menos una forma de pago'); return; }
        const totalAmount = Math.round(totalPaymentLines * 100) / 100;
        if (!totalAmount || totalAmount <= 0) { notifyError('El total debe ser mayor a 0'); return; }
        const allocArray = Object.entries(allocations).map(([invoice_id, amt]) => ({ invoice_id: Number(invoice_id), amount: parseFloat(amt || '0') })).filter(a => a.amount > 0);
        const sumAlloc = allocArray.reduce((acc, a) => acc + a.amount, 0);
        if (sumAlloc > totalAmount + 0.0001) { notifyError('La suma de asignaciones supera el monto total'); return; }

        if (movementForm.type === 'RECEIPT') {
          if (!movementForm.receipt_number?.trim()) { notifyError('Ingrese el número de recibo'); return; }
          const lines = paymentLines
            .map((line) => ({
              method: line.method,
              amount: Math.round(Number(line.amount || 0) * 100) / 100,
              retention_type: line.retention_type || null,
              cheque_number: (line.method === 'CHEQUE' || line.method === 'ECHEQ') ? (line.cheque_number || null) : null,
              bank: (line.method === 'CHEQUE' || line.method === 'ECHEQ') ? (line.bank || null) : null,
              notes: line.notes || null,
            }))
            .filter((line) => line.amount > 0);
          const response = await receiptService.create({
            customer_id: Number(id),
            lines,
            allocations: allocArray,
            receipt_number: movementForm.receipt_number.trim(),
            receipt_date: movementForm.receipt_date || movementForm.date || null,
            notes: movementForm.description || '',
          });
          if (response.data?.error) { notifyError(response.data.error); return; }
          notifySuccess('Recibo generado exitosamente');
        } else {
          for (const line of paymentLines) {
            const lineAmount = Math.round(Number(line.amount || 0) * 100) / 100;
            if (lineAmount <= 0) continue;
            const lineAllocations = splitAllocationsForAmount(allocArray, lineAmount);
            const retentionNote = line.method === 'RETENTION' && line.retention_type ? `Retención ${line.retention_type}` : '';
            const payload = { total_amount: lineAmount, method: line.method, payment_date: movementForm.date, notes: [movementForm.description, line.notes, retentionNote].filter(Boolean).join(' | '), cheque_number: (line.method === 'CHEQUE' || line.method === 'ECHEQ') ? (line.cheque_number || null) : null, bank: (line.method === 'CHEQUE' || line.method === 'ECHEQ') ? (line.bank || null) : null, allocations: lineAllocations };
            const response = await accountService.createCustomerPayment(id, payload);
            if (response.data?.error) { notifyError(response.data.error); return; }
          }
          notifySuccess('Pago registrado exitosamente');
        }
      } else {
        const monto = parseFloat(movementForm.amount || '0');
        if (!monto || monto <= 0) { notifyError('Ingrese un monto válido'); return; }
        if (!movementForm.external_id) { notifyError('Ingrese el número'); return; }
        const ivaPct = Number(movementForm.iva_percentage || 0);
        const total = Math.round(monto * (1 + ivaPct / 100) * 100) / 100;
        const payload = { amount: total, description: movementForm.description, type: movementForm.type, direction: movementForm.type === 'DEBIT_NOTE' ? 'DEBIT' : 'CREDIT', external_id: movementForm.external_id, iva_percentage: ivaPct };
        await accountService.createMovement(id, payload);
        notifySuccess('Movimiento registrado exitosamente');
      }
      setMovementModalOpen(false);
      setAllocations({});
      setPaymentLines([]);
      setMovementForm({ type: 'PAYMENT', amount: '', date: new Date().toISOString().split('T')[0], description: '', external_id: '', receipt_number: '', receipt_date: new Date().toISOString().split('T')[0], iva_percentage: '21' });
      await loadAllData();
    } catch (e) {
      notifyError(e.response?.data?.error || e.message || 'Error al registrar el movimiento');
    }
  };

  const openMovementFor = async (type) => {
    const base = {
      type,
      amount: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
      external_id: '',
      receipt_number: '',
      receipt_date: new Date().toISOString().slice(0, 10),
      iva_percentage: '21',
    };
    if (type === 'RECEIPT') {
      try {
        const res = await receiptService.nextNumber();
        base.receipt_number = res.data?.receipt_number || '';
      } catch (e) { /* ignore */ }
    }
    setPaymentLines([]);
    setAllocations({});
    setMovementForm(base);
    setMovementModalOpen(true);
  };

  const openDeletePaymentModal = (movement) => { setPaymentToDelete(movement); setDeletePaymentModalOpen(true); };
  const handleDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      const response = await accountService.deleteCustomerPayment(id, paymentToDelete.id);
      if (response.data?.error) { notifyError(response.data.error); return; }
      notifySuccess('Pago eliminado correctamente');
      setDeletePaymentModalOpen(false);
      setPaymentToDelete(null);
      await loadAllData();
    } catch (e) { notifyError(e?.response?.data?.error || 'No se pudo eliminar el pago'); }
  };

  const handleVoidReceipt = async (receipt) => {
    const confirmed = await confirm({
      title: 'Anular recibo',
      message: '¿Anular este recibo? Se revertirán los pagos sobre las facturas.',
      confirmLabel: 'Anular',
      confirmColor: 'error',
    });
    if (!confirmed) return;
    try {
      const response = await receiptService.void(receipt.id_receipt);
      if (response.data?.error) { notifyError(response.data.error); return; }
      notifySuccess('Recibo anulado');
      await loadAllData();
    } catch (e) { notifyError(e?.response?.data?.error || 'No se pudo anular el recibo'); }
  };

  const openAttachments = async (invoice) => {
    try {
      setAttachmentsModalOpen(true);
      setSelectedInvoice(invoice);
      setAttachmentsLoading(true);
      const resp = await accountService.listAttachments(invoice.id);
      setAttachments(resp.data || []);
    } catch (e) { setAttachments([]); }
    finally { setAttachmentsLoading(false); }
  };

  const getMovementReference = (movement) => {
    if (movement?.external_id) return movement.external_id;
    if (movement?.type === 'INVOICE') {
      const invoiceMatch = String(movement.description || '').match(/Factura\s+(F-\d+)/);
      if (invoiceMatch?.[1]) { const inv = invoices.find(i => i.number === invoiceMatch[1]); if (inv?.id_afip) return inv.id_afip; }
    }
    return '-';
  };

  const noteColumns = [
    { id: 'date', label: 'Fecha', sortValue: (r) => new Date(r.date || 0).getTime(), render: (r) => formatDate(r.date) },
    { id: 'reference', label: 'N° AFIP / Ref.', sortValue: (r) => getMovementReference(r).toLowerCase(), render: (r) => getMovementReference(r) !== '-' ? <Chip label={getMovementReference(r)} size="small" variant="outlined" /> : '-' },
    { id: 'description', label: 'Descripción', sortValue: (r) => (r.description || '').toLowerCase() },
    { id: 'amount', label: 'Monto', align: 'right', sortValue: (r) => Number(r.amount || 0), render: (r) => formatCurrency(r.amount || 0) },
    { id: 'status', label: 'Estado', render: (r) => r.voided ? <Chip label="Anulado" size="small" color="error" /> : <Chip label="Activo" size="small" color="success" /> },
  ];

  const noteNeto = Number(movementForm.amount || 0);
  const noteIvaPct = Number(movementForm.iva_percentage || 0);
  const noteTotal = Math.round(noteNeto * (1 + noteIvaPct / 100) * 100) / 100;
  const noteIva = Math.round((noteTotal - noteNeto) * 100) / 100;

  if (loading) return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }} display="flex" justifyContent="center" alignItems="center">
      <CircularProgress />
    </Box>
  );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!customer) return <Alert severity="error">Cliente no encontrado</Alert>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* HEADER */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'grey.200', px: 4, py: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" alignItems="center" gap={2} flex={1} minWidth={0}>
            <Button variant="outlined" size="small" onClick={() => navigate(-1)} sx={{ flexShrink: 0 }}>Volver</Button>
            <Divider orientation="vertical" flexItem />
            <Box flex={1} minWidth={0}>
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <Typography variant="h5" fontWeight={700} noWrap>{customer.name}</Typography>
                <Chip label={`N° ${customer.customer_number || '-'}`} size="small" variant="outlined" />
                <Chip
                  label={formatCurrency(customer.balance || 0)}
                  size="small"
                  variant="outlined"
                  sx={{ fontWeight: 700, color: Number(customer.balance || 0) > 0 ? 'error.main' : 'success.main', borderColor: Number(customer.balance || 0) > 0 ? 'error.main' : 'success.main' }}
                />
              </Box>
              <Box display="flex" gap={2} mt={0.5} flexWrap="wrap">
                {customer.id_afip && <Typography variant="body2" color="text.secondary">ID AFIP {customer.id_afip}</Typography>}
                {customer.document_number && <Typography variant="body2" color="text.secondary">Doc {customer.document_number}</Typography>}
                {customer.phone && <Typography variant="body2" color="text.secondary">{customer.phone}</Typography>}
                {customer.email && <Typography variant="body2" color="text.secondary">{customer.email}</Typography>}
                {customer.province && <Typography variant="body2" color="text.secondary">{customer.province}</Typography>}
              </Box>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1} flexShrink={0}>
            <Button variant="outlined" size="small" startIcon={<EditIcon />} onClick={() => { setEditForm(customer); setEditModalOpen(true); }}>Editar</Button>
            <Button variant="outlined" color="error" size="small" onClick={() => setDeleteCustomerModalOpen(true)}>Eliminar</Button>
          </Box>
        </Box>
      </Box>

      {/* TABS */}
      <Box sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'grey.200', px: 4 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Remitos" />
          <Tab label="Facturas" />
          <Tab label="Movimientos" />
          <Tab label="Recibos" />
          <Tab label="Notas de Crédito" />
          <Tab label="Notas de Débito" />
          <Tab label="Vehículos" />
        </Tabs>
      </Box>

      <Box px={4} pt={3} pb={4}>
        {/* TAB: Remitos (index 0) */}
        {activeTab === 0 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Remitos</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate(`/work-orders/new?customer_id=${id}`)} disabled={vehicles.length === 0}>Nuevo Remito</Button>
            </Box>
            <Box sx={{ height: TAB_CONTENT_HEIGHT, overflowY: 'auto' }}>
              <ExcelTable
                columns={[
                  { id: 'external_id', label: 'N° Remito', sortValue: (r) => (r.external_id || '').toLowerCase(), render: (r) => <Typography sx={{ fontWeight: 600, fontSize: 'inherit' }}>{r.external_id || '-'}</Typography> },
                  { id: 'plate', label: 'Patente', sortValue: (r) => (r.plates || '').toLowerCase(), render: (r) => getWorkOrderPlate(r) },
                  { id: 'open_date', label: 'Fecha', sortValue: (r) => new Date(r.open_date || 0).getTime(), render: (r) => formatDate(r.open_date) },
                  { id: 'status', label: 'Estado', sortValue: (r) => (WORK_ORDER_STATUS[r.status]?.label || '').toLowerCase(), render: (r) => <Chip label={WORK_ORDER_STATUS[r.status]?.label || 'Abierto'} color={WORK_ORDER_STATUS[r.status]?.color || 'info'} size="small" /> },
                  { id: 'description', label: 'Descripción', sortValue: (r) => (r.description || '').toLowerCase() },
                  { id: 'final_total', label: 'Monto', align: 'right', sortValue: (r) => getWorkOrderAmount(r) ?? 0, render: (r) => <Typography sx={{ fontWeight: 600, fontSize: 'inherit' }}>{getWorkOrderAmount(r) !== null ? formatCurrency(getWorkOrderAmount(r)) : '-'}</Typography> },
                ]}
                data={workOrders}
                defaultSort="open_date"
                defaultOrder="desc"
                maxHeight="none"
                actions={(row) => (
                  <Box display="flex" gap={1} justifyContent="center">
                    <TableActionIconButton kind="access" onClick={() => navigate(`/work-orders/${row.id}/edit`)} ariaLabel={`Abrir remito ${row.external_id || row.id}`} />
                  </Box>
                )}
                emptyMessage="No hay remitos"
              />
            </Box>
          </CardContent>
        )}

        {/* TAB: Facturas (index 1) */}
        {activeTab === 1 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Facturas</Typography>
            </Box>
            <Box sx={{ height: TAB_CONTENT_HEIGHT, overflowY: 'auto' }}>
              <ExcelTable
                columns={[
                  { id: 'number', label: 'N° de Factura', sortValue: (r) => (r.id_afip || r.number || '').toLowerCase(), render: (r) => r.id_afip || r.number || `#${r.id}` },
                  { id: 'type', label: 'Tipo', sortValue: (r) => (r.invoice_type || 'B').toLowerCase(), render: (r) => <Chip label={r.invoice_type || 'B'} size="small" color={r.invoice_type === 'A' ? 'primary' : 'default'} variant="outlined" /> },
                  { id: 'date', label: 'Fecha', sortValue: (r) => new Date(r.invoice_date || r.date || 0).getTime(), render: (r) => (r.invoice_date || r.date) ? formatDate(r.invoice_date || r.date) : '-' },
                  { id: 'total_amount', label: 'Total', align: 'right', sortValue: (r) => Number(r.total_amount || 0), render: (r) => formatCurrency(r.total_amount || 0) },
                  { id: 'paid_amount', label: 'Pagado', align: 'right', sortValue: (r) => Number(r.paid_amount || 0), render: (r) => formatCurrency(r.paid_amount || 0) },
                  { id: 'balance', label: 'Saldo', align: 'right', sortValue: (r) => Number(r.balance || 0), render: (r) => formatCurrency(r.balance || 0) },
                  { id: 'status', label: 'Estado', sortValue: (r) => (invoiceStatusMap[r.status]?.label || '').toLowerCase(), render: (r) => <Chip label={invoiceStatusMap[r.status]?.label || r.status || 'Pendiente'} color={invoiceStatusMap[r.status]?.color || 'default'} size="small" /> },
                ]}
                data={invoices}
                defaultSort="date"
                defaultOrder="desc"
                maxHeight="none"
                actions={(row) => (
                  <Box display="flex" gap={1} justifyContent="center">
                    <Button size="small" variant="outlined" onClick={() => openAttachments(row)}>Adjuntos</Button>
                  </Box>
                )}
                emptyMessage="No hay facturas para este cliente"
              />
            </Box>
          </CardContent>
        )}

        {/* TAB: Movimientos (index 2) */}
        {activeTab === 2 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Movimientos</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openMovementFor('PAYMENT')}>Registrar Pago</Button>
            </Box>
            <Box sx={{ height: TAB_CONTENT_HEIGHT, overflowY: 'auto' }}>
              <ExcelTable
                columns={[
                  { id: 'date', label: 'Fecha', sortValue: (r) => new Date(r.date || 0).getTime(), render: (r) => formatDate(r.date) },
                  { id: 'type', label: 'Tipo', sortValue: (r) => (r.type || '').toLowerCase(), render: (r) => (<Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}><Chip label={r.type === 'PAYMENT' ? 'Pago' : r.type === 'INVOICE' ? 'Factura' : r.type === 'DEBIT_NOTE' ? 'N/D' : 'N/C'} size="small" color={r.type === 'PAYMENT' || r.type === 'CREDIT_NOTE' ? 'success' : 'default'} />{r.voided && <Chip label="Anulado" size="small" color="error" />}</Box>) },
                  { id: 'reference', label: 'N° AFIP / Ref.', sortValue: (r) => getMovementReference(r).toLowerCase(), render: (r) => getMovementReference(r) !== '-' ? <Chip label={getMovementReference(r)} size="small" variant="outlined" /> : '-' },
                  { id: 'receipt_number', label: 'N° Recibo', sortValue: (r) => (r.receipt_number || '').toLowerCase(), render: (r) => r.receipt_number ? <Chip label={r.receipt_number} size="small" variant="outlined" color="primary" /> : '-' },
                  { id: 'receipt_date', label: 'Fecha Recibo', sortValue: (r) => new Date(r.receipt_date || 0).getTime(), render: (r) => r.receipt_date ? formatDate(r.receipt_date) : '-' },
                  { id: 'description', label: 'Descripción', sortValue: (r) => (r.description || '').toLowerCase(), render: (r) => r.type === 'INVOICE' ? (() => { const m = String(r.description || '').match(/Factura\s+(F-\d+)/); if (m?.[1]) { const inv = invoices.find(i => i.number === m[1]); if (inv?.id_afip) return `Factura ${inv.id_afip}`; } return r.description; })() : r.description },
                  { id: 'neto', label: 'Neto', align: 'right', sortValue: (r) => Number(r.neto || 0), render: (r) => r.neto != null ? formatCurrency(r.neto) : '-' },
                  { id: 'iva', label: 'IVA', align: 'right', sortValue: (r) => Number(r.iva || 0), render: (r) => r.iva != null ? formatCurrency(r.iva) : '-' },
                  { id: 'debit', label: 'Débito', align: 'right', sortValue: (r) => r.direction === 'DEBIT' ? Number(r.amount || 0) : 0, render: (r) => r.direction === 'DEBIT' ? <Typography sx={{ color: 'error.main', fontSize: 'inherit' }}>{formatCurrency(r.amount)}</Typography> : '-' },
                  { id: 'credit', label: 'Crédito', align: 'right', sortValue: (r) => r.direction === 'CREDIT' ? Number(r.amount || 0) : 0, render: (r) => r.direction === 'CREDIT' ? <Typography sx={{ color: 'success.main', fontSize: 'inherit' }}>{formatCurrency(r.amount)}</Typography> : '-' },
                ]}
                data={movements}
                defaultSort="date"
                defaultOrder="desc"
                maxHeight="none"
                actions={(row) => row.type === 'PAYMENT' && !row.voided ? (
                  <Box display="flex" gap={1} justifyContent="center">
                    <Button size="small" color="error" variant="outlined" onClick={() => openDeletePaymentModal(row)}>Borrar</Button>
                  </Box>
                ) : null}
                emptyMessage="Sin movimientos"
              />
            </Box>
          </CardContent>
        )}

        {/* TAB: Recibos (index 3) */}
        {activeTab === 3 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Recibos</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openMovementFor('RECEIPT')}>Generar Recibo</Button>
            </Box>
            <Box sx={{ height: TAB_CONTENT_HEIGHT, overflowY: 'auto' }}>
              <ExcelTable
                columns={[
                  { id: 'receipt_number', label: 'N° Recibo', sortValue: (r) => (r.receipt_number || '').toLowerCase(), render: (r) => <Typography sx={{ fontWeight: 600, fontSize: 'inherit' }}>{r.receipt_number || `#${r.id_receipt}`}</Typography> },
                  { id: 'receipt_date', label: 'Fecha', sortValue: (r) => new Date(r.receipt_date || 0).getTime(), render: (r) => formatDate(r.receipt_date) },
                  { id: 'type', label: 'Formas', sortable: false, render: (r) => <Box sx={{ display: 'inline-flex', gap: 0.5, flexWrap: 'wrap' }}>{(r.methods || []).map((m, i) => <Chip key={`${m}-${i}`} size="small" label={paymentMethodLabels[m] || m} variant="outlined" />)}</Box> },
                  { id: 'status', label: 'Estado', sortValue: (r) => (r.status || '').toLowerCase(), render: (r) => <Chip size="small" label={r.status === 'CANCELLED' ? 'Anulado' : 'Activo'} color={r.status === 'CANCELLED' ? 'error' : 'success'} /> },
                  { id: 'total_amount', label: 'Total', align: 'right', sortValue: (r) => Number(r.total_amount || 0), render: (r) => <Typography sx={{ fontWeight: 600, fontSize: 'inherit' }}>{formatCurrency(r.total_amount || 0)}</Typography> },
                ]}
                data={receipts}
                defaultSort="receipt_date"
                defaultOrder="desc"
                maxHeight="none"
                onRowClick={(row) => navigate(`/receipts/${row.id_receipt}`)}
                actions={(row) => row.status !== 'CANCELLED' ? (
                  <Button size="small" color="error" variant="outlined" onClick={(e) => { e.stopPropagation(); handleVoidReceipt(row); }}>Anular</Button>
                ) : null}
                emptyMessage="No hay recibos para este cliente"
              />
            </Box>
          </CardContent>
        )}

        {/* TAB: Notas de Crédito (index 4) */}
        {activeTab === 4 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Notas de Crédito</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openMovementFor('CREDIT_NOTE')}>Nueva Nota de Crédito</Button>
            </Box>
            <Box sx={{ height: TAB_CONTENT_HEIGHT, overflowY: 'auto' }}>
              <ExcelTable
                columns={noteColumns}
                data={movements.filter((m) => m.type === 'CREDIT_NOTE')}
                defaultSort="date"
                defaultOrder="desc"
                maxHeight="none"
                emptyMessage="No hay notas de crédito"
              />
            </Box>
          </CardContent>
        )}

        {/* TAB: Notas de Débito (index 5) */}
        {activeTab === 5 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Notas de Débito</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => openMovementFor('DEBIT_NOTE')}>Nueva Nota de Débito</Button>
            </Box>
            <Box sx={{ height: TAB_CONTENT_HEIGHT, overflowY: 'auto' }}>
              <ExcelTable
                columns={noteColumns}
                data={movements.filter((m) => m.type === 'DEBIT_NOTE')}
                defaultSort="date"
                defaultOrder="desc"
                maxHeight="none"
                emptyMessage="No hay notas de débito"
              />
            </Box>
          </CardContent>
        )}

        {/* TAB: Vehículos */}
        {activeTab === 6 && (
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Vehículos</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateVehicle}>Agregar Vehículo</Button>
            </Box>
            <Box mb={2}>
              <TextField fullWidth size="small" label="Buscar por patente o N° Interno" placeholder="Ej: AB123CD" value={vehicleSearchTerm} onChange={(e) => setVehicleSearchTerm(e.target.value)} />
            </Box>
            <Box sx={{ height: TAB_CONTENT_HEIGHT, overflowY: 'auto' }}>
              <ExcelTable
                columns={[
                  { id: 'brand', label: 'Marca', sortValue: (r) => (r.brand || '').toLowerCase() },
                  { id: 'model', label: 'Modelo', sortValue: (r) => (r.model || '').toLowerCase() },
                  { id: 'year', label: 'Año', sortValue: (r) => Number(r.year || 0) },
                  { id: 'plate', label: 'Patente', sortValue: (r) => (r.plate || '').toLowerCase() },
                  { id: 'internal_number', label: 'N° Interno', sortValue: (r) => (r.internal_number || '').toLowerCase() },
                  { id: 'current_km', label: 'KM', align: 'right', sortValue: (r) => Number(r.current_km || 0), render: (r) => Number(r.current_km || 0).toLocaleString('es-AR') },
                ]}
                data={filteredVehicles}
                defaultSort="plate"
                defaultOrder="asc"
                maxHeight="none"
                actions={(row) => (
                  <Box display="flex" gap={1} justifyContent="center">
                    <TableActionIconButton kind="edit" onClick={() => handleOpenEditVehicle(row)} ariaLabel={`Editar vehículo ${row.plate || row.brand || ''}`} />
                    <TableActionIconButton kind="access" onClick={() => navigate(`/vehicles/${row.id}`)} ariaLabel={`Abrir vehículo ${row.brand || row.plate || ''}`} />
                    <TableActionIconButton kind="workorder" onClick={() => navigate(`/work-orders/new?customer_id=${id}&vehicle_id=${row.id}`)} ariaLabel={`Crear remito para vehículo ${row.brand || row.plate || ''}`} />
                  </Box>
                )}
                emptyMessage={vehicleSearchTerm ? 'Sin resultados' : 'No hay vehículos registrados'}
              />
            </Box>
          </CardContent>
        )}
      </Box>

      {/* === MODALS === */}

      {/* Customer Edit Dialog */}
      <StyledDialog open={editModalOpen} onClose={handleCancelEdit} maxWidth="md" title="Editar Cliente" icon={<EditIcon />} actions={
        <>
          <Button onClick={handleCancelEdit} variant="outlined" sx={{ mr: 1 }}>Cancelar</Button>
          <Button onClick={handleSaveCustomer} variant="contained" startIcon={<SaveIcon />} sx={{ px: 3 }}>Guardar</Button>
        </>
      }>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
            <SectionHeader icon={PersonIcon} label="Datos personales" />
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="N° Cliente" type="number" value={editForm.customer_number || ''} onChange={(e) => setEditForm({...editForm, customer_number: e.target.value})} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Nombre" value={editForm.name || ''} onChange={(e) => setEditForm({...editForm, name: e.target.value})} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Documento" value={editForm.document_number || ''} onChange={(e) => setEditForm({...editForm, document_number: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="ID AFIP" value={(editForm && (editForm.id_afip !== undefined ? editForm.id_afip : editForm.cuit)) || ''} onChange={(e) => setEditForm({...editForm, id_afip: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Teléfono" value={editForm.phone || ''} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Email" type="email" value={editForm.email || ''} onChange={(e) => setEditForm({...editForm, email: e.target.value})} /></Grid>
            </Grid>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
            <SectionHeader icon={HomeIcon} label="Dirección y fiscal" />
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Dirección" value={editForm.address || ''} onChange={(e) => setEditForm({...editForm, address: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" select label="Provincia" value={editForm.province || ''} onChange={(e) => setEditForm({...editForm, province: e.target.value})}><MenuItem value="">Seleccionar</MenuItem>{PROVINCES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}</TextField></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="CP" value={editForm.postal_code || ''} onChange={(e) => setEditForm({...editForm, postal_code: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" label="Contacto" value={editForm.contact || ''} onChange={(e) => setEditForm({...editForm, contact: e.target.value})} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth size="small" select label="Condición Fiscal" value={editForm.tax_condition || 'CONSUMIDOR_FINAL'} onChange={(e) => setEditForm({...editForm, tax_condition: e.target.value})}><MenuItem value="CONSUMIDOR_FINAL">Consumidor Final</MenuItem><MenuItem value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</MenuItem><MenuItem value="MONOTRIBUTO">Monotributo</MenuItem><MenuItem value="EXENTO">Exento</MenuItem></TextField></Grid>
            </Grid>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
            <SectionHeader icon={NotesIcon} label="Notas" />
            <Divider sx={{ mb: 2 }} />
            <TextField fullWidth size="small" label="Notas" multiline rows={2} value={editForm.notes || ''} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} />
          </Paper>
        </Stack>
      </StyledDialog>

      {/* Vehicle Dialog */}
      <StyledDialog open={vehicleDialog} onClose={() => { setVehicleDialog(false); resetVehicleForm(); }} maxWidth="md" title={vehicleDialogMode === 'create' ? 'Agregar Vehículo' : 'Editar Vehículo'} actions={
        <>
          <Button onClick={() => { setVehicleDialog(false); resetVehicleForm(); }} variant="outlined" sx={{ mr: 1 }}>Cancelar</Button>
          <Button onClick={handleSaveVehicle} variant="contained" startIcon={<SaveIcon />} sx={{ px: 3 }}>{vehicleDialogMode === 'create' ? 'Guardar' : 'Actualizar'}</Button>
        </>
      }>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
            <SectionHeader icon={DirectionsCar} label="Datos del vehículo" />
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Marca" value={newVehicle.brand} onChange={(e) => setNewVehicle({ ...newVehicle, brand: e.target.value })} size="small" /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Modelo" value={newVehicle.model} onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })} size="small" /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Año" type="number" value={newVehicle.year} onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })} size="small" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Patente" value={newVehicle.plate} onChange={(e) => setNewVehicle({ ...newVehicle, plate: e.target.value })} required size="small" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="N° Interno" value={newVehicle.internal_number} onChange={(e) => setNewVehicle({ ...newVehicle, internal_number: e.target.value })} size="small" /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Kilometraje actual" type="number" value={newVehicle.current_km} onChange={(e) => setNewVehicle({ ...newVehicle, current_km: e.target.value })} size="small" /></Grid>
            </Grid>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
            <SectionHeader icon={Notes} label="Notas adicionales" />
            <Divider sx={{ mb: 2 }} />
            <TextField fullWidth label="Notas" multiline rows={3} value={newVehicle.notes} onChange={(e) => setNewVehicle({ ...newVehicle, notes: e.target.value })} size="small" />
          </Paper>
        </Stack>
      </StyledDialog>

      {/* Movement Modal */}
      <Dialog open={movementModalOpen} onClose={() => setMovementModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {movementForm.type === 'PAYMENT' ? 'Registrar Pago'
            : movementForm.type === 'RECEIPT' ? 'Generar Recibo'
            : movementForm.type === 'CREDIT_NOTE' ? 'Nueva Nota de Crédito'
            : 'Nueva Nota de Débito'}
        </DialogTitle>
        <DialogContent sx={{ pt: 1.25 }}>
          <Grid container spacing={2} sx={{ mt: 0.25 }}>
            {(movementForm.type === 'DEBIT_NOTE' || movementForm.type === 'CREDIT_NOTE') ? (
              <>
                <Grid item xs={12} md={4}>
                  <TextField type="number" label="Número" value={movementForm.external_id} onChange={(e) => setMovementForm({ ...movementForm, external_id: e.target.value })} fullWidth required inputProps={{ min: 0 }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField type="number" label="Monto (neto)" value={movementForm.amount} onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })} fullWidth required inputProps={{ step: 0.01, min: 0 }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField select label="IVA" value={movementForm.iva_percentage} onChange={(e) => setMovementForm({ ...movementForm, iva_percentage: e.target.value })} fullWidth>
                    <MenuItem value="0">0%</MenuItem>
                    <MenuItem value="10.5">10,5%</MenuItem>
                    <MenuItem value="21">21%</MenuItem>
                    <MenuItem value="27">27%</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField type="date" label="Fecha" value={movementForm.date} onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                </Grid>
                <Grid item xs={12} md={8}>
                  <TextField label="Descripción" value={movementForm.description} onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })} fullWidth />
                </Grid>
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', gap: 4 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Neto</Typography>
                      <Typography variant="body1">{formatCurrency(noteNeto)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">IVA</Typography>
                      <Typography variant="body1">{formatCurrency(noteIva)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">Total</Typography>
                      <Typography variant="body1" fontWeight={700}>{formatCurrency(noteTotal)}</Typography>
                    </Box>
                  </Paper>
                </Grid>
              </>
            ) : (
              <>
                <Grid item xs={12} md={6}>
                  <TextField type="date" label="Fecha" value={movementForm.date} onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                </Grid>
                {movementForm.type === 'RECEIPT' && (
                  <>
                    <Grid item xs={12} md={6}>
                      <TextField label="N° Recibo" value={movementForm.receipt_number} onChange={(e) => setMovementForm({ ...movementForm, receipt_number: e.target.value })} fullWidth required />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField type="date" label="Fecha Recibo" value={movementForm.receipt_date} onChange={(e) => setMovementForm({ ...movementForm, receipt_date: e.target.value })} fullWidth InputLabelProps={{ shrink: true }} />
                    </Grid>
                  </>
                )}
                <Grid item xs={12}>
                  <TextField label="Descripción" value={movementForm.description} onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })} fullWidth multiline rows={2} />
                </Grid>
              </>
            )}
          </Grid>

          {(movementForm.type === 'PAYMENT' || movementForm.type === 'RECEIPT') && (
            <Box sx={{ mt: 3 }}>
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1" fontWeight="bold">Formas de Pago</Typography>
                  <Button size="small" variant="contained" onClick={() => openPaymentLineModal()}>Agregar Forma</Button>
                </Box>
                {paymentLines.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Sin formas de pago</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Método</TableCell>
                        <TableCell align="right">Monto</TableCell>
                        <TableCell>Detalle</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paymentLines.map((line, index) => (
                        <TableRow key={`${line.method}-${index}`}>
                          <TableCell>{line.method === 'RETENTION' ? `Retención${line.retention_type ? ` - ${line.retention_type}` : ''}` : (paymentMethodLabels[line.method] || line.method)}</TableCell>
                          <TableCell align="right">{formatCurrency(line.amount)}</TableCell>
                          <TableCell>{line.notes || '-'}</TableCell>
                          <TableCell align="center">
                            <Button size="small" onClick={() => openPaymentLineModal(line, index)}>Editar</Button>
                            <Button size="small" color="error" onClick={() => deletePaymentLine(index)}>Eliminar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">Distribución en Facturas</Typography>
                {invoices.length > 0 && invoices.some(inv => { const b = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0)))); return b > 0; }) && (
                  <Button size="small" variant="outlined" onClick={autoDistribute} disabled={totalPaymentLines <= 0}>Distribuir Automáticamente</Button>
                )}
              </Box>
              {invoices.length === 0 ? (
                <Alert severity="info">No hay facturas registradas</Alert>
              ) : !invoices.some(inv => { const b = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0)))); return b > 0; }) ? (
                <Alert severity="success">Todas las facturas están pagadas</Alert>
              ) : (
                <>
                  <TableContainer component={Paper} sx={{ maxHeight: 300, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>N° de Factura</TableCell>
                          <TableCell>Fecha</TableCell>
                          <TableCell align="right">Saldo</TableCell>
                          <TableCell align="right" sx={{ width: 150 }}>Asignar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.filter(inv => { const b = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0)))); return b > 0; }).map(inv => {
                          const balance = Math.max(0, (inv.balance ?? (inv.total_amount - (inv.paid_amount || 0))));
                          return (
                            <TableRow key={inv.id}>
                              <TableCell>{inv.id_afip || inv.number || `#${inv.id}`}</TableCell>
                              <TableCell>{(inv.invoice_date || inv.date) ? formatDate(inv.invoice_date || inv.date) : '-'}</TableCell>
                              <TableCell align="right">{formatCurrency(balance)}</TableCell>
                              <TableCell align="right">
                                <TextField size="small" type="number" value={allocations[inv.id] ?? ''} onChange={(e) => setAllocations(prev => ({ ...prev, [inv.id]: e.target.value }))} inputProps={{ step: 0.01, min: 0, max: balance }} fullWidth />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Monto Total:</Typography>
                        <Typography variant="h6">{formatCurrency(totalPaymentLines)}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Asignado:</Typography>
                        <Typography variant="h6" color="primary.main">{formatCurrency(Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0))}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="text.secondary">Sin Asignar:</Typography>
                        <Typography variant="h6" color={(totalPaymentLines - Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0)) > 0 ? 'warning.main' : 'success.main'}>
                          {formatCurrency(totalPaymentLines - Object.values(allocations).reduce((sum, val) => sum + parseFloat(val || 0), 0))}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMovementModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmitMovement}>{movementForm.type === 'PAYMENT' ? 'Registrar Pago' : movementForm.type === 'RECEIPT' ? 'Generar Recibo' : 'Registrar Nota'}</Button>
        </DialogActions>
      </Dialog>

      {/* Payment Line Modal */}
      <Dialog open={paymentLineModalOpen} onClose={() => { setPaymentLineModalOpen(false); setEditingPaymentLineIndex(null); }} maxWidth="md" fullWidth>
        <DialogTitle>{editingPaymentLineIndex !== null ? 'Editar Forma de Pago' : 'Agregar Forma de Pago'}</DialogTitle>
        <DialogContent sx={{ pt: 1.25 }}>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField select label="Método de Pago" value={paymentLineForm.method} onChange={(e) => setPaymentLineForm({ ...paymentLineForm, method: e.target.value })} fullWidth>
                <MenuItem value="CASH">Efectivo</MenuItem>
                <MenuItem value="TRANSFER">Transferencia</MenuItem>
                <MenuItem value="CHEQUE">Cheque</MenuItem>
                <MenuItem value="ECHEQ">E-Cheq</MenuItem>
                <MenuItem value="CARD_CREDIT">Tarjeta de Crédito</MenuItem>
                <MenuItem value="CARD_DEBIT">Tarjeta de Débito</MenuItem>
                {retentionTypes.length > 0 && <MenuItem disabled value="retention-separator">Retenciones</MenuItem>}
                {retentionTypes.map((rt) => <MenuItem key={rt.id_retention_type} value={`${RETENTION_PREFIX}${rt.name}`}>{`Retención ${rt.name}`}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField type="number" label="Monto" value={paymentLineForm.amount} onChange={(e) => setPaymentLineForm({ ...paymentLineForm, amount: e.target.value })} fullWidth inputProps={{ step: 0.01, min: 0 }} />
            </Grid>
            {(paymentLineForm.method === 'CHEQUE' || paymentLineForm.method === 'ECHEQ') && (
              <>
                <Grid item xs={12}><TextField label="Número de Cheque" value={paymentLineForm.cheque_number} onChange={(e) => setPaymentLineForm({ ...paymentLineForm, cheque_number: e.target.value })} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Banco" value={paymentLineForm.bank} onChange={(e) => setPaymentLineForm({ ...paymentLineForm, bank: e.target.value })} fullWidth /></Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField label="Notas" value={paymentLineForm.notes} onChange={(e) => setPaymentLineForm({ ...paymentLineForm, notes: e.target.value })} fullWidth multiline rows={2} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPaymentLineModalOpen(false); setEditingPaymentLineIndex(null); }}>Cancelar</Button>
          <Button variant="contained" onClick={addOrUpdatePaymentLine}>{editingPaymentLineIndex !== null ? 'Actualizar' : 'Agregar'}</Button>
        </DialogActions>
      </Dialog>

      {/* Attachments Modal */}
      <Dialog open={attachmentsModalOpen} onClose={() => setAttachmentsModalOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Adjuntos {selectedInvoice ? selectedInvoice.number || `#${selectedInvoice.id}` : ''}</DialogTitle>
        <DialogContent dividers>
          {attachmentsLoading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={24} /></Box>
          ) : attachments.length === 0 ? (
            <Alert severity="info">No hay adjuntos para esta factura</Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow><TableCell>Archivo</TableCell><TableCell>Tipo</TableCell><TableCell align="right">Tamaño</TableCell><TableCell align="center">Descargar</TableCell></TableRow>
              </TableHead>
              <TableBody>
                {attachments.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell>{att.filename}</TableCell>
                    <TableCell>{att.content_type || '-'}</TableCell>
                    <TableCell align="right">{att.size_bytes ? `${Math.round(att.size_bytes / 1024)} KB` : '-'}</TableCell>
                    <TableCell align="center"><Button size="small" variant="contained" href={att.download_url} target="_blank" rel="noreferrer">Descargar</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setAttachmentsModalOpen(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* Delete Payment Modal */}
      <Dialog open={deletePaymentModalOpen} onClose={() => setDeletePaymentModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Anular Pago</DialogTitle>
        <DialogContent>
          <Typography variant="body2">¿Seguro que querés anular este pago? Se desasignarán sus montos de las facturas y se ajustará el saldo automáticamente.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeletePaymentModalOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeletePayment}>Anular Pago</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Customer Modal */}
      <Dialog open={deleteCustomerModalOpen} onClose={() => setDeleteCustomerModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Cliente</DialogTitle>
        <DialogContent>
          <Typography variant="body2">¿Seguro que querés eliminar a <strong>{customer.name}</strong>? El cliente se marcará como eliminado y dejará de aparecer en los listados, pero se conservará su historial de remitos, facturas y movimientos.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCustomerModalOpen(false)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={handleDeleteCustomer}>Eliminar</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}

export default CustomerDetail;