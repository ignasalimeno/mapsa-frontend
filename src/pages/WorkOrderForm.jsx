import { useState, useEffect, useRef } from "react";
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
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Autocomplete,
  Container,
  Stack,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ReceiptLong,
  ContactPhone,
  DirectionsCar,
} from "@mui/icons-material";
import { LoadingOverlay, PageLayout, StyledDialog, TagMultiSelect } from '../components';
import { customerService, vehicleService, itemService, tagService, warehouseService, workOrderService, invoiceService, deliveryNoteService } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';
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
  const preselectedVehicleId = searchParams.get('vehicle_id');
  const isEditing = !!workOrderId;
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [items, setItems] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [itemFilterTags, setItemFilterTags] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [selectedItemForAdd, setSelectedItemForAdd] = useState(null);
  const autocompleteRef = useRef(null);
  const { error: notifyError, success: notifySuccess } = useNotify();
  
  const [workOrder, setWorkOrder] = useState({
    id_customer: preselectedCustomerId || "",
    id_vehicle: preselectedVehicleId || "",
    id_warehouse: "",
    description: "",
    km_at_entry: "",
    status: 'OPEN',
    external_id: "",
  });

  const [remitoModalOpen, setRemitoModalOpen] = useState(false);
  const [facturaModalOpen, setFacturaModalOpen] = useState(false);
  const [remitoForm, setRemitoForm] = useState({ id_external: '', notes: '' });
  const [facturaForm, setFacturaForm] = useState({ id_afip: '', invoice_type: 'A' });
  
  const [orderItems, setOrderItems] = useState([]);
  const defaultItemNames = [
    'M/obra','M/obra TC','Peajes','Nafta','Viaticos','Ley 25413 (1,5 %)','F/C','Inteses Bco','Mantenimiento',
    'VMP/MC/DS/GG','Recupero Gastos','Inteses CV','HC','SEGURO','Precintos x unidad','Cinta Aisladora 10 mts',
    'Autoperforantes x unidad','La Gotita 2 ml','Teflon','Estaño','Bonus Track','NAMEPE','GASTOS EXTERNOS',
    'SICORE MC 12/2024','BT','RECUPERO','VARIOS','INTERES BANCO','OTROS 1','OTROS 2'
  ];
  const [newItem, setNewItem] = useState({
    item_id: "",
    quantity: 1,
    cost: "",
    price: "",
    costRaw: "",
    priceRaw: "",
    iva_percentage: 21.00,
  });

  // Removed local formatNumber - using imported formatCurrency/formatNumber

  const formatRawWithCommas = (raw) => {
    if (raw === undefined || raw === null) return "";
    // Mantener solo dígitos
    const digits = String(raw).replace(/\D/g, "");
    if (!digits) return "";
    // Insertar comas de miles
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseCommasToNumber = (raw) => {
    if (raw === undefined || raw === null || raw === "") return 0;
    const digits = String(raw).replace(/,/g, "");
    const num = parseFloat(digits);
    return isNaN(num) ? 0 : num;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN': return 'info';
      case 'IN_PROGRESS': return 'warning';
      case 'READY': return 'success';
      case 'INVOICED': return 'primary';
      case 'CANCELLED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'OPEN': return 'Abierto';
      case 'IN_PROGRESS': return 'En Progreso';
      case 'READY': return 'Listo';
      case 'INVOICED': return 'Facturado';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  const isInvoiced = workOrder.status === 'INVOICED';

  useEffect(() => {
    loadCustomers();
    loadWarehouses();
    loadItems();
    if (isEditing) {
      loadWorkOrderData();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd+K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        autocompleteRef.current?.focus();
      }
      // Escape to clear search
      if (e.key === 'Escape' && itemSearchTerm) {
        setItemSearchTerm('');
        setSelectedItemForAdd(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [itemSearchTerm]);

  const loadWorkOrderData = async () => {
    try {
      const workOrderResponse = await workOrderService.getById(workOrderId);
      const workOrderData = workOrderResponse.data;
      
      setWorkOrder({
        id_customer: workOrderData.customer_id,
        id_vehicle: workOrderData.vehicle_id,
        id_warehouse: workOrderData.warehouse_id || '',
        description: workOrderData.description || '',
        km_at_entry: workOrderData.km_at_entry || '',
        status: workOrderData.status || 'OPEN',
        external_id: workOrderData.external_id || '',
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

  useEffect(() => {
    if (workOrder.id_customer) {
      loadVehicles(workOrder.id_customer);
      const customer = customers.find(c => c.id === parseInt(workOrder.id_customer));
      setSelectedCustomer(customer);
    }
  }, [workOrder.id_customer, customers]);

  useEffect(() => {
    if (workOrder.id_vehicle) {
      const vehicle = vehicles.find(v => v.id === parseInt(workOrder.id_vehicle));
      setSelectedVehicle(vehicle);
    }
  }, [workOrder.id_vehicle, vehicles]);

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
      const [itemsResponse, tagsResponse] = await Promise.all([
        itemService.getAll(),
        tagService.getAll(),
      ]);
      setItems(itemsResponse.data);
      setTags(tagsResponse.data || []);
      
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

  const handleAddItem = () => {
    if (!newItem.item_id) return;
    
    const selectedItem = items.find(item => item.id === parseInt(newItem.item_id));
    if (!selectedItem) return;

    const item = {
      id: Date.now(), // ID temporal
      item_id: selectedItem.id,
      name: selectedItem.name,
      type: selectedItem.type,
      quantity: newItem.quantity,
      cost: (newItem.costRaw ? parseCommasToNumber(newItem.costRaw) : (newItem.cost || selectedItem.purchase_price)),
      price: (newItem.priceRaw ? parseCommasToNumber(newItem.priceRaw) : (newItem.price || selectedItem.sale_price)),
    };

    setOrderItems([...orderItems, item]);
    setNewItem({
      item_id: "",
      quantity: 1,
      cost: "",
      price: "",
      costRaw: "",
      priceRaw: "",
      iva_percentage: 21.00,
    });
  };

  const handleRemoveItem = (id) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleOrderItemChange = (id, field, value) => {
    setOrderItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      let v = value;
      if (field === 'quantity') v = parseInt(value) || 1;
      if (field === 'cost' || field === 'price') v = parseFloat(value) || 0;
      return { ...item, [field]: v };
    }));
  };

  const handleItemChange = (field, value) => {
    // Auto-completar precios cuando se selecciona un item
    if (field === 'item_id' && value) {
      const selectedItem = items.find(item => item.id === parseInt(value));
      if (selectedItem) {
        setNewItem({
          ...newItem,
          item_id: value,
          cost: selectedItem.purchase_price,
          price: selectedItem.sale_price,
          costRaw: formatRawWithCommas(selectedItem.purchase_price),
          priceRaw: formatRawWithCommas(selectedItem.sale_price),          iva_percentage: 21.00,        });
      } else {
        setNewItem({ ...newItem, item_id: value });
      }
    } else if (field === 'costRaw') {
      const formatted = formatRawWithCommas(value);
      setNewItem({ ...newItem, costRaw: formatted });
    } else if (field === 'priceRaw') {
      const formatted = formatRawWithCommas(value);
      setNewItem({ ...newItem, priceRaw: formatted });
    } else {
      setNewItem({ ...newItem, [field]: value });
    }
  };

  // Add item from autocomplete and track recent items
  const handleQuickAddItem = (item) => {
    if (!item) return;
    
    // Add to recent items list (keep last 5)
    const updatedRecent = [item.id, ...recentItems.filter(id => id !== item.id)].slice(0, 5);
    setRecentItems(updatedRecent);
    localStorage.setItem('recentWorkOrderItems', JSON.stringify(updatedRecent));
    
    // Add item with qty 1
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
    
    // Clear search and show success message
    setItemSearchTerm('');
    setSelectedItemForAdd(null);
    notifySuccess(`${item.name} agregado`);
    
    // Auto-focus search for next item
    setTimeout(() => autocompleteRef.current?.focus(), 300);
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
    if (!workOrder.id_customer || !workOrder.id_warehouse || !externalId || orderItems.length === 0) {
      notifyError('Por favor completa cliente, depósito, número de remito y al menos un item');
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
            id_vehicle: workOrder.id_vehicle ? parseInt(workOrder.id_vehicle) : null,
            id_warehouse: parseInt(workOrder.id_warehouse),
            description: workOrder.description,
            km_at_entry: workOrder.km_at_entry ? parseInt(workOrder.km_at_entry) : null,
            external_id: externalId,
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
              label={getStatusText(workOrder.status)} 
              color={getStatusColor(workOrder.status)}
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
            <TextField
              select
              label="Cliente"
              value={workOrder.id_customer}
              onChange={(e) => {
                setWorkOrder({...workOrder, id_customer: e.target.value, id_vehicle: ''});
                setSelectedVehicle(null);
              }}
              required
              disabled={isEditing}
              fullWidth
              size="small"
            >
              <MenuItem value="">Seleccionar cliente...</MenuItem>
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} sx={{ width: '100%' }}>
            <TextField
              select
              label="Vehículo"
              value={workOrder.id_vehicle}
              onChange={(e) => setWorkOrder({...workOrder, id_vehicle: e.target.value})}
              disabled={!workOrder.id_customer || isEditing}
              fullWidth
              size="small"
            >
              <MenuItem value="">Sin vehículo</MenuItem>
              {vehicles.map((vehicle) => (
                <MenuItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.brand} {vehicle.model} - {vehicle.plate}
                </MenuItem>
              ))}
            </TextField>
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
                  setFacturaForm({ id_afip: '', invoice_type: 'A' })
                } catch (e) {
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
            </Grid>
      </StyledDialog>

      {/* Tabla de Items */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Items del Remito</Typography>

          {/* Filters Always Visible - Above Search */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Filtros</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TagMultiSelect
                  options={tags}
                  value={itemFilterTags}
                  onChange={setItemFilterTags}
                  label="Tags"
                  placeholder="Seleccione los tags..."
                  sx={{ width: '100%' }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setItemFilterTags([])}
                >
                  Limpiar filtros
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Autocomplete Search Section */}
          <Box sx={{ mb: 3 }}>
            <Autocomplete
              ref={autocompleteRef}
              options={items}
              getOptionLabel={(opt) => `${opt.name}`}
              value={selectedItemForAdd}
              onChange={(e, newValue) => {
                setSelectedItemForAdd(newValue);
                if (newValue) {
                  handleQuickAddItem(newValue);
                }
              }}
              inputValue={itemSearchTerm}
              onInputChange={(e, newInputValue) => {
                setItemSearchTerm(newInputValue);
              }}
              filterOptions={(opts, state) => {
                const input = state.inputValue.toLowerCase();
                
                // Filter by search term (if any)
                let filtered = opts;
                if (input) {
                  filtered = opts.filter(item => 
                    item.name.toLowerCase().includes(input) || 
                    (item.code || '').toLowerCase().includes(input)
                  );
                }
                
                // Apply tag filtering (always, even without search)
                if (itemFilterTags.length > 0) {
                  const selectedTagIds = itemFilterTags.map((id) => Number(id));
                  filtered = filtered.filter(item =>
                    (item.tags || []).some((tag) => selectedTagIds.includes(Number(tag.id)))
                  );
                }
                
                return filtered;
              }}
              noOptionsText="Sin resultados"
              placeholder="Búsqueda rápida"
              fullWidth
              size="small"
              ListboxProps={{
                sx: {
                  maxHeight: 400,
                  '& .MuiAutocomplete-option': {
                    alignItems: 'flex-start',
                    py: 1.25,
                    px: 1.5,
                    borderBottom: '1px solid #e3e8ee',
                    backgroundColor: 'var(--row-bg) !important',
                  },
                  '& .MuiAutocomplete-option:hover': {
                    backgroundColor: 'var(--row-bg) !important',
                  },
                  '& .MuiAutocomplete-option.Mui-focused': {
                    backgroundColor: 'var(--row-bg) !important',
                  },
                  '& .MuiAutocomplete-option[aria-selected="true"]': {
                    backgroundColor: 'var(--row-bg) !important',
                  },
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Agregar producto o servicio"
                  placeholder="Escribe nombre o código..."
                />
              )}
              renderOption={(props, option, state) => (
                <li
                  {...props}
                  style={{
                    ...props.style,
                    '--row-bg': state.index % 2 === 0 ? '#f7fbff' : '#f8fcf8',
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '1rem', mb: 0.5 }}>
                      {option.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 0.75 }}>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        Costo: {formatCurrency(option.purchase_price || 0)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                        Venta: {formatCurrency(option.sale_price || 0)}
                      </Typography>
                    </Box>
                    {option.tags && option.tags.length > 0 && (
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.75 }}>
                        {option.tags.map((tag) => (
                          <Chip
                            key={tag.id}
                            label={tag.name}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: '20px',
                              fontSize: '0.7rem',
                              bgcolor: 'rgba(25, 118, 210, 0.08)',
                              borderColor: 'rgba(25, 118, 210, 0.3)',
                              color: '#1976d2',
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                </li>
              )}
            />
            
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
                          value={item.quantity}
                          onChange={(e) => handleOrderItemChange(item.id, 'quantity', e.target.value)}
                          inputProps={{ min: 1, style: { textAlign: 'center' } }}
                          sx={{ width: 80 }}
                          disabled={isInvoiced}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.cost}
                          onChange={(e) => handleOrderItemChange(item.id, 'cost', e.target.value)}
                          sx={{ width: 140 }}
                          disabled={isInvoiced}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          size="small"
                          type="number"
                          value={item.price}
                          onChange={(e) => handleOrderItemChange(item.id, 'price', e.target.value)}
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
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary">Total Costo</Typography>
                  <Typography variant="h6" sx={{ color: '#f44336' }}>
                    {formatCurrency(totalCost)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary">Subtotal (sin IVA)</Typography>
                  <Typography variant="h6" sx={{ color: '#2196f3' }}>
                    {formatCurrency(totalPrice)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary">Total IVA</Typography>
                  <Typography variant="h6" sx={{ color: '#ff9800' }}>
                    {formatCurrency(totalIva)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>MONTO DEL REMITO (TOTAL FACTURA)</Typography>
                  <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {formatCurrency(totalInvoice)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    size="large"
                    disabled={loading || isInvoiced}
                  >
                    {loading ? 'Guardando...' : (isEditing ? 'Actualizar Remito' : 'Guardar Remito')}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}

export default WorkOrderForm;