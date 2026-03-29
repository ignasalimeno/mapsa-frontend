import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  TextField,
  MenuItem,
  Button,
  Typography,
  Alert,
  Container
} from '@mui/material'
import { Login as LoginIcon } from '@mui/icons-material'
import axios from 'axios'

const API_BASE_URL = (typeof window !== 'undefined' && window.__ENV?.VITE_API_URL)
  || import.meta.env.VITE_API_URL
  || 'http://localhost:8000'

function Login() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [channel, setChannel] = useState(sessionStorage.getItem('channel') || 'MAPSA')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      })

      if (response.data.success) {
        // Guardar usuario en sessionStorage (solo dura hasta cerrar pestaña)
        sessionStorage.setItem('user', JSON.stringify(response.data.user))
        sessionStorage.setItem('isAuthenticated', 'true')
        sessionStorage.setItem('channel', channel)
        
        // Redirigir al dashboard
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Card sx={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <CardContent sx={{ p: 4 }}>
            <Box textAlign="center" mb={4}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                🔧 MAPSA
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sistema de Gestión
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                autoFocus
              />
              <TextField
                fullWidth
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                select
                label="Canal"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                margin="normal"
                required
              >
                <MenuItem value="MAPSA">MAPSA</MenuItem>
                <MenuItem value="VIGIA">VIGIA</MenuItem>
              </TextField>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={<LoginIcon />}
                sx={{ mt: 3, py: 1.5 }}
              >
                {loading ? 'Ingresando...' : 'Ingresar'}
              </Button>
            </form>

            <Box mt={3} textAlign="center">
              <Typography variant="caption" color="text.secondary">
                Usuario por defecto: <strong>admin</strong> / <strong>admin123</strong>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}

export default Login
