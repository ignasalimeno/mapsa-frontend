import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Stack,
  Divider,
  Autocomplete,
  Checkbox,
  ListItemText,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  ReceiptLong,
  ContactPhone,
  Search as SearchIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
} from "@mui/icons-material";
import { LoadingOverlay, PageLayout, StyledDialog } from '../components';
import ProductSearchModal from '../components/ProductSearchModal';
import CustomerSearchModal from '../components/CustomerSearchModal';
import { customerService, vehicleService, itemService, categoryService, warehouseService, workOrderService, invoiceService, deliveryNoteService } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import { WORK_ORDER_STATUS } from '../constants/workOrderStatus';
import { useNotify } from '../context';

// --- Reusable section header component ---
function SectionHeader({ icon: Icon, label }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
      <Icon sx={{ fontSize: 18, color: 'primary.main', opacity: 0.85 }} />
      <Typography
        variant="overline"
        sx={{ fontWeight: 700, letterSpacing: 1, color: 'text.secondary', lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Stack>
  )
}

// --- Reusable section card ---
function FormSection({ icon, label, children }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 1.5,
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        width: '100%',
      }}
    >
      <SectionHeader icon={icon} label={label} />
      <Divider sx={{ mb: 1.5 }} />
      <Grid container spacing={1.5}>
        {children}
      </Grid>
    </Paper>
  )
}

function WorkOrderForm() {
  const navigate = useNavigate();
  const { id: workOrderId } = useParams();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customer_id');
  const preselectedVehicleId = searchParams.get('vehicle_id') || searchParams.get('vehicle');
  const isEditing = !!workOrderId;
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [editingValues, setEditingValues] = useState({});
  const { error: notifyError, success: notifySuccess } = useNotify();
  
  const [workOrder, setWorkOrder] = useState({
    id_customer: preselectedCustomerId || "",
    vehicle_ids: preselectedVehicleId ? [preselectedVehicleId] : [],
    id_warehouse: "",
    description: "",
    km_at_entry: "",
    status: 'OPEN',
    external_id: "",
    open_date: new Date().toISOString().split('T')[0],
    invoice_total: 0,
    final_total: 0,
  });

  const [remitoModalOpen, setRemitoModalOpen] = useState(false);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [facturaModalOpen, setFacturaModalOpen] = useState(false);
  const [remitoForm, setRemitoForm] = useState({ id_external: '', notes: '' });
  const [facturaForm, setFacturaForm] = useState({ id_afip: '', invoice_type: 'A', invoice_date: new Date().toISOString().split('T')[0] });
  const [duplicateInvoice, setDuplicateInvoice] = useState(null);
  
  const [orderItems, setOrderItems] = useState([]);
  const statusInfo = WORK_ORDER_STATUS[workOrder.status] || { label: workOrder.status, color: 'default' };
  const isInvoiced = workOrder.status === 'INVOICED';

  useEffect(() => {
    loadCustomers();
    loadWarehouses();
    loadItems();
    if (isEditing) {
      loadWorkOrderData();
    }
  }, []);

  // Keyboard shortcut: Escape to close product search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && productSearchOpen) {
        setProductSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [productSearchOpen]);

  const loadWorkOrderData = async () => {
    try {
      const workOrderResponse = await workOrderService.getById(workOrderId);
      const workOrderData = workOrderResponse.data;
      
      setWorkOrder({
        id_customer: workOrderData.customer_id,
        vehicle_ids: (workOrderData.vehicle_ids || []).map(String),
        id_warehouse: workOrderData.warehouse_id || '',
        description: workOrderData.description || '',
        km_at_entry: workOrderData.km_at_entry || '',
        status: workOrderData.status || 'OPEN',
        external_id: workOrderData.external_id || '',
        open_date: workOrderData.open_date || new Date().toISOString().split('T')[0],
        invoice_total: workOrderData.invoice_total || 0,
        final_total: workOrderData.final_total || 0,
      });
      
      // Cargar items existentes
      try {
        const itemsResponse = await workOrderService.getItems(workOrderId);
        const existingItems = itemsResponse.data.map(item => ({
          id: item.id,
          item_id: item.item_id,
          name: item.item_name,
          type: item.item_type,
          quantity: item.quantity,
          cost: item.cost,
          price: item.price,
          iva_percentage: item.iva_percentage ?? 21.00,
          iva_amount: item.iva_amount || 0,
          invoice_value: item.invoice_value || 0,
        }));
        setOrderItems(existingItems);
      } catch (itemsErr) {
        console.error('Error loading items:', itemsErr);
        setOrderItems([]);
      }
    } catch (err) {
      console.error('Error loading work order:', err);
    }
  };

  const remitoTotal = Number(workOrder.invoice_total || workOrder.final_total || 0);

  const handleMergeDuplicate = async () => {
    if (!duplicateInvoice) return;
    try {
      setLoading(true);
      const resp = await invoiceService.addWorkOrderToInvoice(duplicateInvoice.existing_invoice_id, workOrderId);
      const data = resp.data;
      if (data.error) throw new Error(data.error);
      notifySuccess(`Remito sumado a la factura ${data.number}. Total: ${formatCurrency(data.total)}`);
      setDuplicateInvoice(null);
      setFacturaModalOpen(false);
      setFacturaForm({ id_afip: '', invoice_type: 'A', invoice_date: new Date().toISOString().split('T')[0] });
      await loadWorkOrderData();
    } catch (e) {
      console.error(e);
      notifyError(e?.response?.data?.error || 'Error al sumar el remito a la factura');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workOrder.id_customer) {
      loadVehicles(workOrder.id_customer);
    }
  }, [workOrder.id_customer]);

  const loadCustomers = async () => {
    try {
      const response = await customerService.getAll();
      setCustomers(response.data);
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  };

  const loadVehicles = async (customerId) => {
    try {
      const response = await vehicleService.getAll(customerId);
      setVehicles(response.data);
    } catch (err) {
      console.error('Error loading vehicles:', err);
    }
  };

  const loadWarehouses = async () => {
    try {
      const response = await warehouseService.getAll(true);
      const allWarehouses = response.data || [];
      setWarehouses(allWarehouses);

      const centralWarehouse = allWarehouses.find((w) =>
        (w.name || '').toLowerCase().includes('central')
      );
      const fallbackWarehouse = allWarehouses[0];
      const defaultWarehouse = centralWarehouse || fallbackWarehouse;
      if (defaultWarehouse) {
        setWorkOrder((prev) => ({
          ...prev,
          id_warehouse: prev.id_warehouse || defaultWarehouse.id,
        }));
      }
    } catch (err) {
      console.error('Error loading warehouses:', err);
    }
  };

  const loadItems = async () => {
    try {
      const [itemsResponse, catResponse] = await Promise.all([
        itemService.getAll(),
        categoryService.getAll(),
      ]);
      setItems(itemsResponse.data);
      setCategories(catResponse.data || []);
      
      // Auto-incluir producto "Valor del Remito" en nuevas OT
      if (!isEditing && orderItems.length === 0) {
        const valorRemitoItem = itemsResponse.data.find(i => i.code === 'REMITO-BASE');
        
        if (valorRemitoItem) {
          const baseItem = {
            id: Date.now(),
            item_id: valorRemitoItem.id,
            name: valorRemitoItem.name,
            type: valorRemitoItem.type,
            quantity: 1,
            cost: 0,
            price: 0,
            iva_percentage: valorRemitoItem.iva_rate || 21.00,
          };
          setOrderItems([baseItem]);
        }
      }
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  const handleRemoveItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleOrderItemChange = (id, field, value) => {
    if (field === 'quantity' || field === 'cost' || field === 'price') {
      const key = `${id}-${field}`;
      setEditingValues(prev => ({ ...prev, [key]: value }));
      return;
    }
    setOrderItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  };

  const handleItemBlur = (id, field) => {
    const key = `${id}-${field}`;
    setEditingValues(prev => {
      const raw = prev[key];
      if (raw === undefined) return prev;
      let parsed;
      if (field === 'quantity') {
        parsed = parseInt(raw, 10);
        if (isNaN(parsed) || parsed < 1) parsed = 1;
      } else {
        parsed = parseFloat(raw);
        if (isNaN(parsed)) parsed = 0;
      }
      setOrderItems(prev => prev.map(item => {
        if (item.id !== id) return item;
        return { ...item, [field]: parsed };
      }));
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Add item from modal
  const handleModalAddItem = (item) => {
    if (!item) return;

    const orderItem = {
      id: Date.now(),
      item_id: item.id,
      name: item.name,
      type: item.type,
      quantity: 1,
      cost: item.purchase_price,
      price: item.sale_price,
      iva_percentage: item.iva_rate || 21.00,
    };
    
    setOrderItems([...orderItems, orderItem]);
    notifySuccess(`${item.name} agregado`);
  };



  const calculateTotals = () => {
    const totalCost = Math.round(orderItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0) * 100) / 100;
    const totalPrice = Math.round(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 100) / 100;
    const totalIva = Math.round(orderItems.reduce((sum, item) => {
      const subtotal = item.price * item.quantity;
      const iva = subtotal * ((item.iva_percentage ?? 21) / 100);
      return sum + iva;
    }, 0) * 100) / 100;
    const totalInvoice = Math.round((totalPrice + totalIva) * 100) / 100;
    const profit = Math.round((totalPrice - totalCost) * 100) / 100;
    
    return { totalCost, totalPrice, totalIva, totalInvoice, profit };
  };

  const { totalCost, totalPrice, totalIva, totalInvoice, profit } = calculateTotals();

  const handleSave = async () => {
    const externalId = (workOrder.external_id || '').trim();
    const missingFields = [];
    if (!workOrder.id_customer) missingFields.push('cliente');
    if (!workOrder.id_warehouse) missingFields.push('depósito');
    if (!externalId) missingFields.push('número de remito');
    if (orderItems.length === 0) missingFields.push('al menos un item');

    if (missingFields.length > 0) {
      notifyError(`Faltan datos obligatorios: ${missingFields.join(', ')}`);
      return;
    }
    
    setLoading(true);
    try {
      if (isEditing) {
        // 1. Actualizar orden básica
        await workOrderService.update(workOrderId, {
          description: workOrder.description,
          km_at_entry: workOrder.km_at_entry ? parseInt(workOrder.km_at_entry) : null,
          id_warehouse: parseInt(workOrder.id_warehouse),
          external_id: externalId,
          open_date: workOrder.open_date,
          vehicle_ids: workOrder.vehicle_ids.map(Number).filter(n => n > 0),
        });

        // 2. Reemplazar items (incluye recalculo de total en backend)
        const replacePayload = orderItems.map(item => ({
          item_id: item.item_id,
          type: item.type,
          quantity: item.quantity,
          cost: item.cost,
          price: item.price,
          iva_percentage: item.iva_percentage ?? 21.00,
        }));
        const replaceResp = await workOrderService.replaceItems(workOrderId, replacePayload);
        if (replaceResp.data.error) {
          throw new Error(replaceResp.data.error);
        }
        notifySuccess('Remito e items actualizados exitosamente');
      } else {
        const payload = {
          workOrder: {
            id_customer: parseInt(workOrder.id_customer),
            vehicle_ids: workOrder.vehicle_ids.map(Number).filter(n => n > 0),
            id_warehouse: parseInt(workOrder.id_warehouse),
            description: workOrder.description,
            km_at_entry: workOrder.km_at_entry ? parseInt(workOrder.km_at_entry) : null,
            external_id: externalId,
            open_date: workOrder.open_date,
          },
          items: orderItems.map(item => ({
            item_id: item.item_id,
            type: item.type,
            quantity: item.quantity,
            cost: item.cost,
            price: item.price,
            iva_percentage: item.iva_percentage ?? 21.00,
          }))
        };
        
        await workOrderService.createComplete(payload);
        notifySuccess('Remito creado exitosamente');
      }
      navigate(-1);
    } catch (err) {
      console.error('Error al guardar orden:', err);
      notifyError('Error al guardar el remito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title={
        <Box display="flex" alignItems="center" gap={2}>
          <span>{isEditing ? `Editar Remito ${workOrder.external_id || '-'}` : "Nuevo Remito"}</span>
          {isEditing && (
            <Chip 
              label={statusInfo.label} 
              color={statusInfo.color}
              size="small"
            />
          )}
        </Box>
      }
      subtitle={isEditing ? "Modificar remito existente" : "Crear remito con items y servicios"}
      onBack={() => navigate(-1)}
      actions={
        isEditing && workOrder.status === 'OPEN' ? (
          <Button
            variant="contained"
            disabled={loading}
            onClick={() => setFacturaModalOpen(true)}
            size="large"
          >
            Generar Factura
          </Button>
        ) : null
      }
    >
      <LoadingOverlay open={loading} message={isEditing ? 'Guardando remito...' : 'Procesando remito...'} />
      
      {/* Cabecera Compacta */}
      <Stack spacing={2} sx={{ mb: 3, width: '100%' }}>
        
        {/* CLIENTE Y VEHÍCULO */}
        <FormSection icon={ContactPhone} label="Cliente y Vehículo">
          <Grid item xs={12} sx={{ width: '100%' }}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <TextField
                label="Cliente"
                value={(() => {
                  const selected = customers.find((c) => String(c.id) === String(workOrder.id_customer));
                  if (!selected) return '';
                  return `#${selected.customer_number || '-'} — ${selected.name}`;
                })()}
                placeholder="Ningún cliente seleccionado..."
                onClick={() => !isEditing && setCustomerSearchOpen(true)}
                InputProps={{ readOnly: true }}
                required
                disabled={isEditing}
                fullWidth
                size="small"
                sx={{
                  cursor: isEditing ? 'default' : 'pointer',
                  '& .MuiInputBase-input': { cursor: isEditing ? 'default' : 'pointer' },
                }}
              />
              {!isEditing && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SearchIcon />}
                  onClick={() => setCustomerSearchOpen(true)}
                  sx={{ mt: 0.5, minWidth: 130, height: 40 }}
                >
                  Buscar
                </Button>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <Autocomplete
              multiple
              options={vehicles.map((v) => ({ ...v, key: String(v.id) }))}
              value={workOrder.vehicle_ids
                .map((id) => vehicles.find((x) => String(x.id) === String(id)))
                .filter(Boolean)
                .map((v) => ({ ...v, key: String(v.id) }))}
              onChange={(e, newValue) => {
                setWorkOrder({ ...workOrder, vehicle_ids: newValue.map((v) => String(v.id)) });
              }}
              getOptionLabel={(option) => [option.plate, option.internal_number].filter(Boolean).join(' · ') || 'Sin patente'}
              isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
              disabled={!workOrder.id_customer}
              fullWidth
              size="small"
              renderOption={(props, option, { selected }) => {
                const { key, ...rest } = props;
                return (
                  <li key={key} {...rest}>
                    {selected ? <CheckBoxIcon sx={{ mr: 1, fontSize: 20, color: 'primary.main' }} /> : <CheckBoxOutlineBlankIcon sx={{ mr: 1, fontSize: 20, color: 'action.active' }} />}
                    <ListItemText primary={option.plate || 'Sin patente'} secondary={option.internal_number ? `N° Interno: ${option.internal_number}` : undefined} />
                  </li>
                );
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      key={key}
                      label={[option.plate, option.internal_number].filter(Boolean).join(' · ') || 'Sin patente'}
                      size="small"
                      deleteIcon={<DeleteIcon />}
                      {...tagProps}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Vehículos"
                  placeholder={workOrder.vehicle_ids.length === 0 ? 'Buscar por patente o n° interno...' : ''}
                  helperText="Podés seleccionar más de un vehículo"
                />
              )}
            />
          </Grid>
        </FormSection>

        {/* REMITO E DEPÓSITO */}
        <FormSection icon={ReceiptLong} label="Remito y Depósito">
          <Grid item xs={12} sm={6}>
            <TextField
              label="N° de Remito"
              value={workOrder.external_id}
              onChange={(e) => setWorkOrder({...workOrder, external_id: e.target.value})}
              required
              fullWidth
              size="small"
              placeholder="000123"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              select
              label="Depósito"
              value={workOrder.id_warehouse}
              onChange={(e) => setWorkOrder({ ...workOrder, id_warehouse: e.target.value })}
              required
              fullWidth
              size="small"
            >
              {warehouses.map((warehouse) => (
                <MenuItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="KM al ingreso"
              type="number"
              value={workOrder.km_at_entry}
              onChange={(e) => setWorkOrder({...workOrder, km_at_entry: e.target.value})}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha"
              type="date"
              value={workOrder.open_date}
              onChange={(e) => setWorkOrder({...workOrder, open_date: e.target.value})}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descripción del trabajo"
              value={workOrder.description}
              onChange={(e) => setWorkOrder({...workOrder, description: e.target.value})}
              fullWidth
              multiline
              rows={2}
              size="small"
              placeholder="Detalles del trabajo a realizar..."
            />
          </Grid>
        </FormSection>
        
      </Stack>

      {/* Remito Modal */}
      <StyledDialog
        open={remitoModalOpen}
        onClose={() => setRemitoModalOpen(false)}
        maxWidth="sm"
        title="Generar Remito"
        subtitle="Completa los datos adicionales del remito"
        actions={(
          <>
            <Button onClick={() => setRemitoModalOpen(false)} variant="outlined">Cancelar</Button>
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  setLoading(true)
                  const resp = await deliveryNoteService.createFromWorkOrder(workOrderId, remitoForm)
                  const data = resp.data
                  if (data.error) throw new Error(data.error)
                  notifySuccess(`Remito ${data.number} creado (N° de Remito: ${data.id_external || remitoForm.id_external || 'N/A'})`)
                  setRemitoModalOpen(false)
                  setRemitoForm({ id_external: '', notes: '' })
                } catch (e) {
                  console.error(e)
                  notifyError('Error al generar remito')
                } finally {
                  setLoading(false)
                }
              }}
            >Crear</Button>
          </>
        )}
      >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="N° de Remito"
                  value={remitoForm.id_external}
                  onChange={(e) => setRemitoForm({ ...remitoForm, id_external: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notas"
                  value={remitoForm.notes}
                  onChange={(e) => setRemitoForm({ ...remitoForm, notes: e.target.value })}
                  fullWidth
                  multiline
                  minRows={2}
                />
              </Grid>
            </Grid>
      </StyledDialog>

      {/* Factura Modal */}
      <StyledDialog
        open={facturaModalOpen}
        onClose={() => setFacturaModalOpen(false)}
        maxWidth="sm"
        title="Generar Factura"
        subtitle="Selecciona el tipo e informa el ID AFIP si corresponde"
        actions={(
          <>
            <Button onClick={() => setFacturaModalOpen(false)} variant="outlined">Cancelar</Button>
            <Button
              variant="contained"
              onClick={async () => {
                try {
                  setLoading(true)
                  const resp = await invoiceService.createFromWorkOrder(workOrderId, facturaForm)
                  const data = resp.data
                  if (data.error) throw new Error(data.error)
                  await loadWorkOrderData()
                  notifySuccess(`Factura ${data.number} (Tipo ${facturaForm.invoice_type}) creada (AFIP: ${data.id_afip || facturaForm.id_afip || 'N/A'})`)
                  setFacturaModalOpen(false)
                  setFacturaForm({ id_afip: '', invoice_type: 'A', invoice_date: new Date().toISOString().split('T')[0] })
                } catch (e) {
                  if (e.response?.status === 409 && e.response?.data?.duplicate) {
                    setDuplicateInvoice(e.response.data)
                    return
                  }
                  console.error(e)
                  notifyError('Error al generar factura')
                } finally {
                  setLoading(false)
                }
              }}
              disabled={workOrder.status !== 'OPEN'}
            >Crear</Button>
          </>
        )}
      >
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Tipo de Factura"
                  value={facturaForm.invoice_type}
                  onChange={(e) => setFacturaForm({ ...facturaForm, invoice_type: e.target.value })}
                  fullWidth
                  required
                >
                  <MenuItem value="A">Factura A</MenuItem>
                  <MenuItem value="B">Factura B</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="N° de Factura"
                  type="number"
                  value={facturaForm.id_afip}
                  onChange={(e) => setFacturaForm({ ...facturaForm, id_afip: e.target.value })}
                  fullWidth
                  inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Fecha de Factura"
                  type="date"
                  value={facturaForm.invoice_date}
                  onChange={(e) => setFacturaForm({ ...facturaForm, invoice_date: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
      </StyledDialog>

      {/* Cartel de factura ya existente (varios remitos con el mismo nro AFIP) */}
      <StyledDialog
        open={!!duplicateInvoice}
        onClose={() => setDuplicateInvoice(null)}
        maxWidth="sm"
        title="La factura ya existe"
        subtitle="Este número AFIP ya está asociado a otro remito"
        actions={(
          <>
            <Button onClick={() => setDuplicateInvoice(null)} variant="outlined" disabled={loading}>Cancelar</Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleMergeDuplicate}
              disabled={loading}
            >Sumar a la factura</Button>
          </>
        )}
      >
        <Stack spacing={1.5}>
          <Typography variant="body1">
            La factura AFIP <b>{facturaForm.id_afip}</b> ya está asociada al remito{' '}
            <b>{duplicateInvoice?.existing_remito || 'sin número'}</b> por un total de{' '}
            <b>{formatCurrency(duplicateInvoice?.existing_total)}</b>.
          </Typography>
          <Typography variant="body1">
            Si confirmás, este remito (<b>{formatCurrency(remitoTotal)}</b>) se suma a esa factura y
            el total quedará en <b>{formatCurrency(duplicateInvoice?.new_total)}</b>.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            El remito quedará facturado y su monto pasará a formar parte de la factura existente.
          </Typography>
        </Stack>
      </StyledDialog>

      {/* Tabla de Items */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Items del Remito</Typography>

          {/* Search and Add Products */}
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SearchIcon />}
                  onClick={() => setProductSearchOpen(true)}
                  size="large"
                  sx={{ height: 40 }}
                >
                  Buscar productos
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Tabla de items */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>Cant.</TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>Costo Unit.</TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>Precio Unit.</TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>Subtotal</TableCell>
                  <TableCell align="center" sx={{ py: 0.75 }}>IVA %</TableCell>
                  <TableCell align="right" sx={{ py: 0.75 }}>IVA $</TableCell>
                  <TableCell align="right" sx={{ py: 0.75, fontWeight: 'bold' }}>Valor Factura</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orderItems.map((item) => (
                  <TableRow key={item.id} sx={{ '& td': { py: 0.5 } }}>
                    <TableCell sx={{ py: 0.5 }}>{item.name}</TableCell>
                    <TableCell align="center">
                        <TextField
                          size="small"
                          type="number"
                          value={editingValues[`${item.id}-quantity`] ?? item.quantity}
                          onChange={(e) => handleOrderItemChange(item.id, 'quantity', e.target.value)}
                          onBlur={() => handleItemBlur(item.id, 'quantity')}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                          disabled={isInvoiced}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={editingValues[`${item.id}-cost`] ?? item.cost}
                          onChange={(e) => handleOrderItemChange(item.id, 'cost', e.target.value)}
                          onBlur={() => handleItemBlur(item.id, 'cost')}
                          sx={{ width: 140 }}
                          disabled={isInvoiced}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={editingValues[`${item.id}-price`] ?? item.price}
                          onChange={(e) => handleOrderItemChange(item.id, 'price', e.target.value)}
                          onBlur={() => handleItemBlur(item.id, 'price')}
                          sx={{ width: 140 }}
                          disabled={isInvoiced}
                        />
                      </TableCell>
                    <TableCell align="right">{formatCurrency(item.price * item.quantity)}</TableCell>
                    <TableCell align="center">
                      <TextField
                        select
                        size="small"
                        value={item.iva_percentage ?? 21.00}
                        onChange={(e) => handleOrderItemChange(item.id, 'iva_percentage', parseFloat(e.target.value))}
                        sx={{ width: 85 }}
                        disabled={isInvoiced}
                      >
                        <MenuItem value={0}>0%</MenuItem>
                        <MenuItem value={10.5}>10.5%</MenuItem>
                        <MenuItem value={21}>21%</MenuItem>
                        <MenuItem value={27}>27%</MenuItem>
                      </TextField>
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency((item.price * item.quantity) * ((item.iva_percentage ?? 21) / 100))}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.50' }}>
                      {formatCurrency((item.price * item.quantity) * (1 + (item.iva_percentage ?? 21) / 100))}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => handleRemoveItem(item.id)}
                        size="small"
                        disabled={isInvoiced}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                
              </TableBody>
            </Table>
          </TableContainer>

          {/* Empty State Message */}
          {orderItems.length === 0 && (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
              <Typography variant="body1" gutterBottom>
                Sin items agregados
              </Typography>
              <Typography variant="body2">
                Usa la búsqueda rápida arriba para agregar productos o servicios (Ctrl+K)
              </Typography>
            </Box>
          )}

          {/* Totales */}
          {orderItems.length > 0 && (
            <Box
              sx={{
                mt: 3,
                p: 2.5,
                bgcolor: 'background.paper',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'grey.200',
                boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
                position: { md: 'sticky' },
                bottom: 16,
                zIndex: 10,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>COSTO</Typography>
                  <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 700 }}>
                    {formatCurrency(totalCost)}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>SUBTOTAL (SIN IVA)</Typography>
                  <Typography variant="h6" sx={{ color: '#2196f3', fontWeight: 700 }}>
                    {formatCurrency(totalPrice)}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={2}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>IVA</Typography>
                  <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 700 }}>
                    {formatCurrency(totalIva)}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5, color: 'success.dark' }}>MONTO DEL REMITO</Typography>
                  <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 800 }}>
                    {formatCurrency(totalInvoice)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    size="large"
                    disabled={loading || isInvoiced}
                    sx={{ py: 1.5 }}
                  >
                    {loading ? 'Guardando...' : (isEditing ? 'Actualizar Remito' : 'Guardar Remito')}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>

      <ProductSearchModal
        open={productSearchOpen}
        onClose={() => setProductSearchOpen(false)}
        items={items}
        categories={categories}
        onAddItem={handleModalAddItem}
      />

      <CustomerSearchModal
        open={customerSearchOpen}
        onClose={() => setCustomerSearchOpen(false)}
        customers={customers}
        onSelect={(customer) => {
          setWorkOrder((prev) => ({
            ...prev,
            id_customer: customer.id,
            vehicle_ids: [],
          }));
        }}
      />
    </PageLayout>
  );
}

export default WorkOrderForm;
