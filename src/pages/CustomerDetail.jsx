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
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Assignment as WorkOrderIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  AccountBalance as AccountIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import {
  customerService,
  vehicleService,
  workOrderService,
  accountService,
} from "../services/api";
import { PageLayout, StyledCard, StyledTable, StyledDialog } from '../components';
import { formatCurrency, formatNumber } from '../utils/formatters';

function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      setVehicles(vehiclesRes.data);
      setWorkOrders(workOrdersRes.data);
    } catch (err) {
      setError("Error al cargar datos del cliente");
        setCustomer(customerRes.data);
        setWorkOrders(workOrdersRes.data);
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
      loadCustomerData();
    } catch (err) {
      console.error("Error al crear vehículo:", err);
    }
  };



  if (loading)
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!customer) return <Alert severity="error">Cliente no encontrado</Alert>;

  return (
    <PageLayout
      title="Detalle del Cliente"
      subtitle="Información completa y gestión de vehículos y órdenes"
      onBack={() => navigate('/customers')}
    >
        {/* Información del Cliente */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Información Personal
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography>
                  <strong>Nombre:</strong> {customer.name}
                </Typography>
                <Typography>
                  <strong>Documento:</strong>{" "}
                  {customer.document_number || "No especificado"}
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
              </Grid>
              {customer.notes && (
                <Grid item xs={12}>
                  <Typography>
                    <strong>Notas:</strong> {customer.notes}
                  </Typography>
                </Grid>
              )}
            </Grid>
            <Box mt={2}>
              <Button
                variant="outlined"
                startIcon={<AccountIcon />}
                onClick={() => navigate(`/customers/${id}/account`)}
              >
                Ver Cuenta Corriente
              </Button>
            </Box>
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
                    <TableRow>
                      <TableCell>Número</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Pagado</TableCell>
                      <TableCell align="right">Saldo</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map(inv => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.number || inv.id}</TableCell>
                        <TableCell>{inv.date}</TableCell>
                        <TableCell align="right">{formatCurrency(inv.total_amount, false)}</TableCell>
                        <TableCell align="right">{formatCurrency(inv.paid_amount, false)}</TableCell>
                        <TableCell align="right">{formatCurrency(inv.balance, false)}</TableCell>
                        <TableCell>
                          <Chip size="small" label={inv.status === 'PAID' ? 'Pagada' : inv.status === 'PARTIAL_PAID' ? 'Parcial' : 'Nueva'} color={inv.status === 'PAID' ? 'success' : inv.status === 'PARTIAL_PAID' ? 'warning' : 'default'} />
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

            {vehicles.length === 0 ? (
              <Typography>No hay vehículos registrados</Typography>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Marca</TableCell>
                      <TableCell>Modelo</TableCell>
                      <TableCell>Año</TableCell>
                      <TableCell>Patente</TableCell>
                      <TableCell>KM</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>{vehicle.brand}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                        <TableCell>{vehicle.year || "-"}</TableCell>
                        <TableCell>{vehicle.plate || "-"}</TableCell>
                        <TableCell>{vehicle.current_km || 0}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                            title="Ver Detalle"
                          >
                            <ViewIcon />
                          </IconButton>
                          <IconButton
                            color="secondary"
                            onClick={() => navigate(`/work-orders/new?customer_id=${id}&vehicle_id=${vehicle.id}`)}
                            title="Nuevo Remito"
                          >
                            <WorkOrderIcon />
                          </IconButton>
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
                    <TableRow>
                      <TableCell>N° Remito</TableCell>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {workOrders.map((workOrder) => (
                      <TableRow key={workOrder.id}>
                        <TableCell>#{workOrder.id}</TableCell>
                        <TableCell>
                          {new Date(workOrder.open_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
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
                        <TableCell>{workOrder.description || "-"}</TableCell>
                        <TableCell>{formatCurrency(workOrder.final_total || 0, false)}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => navigate(`/work-orders/${workOrder.id}/edit`)}
                            sx={{ px: 3 }}
                          >
                            Acceder
                          </Button>
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
        <Dialog
          open={vehicleDialog}
          onClose={() => setVehicleDialog(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              mt: 3,
              borderRadius: 3,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              pb: 2,
              borderBottom: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary">
                🚗 Agregar Vehículo
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Completa los datos del nuevo vehículo
              </Typography>
            </Box>
            <IconButton
              onClick={() => setVehicleDialog(false)}
              sx={{
                backgroundColor: "grey.100",
                "&:hover": { backgroundColor: "grey.200" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ mt: 3 }}>
  <Grid container spacing={2}>
    {/* Fila 1: Marca - Modelo - Año */}
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
        placeholder="2020"
      />
    </Grid>

    {/* Fila 2: Patente - KM */}
    <Grid item xs={12} sm={6}>
      <TextField
        fullWidth
        label="Patente"
        value={newVehicle.plate}
        onChange={(e) =>
          setNewVehicle({ ...newVehicle, plate: e.target.value })
        }
        variant="outlined"
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
        placeholder="50000"
      />
    </Grid>

    {/* Fila 3: Notas (ancho completo) */}
    <Grid item xs={12}>
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
        placeholder="Información adicional sobre el vehículo..."
      />
    </Grid>
  </Grid>
</DialogContent>

          <DialogActions
            sx={{
              px: 3,
              py: 2.5,
              borderTop: "1px solid #e2e8f0",
              background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            }}
          >
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
          </DialogActions>
        </Dialog>


    </PageLayout>
  );
}

export default CustomerDetail;
