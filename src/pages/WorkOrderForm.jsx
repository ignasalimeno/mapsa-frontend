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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from "@mui/icons-material";
import { PageLayout } from '../components';
import { customerService, vehicleService, itemService, tagService, warehouseService, workOrderService, invoiceService, deliveryNoteService } from '../services/api';
import { formatCurrency, formatNumber } from '../utils/formatters';

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
  const [itemFilterType, setItemFilterType] = useState('ALL');
  const [itemFilterTags, setItemFilterTags] = useState([]);
  
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
          iva_percentage: item.iva_percentage || 21.00,
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

  const calculateTotals = () => {
    const totalCost = Math.round(orderItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0));
    const totalPrice = Math.round(orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0));
    const totalIva = Math.round(orderItems.reduce((sum, item) => {
      const subtotal = item.price * item.quantity;
      const iva = subtotal * ((item.iva_percentage ?? 21) / 100);
      return sum + iva;
    }, 0));
    const totalInvoice = Math.round(totalPrice + totalIva);
    const profit = Math.round(totalPrice - totalCost);
    
    return { totalCost, totalPrice, totalIva, totalInvoice, profit };
  };

  const { totalCost, totalPrice, totalIva, totalInvoice, profit } = calculateTotals();

  const filteredItemsForPicker = items.filter((item) => {
    const normalizedSearch = itemSearchTerm.trim().toLowerCase();
    const normalizedItemType = (item.type || '').toUpperCase();
    const selectedTagIds = itemFilterTags.map((id) => Number(id));

    const matchesSearch = !normalizedSearch
      || (item.name || '').toLowerCase().includes(normalizedSearch)
      || (item.code || '').toLowerCase().includes(normalizedSearch);

    const matchesType = itemFilterType === 'ALL' || normalizedItemType === itemFilterType;

    const matchesTags = selectedTagIds.length === 0
      || (item.tags || []).some((tag) => selectedTagIds.includes(Number(tag.id)));

    return matchesSearch && matchesType && matchesTags;
  });

  const handleSave = async () => {
    if (!workOrder.id_customer || !workOrder.id_warehouse || orderItems.length === 0) {
      alert('Por favor completa cliente, depósito y al menos un item');
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
          external_id: workOrder.external_id,
        });

        // 2. Reemplazar items (incluye recalculo de total en backend)
        const replacePayload = orderItems.map(item => ({
          item_id: item.item_id,
          type: item.type,
          quantity: item.quantity,
          cost: item.cost,
          price: item.price,
          iva_percentage: item.iva_percentage || 21.00,
        }));
        const replaceResp = await workOrderService.replaceItems(workOrderId, replacePayload);
        if (replaceResp.data.error) {
          throw new Error(replaceResp.data.error);
        }
        alert('Remito e items actualizados exitosamente');
      } else {
        const payload = {
          workOrder: {
            id_customer: parseInt(workOrder.id_customer),
            id_vehicle: workOrder.id_vehicle ? parseInt(workOrder.id_vehicle) : null,
            id_warehouse: parseInt(workOrder.id_warehouse),
            description: workOrder.description,
            km_at_entry: workOrder.km_at_entry ? parseInt(workOrder.km_at_entry) : null,
            external_id: workOrder.external_id,
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
        alert('Remito creado exitosamente');
      }
      navigate(-1);
    } catch (err) {
      console.error('Error al guardar orden:', err);
      alert('Error al guardar el remito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout
      title={
        <Box display="flex" alignItems="center" gap={2}>
          <span>{isEditing ? `Editar Remito #${workOrderId}` : "Nuevo Remito"}</span>
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
      {/* Cabecera - Datos del Cliente y Vehículo */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Información General</Typography>
          
          <Grid container spacing={3}>
            {/* Selección de Cliente */}
            <Grid item xs={12} md={6}>
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
                sx={{ width: 300 }}
              >
                <MenuItem value="">Seleccionar cliente...</MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name} - {customer.document_number}
                  </MenuItem>
                ))}
              </TextField>
              {selectedCustomer && (
                <Box mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Teléfono:</strong> {selectedCustomer.phone || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Email:</strong> {selectedCustomer.email || 'N/A'}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Selección de Vehículo */}
            <Grid item xs={12} md={6}>
              <TextField
                select
                label="Vehículo"
                value={workOrder.id_vehicle}
                onChange={(e) => setWorkOrder({...workOrder, id_vehicle: e.target.value})}
                disabled={!workOrder.id_customer || isEditing}
                sx={{ width: 280 }}
              >
                <MenuItem value="">Sin vehículo</MenuItem>
                {vehicles.map((vehicle) => (
                  <MenuItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} - {vehicle.plate}
                  </MenuItem>
                ))}
              </TextField>
              {selectedVehicle && (
                <Box mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Año:</strong> {selectedVehicle.year || 'N/A'} | 
                    <strong> KM:</strong> {formatNumber(selectedVehicle.current_km) || '0'}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Campos de la Orden */}
            <Grid item xs={12}>
              <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                <TextField
                  select
                  label="Depósito"
                  value={workOrder.id_warehouse}
                  onChange={(e) => setWorkOrder({ ...workOrder, id_warehouse: e.target.value })}
                  required
                  sx={{ width: 240 }}
                >
                  {warehouses.map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="N° de Remito"
                  value={workOrder.external_id}
                  onChange={(e) => setWorkOrder({...workOrder, external_id: e.target.value})}
                  sx={{ width: 180 }}
                  placeholder="Ej: 000123"
                />
                <TextField
                  label="KM al ingreso"
                  type="number"
                  value={workOrder.km_at_entry}
                  onChange={(e) => setWorkOrder({...workOrder, km_at_entry: e.target.value})}
                  sx={{ width: 150 }}
                />
                <TextField
                  label="Descripción del trabajo"
                  value={workOrder.description}
                  onChange={(e) => setWorkOrder({...workOrder, description: e.target.value})}
                  sx={{ flexGrow: 1, minWidth: 400 }}
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Remito Modal */}
      {remitoModalOpen && (
        <Card sx={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 1300, minWidth: 420 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Generar Remito</Typography>
              <Button size="small" onClick={() => setRemitoModalOpen(false)}>Cerrar</Button>
            </Box>
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
              <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
                <Button onClick={() => setRemitoModalOpen(false)}>Cancelar</Button>
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      const resp = await deliveryNoteService.createFromWorkOrder(workOrderId, remitoForm)
                      const data = resp.data
                      if (data.error) throw new Error(data.error)
                      alert(`Remito ${data.number} creado (N° de Remito: ${data.id_external || remitoForm.id_external || 'N/A'})`)
                      setRemitoModalOpen(false)
                      setRemitoForm({ id_external: '', notes: '' })
                    } catch (e) {
                      console.error(e)
                      alert('Error al generar remito')
                    }
                  }}
                >Crear</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Factura Modal */}
      {facturaModalOpen && (
        <Card sx={{ position: 'fixed', top: '25%', left: '50%', transform: 'translateX(-50%)', zIndex: 1300, minWidth: 380 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Generar Factura</Typography>
              <Button size="small" onClick={() => setFacturaModalOpen(false)}>Cerrar</Button>
            </Box>
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
                  label="ID AFIP"
                  value={facturaForm.id_afip}
                  onChange={(e) => setFacturaForm({ ...facturaForm, id_afip: e.target.value })}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} display="flex" justifyContent="flex-end" gap={1}>
                <Button onClick={() => setFacturaModalOpen(false)}>Cancelar</Button>
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      const resp = await invoiceService.createFromWorkOrder(workOrderId, facturaForm)
                      const data = resp.data
                      if (data.error) throw new Error(data.error)
                      await loadWorkOrderData()
                      alert(`Factura ${data.number} (Tipo ${facturaForm.invoice_type}) creada (AFIP: ${data.id_afip || facturaForm.id_afip || 'N/A'})`)
                      setFacturaModalOpen(false)
                      setFacturaForm({ id_afip: '', invoice_type: 'A' })
                    } catch (e) {
                      console.error(e)
                      alert('Error al generar factura')
                    }
                  }}
                  disabled={workOrder.status !== 'OPEN'}
                >Crear</Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Items */}
      <Card>
        <CardContent>
          <Typography variant="h6" mb={2}>Items del Remito</Typography>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Buscar item"
                placeholder="Nombre o código..."
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Tipo</InputLabel>
                <Select
                  value={itemFilterType}
                  label="Tipo"
                  onChange={(e) => setItemFilterType(e.target.value)}
                >
                  <MenuItem value="ALL">Todos</MenuItem>
                  <MenuItem value="PRODUCT">Producto</MenuItem>
                  <MenuItem value="SERVICE">Servicio</MenuItem>
                  <MenuItem value="EXTRA_CHARGE">Gasto Extra</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Tags</InputLabel>
                <Select
                  multiple
                  value={itemFilterTags}
                  label="Tags"
                  onChange={(e) => setItemFilterTags(e.target.value)}
                  renderValue={() => (
                    itemFilterTags.length > 0
                      ? `${itemFilterTags.length} tag(s)`
                      : 'Seleccionar tags'
                  )}
                >
                  {tags.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                size="small"
                onClick={() => {
                  setItemSearchTerm('');
                  setItemFilterType('ALL');
                  setItemFilterTags([]);
                }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>

          {/* Tabla de items */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Tipo</TableCell>
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
                    <TableCell>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          bgcolor: (() => {
                            const t = (item.type || '').toString().toLowerCase();
                            if (t === 'product' || t === 'producto') return 'success.light';
                            if (t === 'service' || t === 'servicio') return 'primary.light';
                            if (t === 'extra_cost' || t === 'costo_extra') return 'warning.light';
                            return 'grey.500';
                          })(),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      >
                        {(() => {
                          const t = (item.type || '').toString().toLowerCase();
                          if (t === 'product' || t === 'producto') return 'producto';
                          if (t === 'service' || t === 'servicio') return 'servicio';
                          if (t === 'extra_cost' || t === 'costo_extra') return 'costo extra';
                          return t || 'item';
                        })()}
                      </Typography>
                    </TableCell>
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
                    <TableCell align="right">{formatCurrency(item.price * item.quantity, false)}</TableCell>
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
                      {formatCurrency((item.price * item.quantity) * ((item.iva_percentage ?? 21) / 100), false)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.50' }}>
                      {formatCurrency((item.price * item.quantity) * (1 + (item.iva_percentage ?? 21) / 100), false)}
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
                
                {/* Fila para agregar nuevo item */}
                {!isInvoiced && (
                <TableRow sx={{ bgcolor: 'grey.50', '& td': { py: 0.5 } }}>
                  <TableCell>
                    <TextField
                      select
                      size="small"
                      placeholder="Seleccionar item..."
                      value={newItem.item_id}
                      onChange={(e) => handleItemChange('item_id', e.target.value)}
                      variant="outlined"
                      sx={{ width: 250 }}
                    >
                      <MenuItem value="">Seleccionar...</MenuItem>
                      {filteredItemsForPicker.map((item) => (
                        <MenuItem key={item.id} value={item.id}>
                          {item.name} ({item.type})
                        </MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    {newItem.item_id && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1, 
                          bgcolor: (() => {
                            const selectedItem = items.find(item => item.id === parseInt(newItem.item_id));
                            const t = (selectedItem?.type || '').toString().toLowerCase();
                            if (t === 'product' || t === 'producto') return 'success.light';
                            if (t === 'service' || t === 'servicio') return 'primary.light';
                            if (t === 'extra_cost' || t === 'costo_extra') return 'warning.light';
                            return 'grey.500';
                          })(),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      >
                        {(() => {
                          const t = items.find(item => item.id === parseInt(newItem.item_id))?.type?.toString().toLowerCase();
                          if (t === 'product' || t === 'producto') return 'producto';
                          if (t === 'service' || t === 'servicio') return 'servicio';
                          if (t === 'extra_cost' || t === 'costo_extra') return 'costo extra';
                          return t || 'item';
                        })()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      size="small"
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => handleItemChange('quantity', parseInt(e.target.value) || 1)}
                      inputProps={{ min: 1, style: { textAlign: 'center' } }}
                      sx={{ width: 70 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="text"
                      value={newItem.costRaw}
                      onChange={(e) => handleItemChange('costRaw', e.target.value)}
                      placeholder={newItem.cost ? formatNumber(newItem.cost) : ''}
                      sx={{ width: 160 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <TextField
                      size="small"
                      type="text"
                      value={newItem.priceRaw}
                      onChange={(e) => handleItemChange('priceRaw', e.target.value)}
                      placeholder={newItem.price ? formatNumber(newItem.price) : ''}
                      sx={{ width: 160 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(((newItem.priceRaw ? parseCommasToNumber(newItem.priceRaw) : (newItem.price || 0)) * newItem.quantity), false)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      select
                      size="small"
                      value={newItem.iva_percentage}
                      onChange={(e) => handleItemChange('iva_percentage', parseFloat(e.target.value))}
                      sx={{ width: 85 }}
                    >
                      <MenuItem value={0}>0%</MenuItem>
                      <MenuItem value={10.5}>10.5%</MenuItem>
                      <MenuItem value={21}>21%</MenuItem>
                      <MenuItem value={27}>27%</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary">
                      {(() => {
                        const price = newItem.priceRaw ? parseCommasToNumber(newItem.priceRaw) : (newItem.price || 0);
                        const subtotal = price * newItem.quantity;
                        const iva = subtotal * ((newItem.iva_percentage ?? 21) / 100);
                        return formatCurrency(iva, false);
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                      {(() => {
                        const price = newItem.priceRaw ? parseCommasToNumber(newItem.priceRaw) : (newItem.price || 0);
                        const subtotal = price * newItem.quantity;
                        const iva = subtotal * ((newItem.iva_percentage ?? 21) / 100);
                        return formatCurrency(subtotal + iva, false);
                      })()}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      color="primary"
                      onClick={handleAddItem}
                      disabled={!newItem.item_id}
                      size="small"
                    >
                      <AddIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                )}
                
                {orderItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">
                        Selecciona un item en la fila de abajo para comenzar
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Totales */}
          {orderItems.length > 0 && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary">Total Costo</Typography>
                  <Typography variant="h6" sx={{ color: '#f44336' }}>
                    {formatCurrency(totalCost, false)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary">Subtotal (sin IVA)</Typography>
                  <Typography variant="h6" sx={{ color: '#2196f3' }}>
                    {formatCurrency(totalPrice, false)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary">Total IVA</Typography>
                  <Typography variant="h6" sx={{ color: '#ff9800' }}>
                    {formatCurrency(totalIva, false)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={2.4}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>TOTAL FACTURA</Typography>
                  <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                    {formatCurrency(totalInvoice, false)}
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