import { useState } from 'react'
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  TextField
} from '@mui/material'
import { customerService } from '../services/api'

function TestConnection() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [testCustomer, setTestCustomer] = useState({
    name: 'Test Cliente',
    document_number: '99999999',
    phone: '1199999999',
    email: 'test@test.com'
  })

  const testGet = async () => {
    try {
      setLoading(true)
      const response = await customerService.getAll()
      setResult({
        type: 'success',
        message: `GET exitoso. ${response.data.length} clientes encontrados`,
        data: response.data
      })
    } catch (err) {
      setResult({
        type: 'error',
        message: `Error GET: ${err.message}`,
        data: err.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  const testPost = async () => {
    try {
      setLoading(true)
      console.log('Enviando:', testCustomer)
      const response = await customerService.create(testCustomer)
      console.log('Respuesta:', response)
      setResult({
        type: 'success',
        message: 'POST exitoso. Cliente creado',
        data: response.data
      })
    } catch (err) {
      console.error('Error completo:', err)
      setResult({
        type: 'error',
        message: `Error POST: ${err.message}`,
        data: err.response?.data || err
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" mb={3}>Test de Conexión API</Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" mb={2}>Pruebas de API</Typography>
          <Box display="flex" gap={2} mb={2}>
            <Button 
              variant="contained" 
              onClick={testGet}
              disabled={loading}
            >
              Test GET /customers
            </Button>
            <Button 
              variant="contained" 
              color="secondary"
              onClick={testPost}
              disabled={loading}
            >
              Test POST /customers
            </Button>
          </Box>
          
          <Typography variant="h6" mb={2}>Datos de prueba:</Typography>
          <Box display="flex" gap={2} mb={2}>
            <TextField
              label="Nombre"
              value={testCustomer.name}
              onChange={(e) => setTestCustomer({...testCustomer, name: e.target.value})}
            />
            <TextField
              label="Documento"
              value={testCustomer.document_number}
              onChange={(e) => setTestCustomer({...testCustomer, document_number: e.target.value})}
            />
          </Box>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent>
            <Alert severity={result.type} sx={{ mb: 2 }}>
              {result.message}
            </Alert>
            <Typography variant="h6">Respuesta:</Typography>
            <pre style={{ background: '#f5f5f5', padding: '10px', overflow: 'auto' }}>
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}

export default TestConnection