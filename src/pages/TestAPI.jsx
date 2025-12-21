import { useState, useEffect } from 'react'
import { customerService } from '../services/api'

function TestAPI() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    testAPI()
  }, [])

  const testAPI = async () => {
    try {
      setLoading(true)
      console.log('Testing API connection...')
      const response = await customerService.getAll()
      console.log('API Response:', response.data)
      setCustomers(response.data)
    } catch (err) {
      console.error('API Error:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Probando conexión con API...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="card">
      <h2>Test de Conexión API</h2>
      <p>✅ Conexión exitosa con la API</p>
      <p>Clientes encontrados: {customers.length}</p>
      
      {customers.length > 0 && (
        <div>
          <h3>Primeros clientes:</h3>
          <ul>
            {customers.slice(0, 3).map(customer => (
              <li key={customer.id}>
                {customer.name} - {customer.email}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default TestAPI