import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { vehicleService, workOrderService } from '../services/api'
import { PageLayout } from '../components'
import { formatCurrency, formatNumber } from '../utils/formatters'

function VehicleDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [vehicle, setVehicle] = useState(null)
  const [workOrders, setWorkOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadVehicleData()
  }, [id])

  const loadVehicleData = async () => {
    try {
      setLoading(true)
      const [vehicleRes, workOrdersRes] = await Promise.all([
        vehicleService.getById(id),
        workOrderService.getAll({ vehicle_id: id })
      ])
      
      setVehicle(vehicleRes.data)
      setWorkOrders(workOrdersRes.data)
    } catch (err) {
      setError('Error al cargar datos del vehículo')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Cargando...</div>
  if (error) return <div className="error">{error}</div>
  if (!vehicle) return <div className="error">Vehículo no encontrado</div>

  return (
    <PageLayout
      title={`Vehículo ${vehicle.brand} ${vehicle.model}`}
      subtitle={`Patente ${vehicle.plate || vehicle.license_plate || '-'}`}
      onBack={() => navigate(-1)}
    >
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Detalle del Vehículo</h2>
          <Link to={`/customers/${vehicle.customer_id}`} className="btn">Volver al Cliente</Link>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <p><strong>Marca:</strong> {vehicle.brand}</p>
            <p><strong>Modelo:</strong> {vehicle.model}</p>
            <p><strong>Motor:</strong> {vehicle.engine || 'No especificado'}</p>
          </div>
          <div>
            <p><strong>Año:</strong> {vehicle.year || 'No especificado'}</p>
            <p><strong>Patente:</strong> {vehicle.plate || 'No especificada'}</p>
            <p><strong>Kilómetros:</strong> {vehicle.current_km || 0}</p>
          </div>
        </div>
        
        {vehicle.vin && (
          <p style={{ marginTop: '1rem' }}><strong>VIN:</strong> {vehicle.vin}</p>
        )}
        
        {vehicle.notes && (
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Notas:</strong> {vehicle.notes}</p>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Remitos</h3>
          <Link to="/work-orders/new" className="btn btn-success">Nuevo Remito</Link>
        </div>
        
        {workOrders.length === 0 ? (
          <p>No hay remitos para este vehículo</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha Apertura</th>
                <th>Estado</th>
                <th>Descripción</th>
                <th>KM</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {workOrders.map(workOrder => (
                <tr key={workOrder.id}>
                  <td>{workOrder.id}</td>
                  <td>{formatDate(workOrder.open_date)}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem',
                      backgroundColor: getStatusColor(workOrder.status),
                      color: 'white'
                    }}>
                      {workOrder.status}
                    </span>
                  </td>
                  <td>{workOrder.description || '-'}</td>
                  <td>{workOrder.km_at_entry ? formatNumber(workOrder.km_at_entry) : '-'}</td>
                  <td>{formatCurrency(workOrder.final_total || 0, false)}</td>
                  <td>
                    <Link to={`/work-orders/${workOrder.id}/edit`} className="btn">Acceder</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageLayout>
  )
}

function getStatusColor(status) {
  const colors = {
    'OPEN': '#3498db',
    'IN_PROGRESS': '#f39c12',
    'READY': '#27ae60',
    'INVOICED': '#8e44ad',
    'CANCELLED': '#e74c3c'
  }
  return colors[status] || '#95a5a6'
}

export default VehicleDetail