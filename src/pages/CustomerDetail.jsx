import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
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
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  AccountBalance as AccountIcon,
  Save as SaveIcon,
  DirectionsCar,
  Notes,
} from "@mui/icons-material";
import {
  customerService,
  vehicleService,
  workOrderService,
  accountService,
} from "../services/api";
import { LoadingOverlay, PageLayout, StyledDialog, TableActionIconButton } from '../components';
import { formatCurrency, formatDate, formatNumber } from '../utils/formatters';
import { useNotify } from '../context';

const PROVINCES = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Cordoba',
  'Corrientes',
  'Entre Rios',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquen',
  'Rio Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucuman',
]

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

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleSearchTerm, setVehicleSearchTerm] = useState('');
  const [workOrders, setWorkOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const { error: notifyError, success: notifySuccess } = useNotify();

  // Estados para modales
  const [vehicleDialog, setVehicleDialog] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    brand: "",
    model: "",
    year: "",
    plate: "",
    engine: "",
    vin: "",
    current_km: "",
    notes: "",
  });

  const invoiceStatusMap = {
    NEW: { label: 'Pendiente', color: 'warning' },
    PARTIAL_PAID: { label: 'Parcial', color: 'info' },
    PAID: { label: 'Pagada', color: 'success' },
    CANCELLED: { label: 'Anulada', color: 'error' },
  }

  useEffect(() => {
    loadCustomerData();
  }, [id]);
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const resp = await accountService.listCustomerInvoices(id)
        setInvoices(resp.data)
      } catch (e) {
        console.error(e)
        setInvoices([])
      }
    }
    if (id) loadInvoices()
  }, [id])

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [customerRes, vehiclesRes, workOrdersRes] = await Promise.all([
        customerService.getById(id),
        vehicleService.getAll(id),
        workOrderService.getAll({ customer_id: id }),
      ]);

      setCustomer(customerRes.data);
      setEditForm(customerRes.data);
      setVehicles(vehiclesRes.data);
      setWorkOrders(workOrdersRes.data);
    } catch (err) {
      setError("Error al cargar datos del cliente");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async () => {
    try {
      await vehicleService.create({
        ...newVehicle,
        id_customer: parseInt(id),
        year: newVehicle.year ? parseInt(newVehicle.year) : null,
        current_km: newVehicle.current_km ? parseInt(newVehicle.current_km) : 0,
      });
      setVehicleDialog(false);
      setNewVehicle({
        brand: "",
        model: "",
        year: "",
        plate: "",
        engine: "",
        vin: "",
        current_km: "",
        notes: "",
      });
      await loadCustomerData();
      notifySuccess('Vehículo agregado correctamente');
    } catch (err) {
      console.error("Error al crear vehículo:", err);
      notifyError('No se pudo crear el vehículo');
    }
  };

  const handleSaveCustomer = async () => {
    try {
      await customerService.update(id, editForm);
      setCustomer(editForm);
      setIsEditing(false);
      notifySuccess('Cliente actualizado correctamente');
    } catch (err) {
      console.error("Error al actualizar cliente:", err);
      setError("Error al guardar cambios");
      notifyError('No se pudieron guardar los cambios');
    }
  };

  const handleCancelEdit = () => {
    setEditForm(customer);
    setIsEditing(false);
  };

  const filteredVehicles = vehicles.filter((vehicle) => {
    if (!vehicleSearchTerm.trim()) return true;
    return (vehicle.plate || '').toLowerCase().includes(vehicleSearchTerm.toLowerCase());
  });

  const getWorkOrderPlate = (vehicleId) => {
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    return vehicle?.plate || '-'
  }

  const getWorkOrderAmount = (workOrder) => {
    if (workOrder.status !== 'INVOICED') return null
    return Number(workOrder.final_total || 0)
  }

  if (loading) {
    return (
      <PageLayout
        title="Detalle del Cliente"
        subtitle="Información completa y gestión de vehículos y órdenes"
      >
        <LoadingOverlay open={loading} message="Cargando cliente..." />
      </PageLayout>
    )
  }

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!customer) return <Alert severity="error">Cliente no encontrado</Alert>;

  return (
    <PageLayout
      title="Detalle del Cliente"
      subtitle="Información completa y gestión de vehículos y órdenes"
    >
        {/* Balance de Cuenta Corriente */}
        <Card sx={{ mb: 3, background: Number(customer.balance || 0) > 0 ? 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' : 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Cuenta Corriente
                </Typography>
                <Typography variant="h3" fontWeight={700} color={Number(customer.balance || 0) > 0 ? 'error.main' : 'success.main'}>
                  {formatCurrency(customer.balance || 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Number(customer.balance || 0) > 0 ? 'Saldo deudor' : 'Saldo al día'}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AccountIcon />}
                onClick={() => navigate(`/customers/${id}/account`)}
                sx={{ px: 3 }}
              >
                Ver Detalle
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Información del Cliente */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Información Personal
              </Typography>
              <Box>
                {!isEditing ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                ) : (
                  <Box display="flex" gap={1}>
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveIcon />}
                      onClick={handleSaveCustomer}
                    >
                      Guardar
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
            {!isEditing ? (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography>
                    <strong>N° Cliente:</strong> {customer.customer_number || 'No especificado'}
                  </Typography>
                  <Typography>
                    <strong>Nombre:</strong> {customer.name}
                  </Typography>
                  <Typography>
                    <strong>Documento:</strong>{" "}
                    {customer.document_number || "No especificado"}
                  </Typography>
                  <Typography>
                    <strong>CUIT:</strong>{" "}
                    {customer.cuit || "No especificado"}
                  </Typography>
                  <Typography>
                    <strong>Teléfono:</strong>{" "}
                    {customer.phone || "No especificado"}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography>
                    <strong>Email:</strong> {customer.email || "No especificado"}
                  </Typography>
                  <Typography>
                    <strong>Dirección:</strong>{" "}
                    {customer.address || "No especificada"}
                  </Typography>
                  <Typography>
                    <strong>Provincia:</strong>{" "}
                    {customer.province || "No especificada"}
                  </Typography>
                  <Typography>
                    <strong>CP:</strong>{" "}
                    {customer.postal_code || "No especificado"}
                  </Typography>
                  <Typography>
                    <strong>Contacto:</strong>{" "}
                    {customer.contact || "No especificado"}
                  </Typography>
                </Grid>
                {customer.notes && (
                  <Grid item xs={12}>
                    <Typography>
                      <strong>Notas:</strong> {customer.notes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="N° Cliente"
                    type="number"
                    value={editForm.customer_number || ''}
                    onChange={(e) => setEditForm({...editForm, customer_number: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nombre"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Documento"
                    value={editForm.document_number || ''}
                    onChange={(e) => setEditForm({...editForm, document_number: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CUIT"
                    value={editForm.cuit || ''}
                    onChange={(e) => setEditForm({...editForm, cuit: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teléfono"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={editForm.email || ''}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Dirección"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Provincia"
                    value={editForm.province || ''}
                    onChange={(e) => setEditForm({...editForm, province: e.target.value})}
                  >
                    <MenuItem value="">Seleccionar provincia</MenuItem>
                    {PROVINCES.map((province) => (
                      <MenuItem key={province} value={province}>{province}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="CP"
                    value={editForm.postal_code || ''}
                    onChange={(e) => setEditForm({...editForm, postal_code: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contacto"
                    value={editForm.contact || ''}
                    onChange={(e) => setEditForm({...editForm, contact: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    select
                    label="Condición Fiscal"
                    value={editForm.tax_condition || 'CONSUMIDOR_FINAL'}
                    onChange={(e) => setEditForm({...editForm, tax_condition: e.target.value})}
                  >
                    <MenuItem value="CONSUMIDOR_FINAL">Consumidor Final</MenuItem>
                    <MenuItem value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</MenuItem>
                    <MenuItem value="MONOTRIBUTO">Monotributo</MenuItem>
                    <MenuItem value="EXENTO">Exento</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas"
                    multiline
                    rows={3}
                    value={editForm.notes || ''}
                    onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  />
                </Grid>
              </Grid>
            )}
          </CardContent>
        </Card>

        {/* Facturas */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Facturas</Typography>
            </Box>
            {invoices.length === 0 ? (
              <Typography>Sin facturas</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>N° de Factura</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Fecha</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Total</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Pagado</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Saldo</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((inv, index) => (
                      <TableRow
                        key={inv.id}
                        sx={{
                          '&:hover': { backgroundColor: 'grey.50' },
                          borderBottom: index === invoices.length - 1 ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        <TableCell sx={{ py: 2.5 }}>{inv.id_afip || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{formatDate(inv.date)}</TableCell>
                        <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(inv.total_amount)}</TableCell>
                        <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(inv.paid_amount)}</TableCell>
                        <TableCell align="right" sx={{ py: 2.5 }}>{formatCurrency(inv.balance)}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip
                            size="small"
                            label={invoiceStatusMap[inv.status]?.label || inv.status || 'Pendiente'}
                            color={invoiceStatusMap[inv.status]?.color || 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Vehículos */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Vehículos</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setVehicleDialog(true)}
              >
                Agregar Vehículo
              </Button>
            </Box>

            <Box mb={2}>
              <TextField
                fullWidth
                size="small"
                label="Buscar por patente"
                placeholder="Ej: AB123CD"
                value={vehicleSearchTerm}
                onChange={(e) => setVehicleSearchTerm(e.target.value)}
              />
            </Box>

            {vehicles.length === 0 ? (
              <Typography>No hay vehículos registrados</Typography>
            ) : filteredVehicles.length === 0 ? (
              <Typography>Sin resultados</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Marca</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Modelo</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Año</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Patente</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>KM</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredVehicles.map((vehicle, index) => (
                      <TableRow
                        key={vehicle.id}
                        sx={{
                          '&:hover': { backgroundColor: 'grey.50' },
                          borderBottom: index === filteredVehicles.length - 1 ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        <TableCell sx={{ py: 2.5 }}>{vehicle.brand}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{vehicle.model}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{vehicle.year || "-"}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{vehicle.plate || "-"}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{vehicle.current_km || 0}</TableCell>
                        <TableCell align="center" sx={{ py: 2.5 }}>
                          <Box display="flex" gap={1} justifyContent="center">
                            <TableActionIconButton
                              kind="access"
                              onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                              ariaLabel={`Abrir vehículo ${vehicle.brand} ${vehicle.model}`}
                            />
                            <TableActionIconButton
                              kind="workorder"
                              onClick={() => navigate(`/work-orders/new?customer_id=${id}&vehicle_id=${vehicle.id}`)}
                              ariaLabel={`Crear remito para vehículo ${vehicle.brand} ${vehicle.model}`}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Remitos */}
        <Card>
          <CardContent>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Remitos</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/work-orders/new?customer_id=${id}`)}
                disabled={vehicles.length === 0}
              >
                Nuevo Remito
              </Button>
            </Box>

            {workOrders.length === 0 ? (
              <Typography>No hay remitos</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.50' }}>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>N° Remito</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Patente</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 600, py: 2 }}>Descripción</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, py: 2 }}>Monto</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600, py: 2 }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrders.map((workOrder, index) => (
                      <TableRow
                        key={workOrder.id}
                        sx={{
                          '&:hover': { backgroundColor: 'grey.50' },
                          borderBottom: index === workOrders.length - 1 ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        <TableCell sx={{ py: 2.5 }}>{workOrder.external_id || '-'}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{getWorkOrderPlate(workOrder.vehicle_id)}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>{formatDate(workOrder.open_date)}</TableCell>
                        <TableCell sx={{ py: 2.5 }}>
                          <Chip
                            label={workOrder.status === 'OPEN' ? 'Abierta' : 
                                   workOrder.status === 'IN_PROGRESS' ? 'En Progreso' :
                                   workOrder.status === 'READY' ? 'Lista' :
                                   workOrder.status === 'INVOICED' ? 'Facturada' :
                                   workOrder.status === 'CANCELLED' ? 'Cancelada' : 'Abierta'}
                            color={workOrder.status === 'OPEN' ? 'info' :
                                   workOrder.status === 'IN_PROGRESS' ? 'warning' :
                                   workOrder.status === 'READY' ? 'success' :
                                   workOrder.status === 'INVOICED' ? 'primary' :
                                   workOrder.status === 'CANCELLED' ? 'error' : 'info'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ py: 2.5 }}>{workOrder.description || "-"}</TableCell>
                        <TableCell align="right" sx={{ py: 2.5, fontWeight: 600 }}>
                          {getWorkOrderAmount(workOrder) !== null
                            ? formatCurrency(getWorkOrderAmount(workOrder))
                            : '-'}
                        </TableCell>
                        <TableCell align="center" sx={{ py: 2.5 }}>
                          <TableActionIconButton
                            kind="access"
                            onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}
                            ariaLabel={`Abrir remito ${workOrder.external_id || workOrder.id}`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Dialog Agregar Vehículo */}
        <StyledDialog
          open={vehicleDialog}
          onClose={() => setVehicleDialog(false)}
          maxWidth="md"
          title="Agregar Vehículo"
          subtitle="Completa los datos del nuevo vehículo"
          actions={(
            <>
              <Button
                onClick={() => setVehicleDialog(false)}
                variant="outlined"
                sx={{ mr: 1 }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateVehicle}
                variant="contained"
                startIcon={<SaveIcon />}
                sx={{
                  px: 3,
                  background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
                }}
              >
                Guardar Vehículo
              </Button>
            </>
          )}
        >
  <Stack spacing={2.5}>
    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
      <SectionHeader icon={DirectionsCar} label="Datos del vehículo" />
      <Divider sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Marca"
            value={newVehicle.brand}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, brand: e.target.value })
            }
            required
            variant="outlined"
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Modelo"
            value={newVehicle.model}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, model: e.target.value })
            }
            required
            variant="outlined"
            size="small"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            fullWidth
            label="Año"
            type="number"
            value={newVehicle.year}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, year: e.target.value })
            }
            variant="outlined"
            size="small"
            placeholder="2020"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Patente"
            value={newVehicle.plate}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, plate: e.target.value })
            }
            variant="outlined"
            size="small"
            placeholder="ABC123"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Kilometraje actual"
            type="number"
            value={newVehicle.current_km}
            onChange={(e) =>
              setNewVehicle({ ...newVehicle, current_km: e.target.value })
            }
            variant="outlined"
            size="small"
            placeholder="50000"
          />
        </Grid>
      </Grid>
    </Paper>

    <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderColor: 'divider' }}>
      <SectionHeader icon={Notes} label="Notas adicionales" />
      <Divider sx={{ mb: 2 }} />
      <TextField
        fullWidth
        label="Notas adicionales"
        multiline
        rows={3}
        value={newVehicle.notes}
        onChange={(e) =>
          setNewVehicle({ ...newVehicle, notes: e.target.value })
        }
        variant="outlined"
        size="small"
        placeholder="Información adicional sobre el vehículo..."
      />
    </Paper>
  </Stack>
</StyledDialog>


    </PageLayout>
  );
}

export default CustomerDetail;
