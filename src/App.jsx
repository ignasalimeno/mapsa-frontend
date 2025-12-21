import { Routes, Route } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import MainLayout from './components/MainLayout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/CustomerList'
import CustomerForm from './pages/CustomerForm'
import CustomerDetail from './pages/CustomerDetail'
import VehicleList from './pages/VehicleList'
import VehicleDetail from './pages/VehicleDetail'
import WorkOrderList from './pages/WorkOrderList'
import WorkOrderForm from './pages/WorkOrderForm'
import WorkOrderDetail from './pages/WorkOrderDetail'
import AccountList from './pages/AccountList'
import AccountDetail from './pages/AccountDetail'
import ItemAnalysis from './pages/ItemAnalysis'
import TestConnection from './pages/TestConnection'
import theme from './theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={
          <PrivateRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<CustomerList />} />
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<CustomerDetail />} />
          <Route path="/vehicles" element={<VehicleList />} />
          <Route path="/vehicles/:id" element={<VehicleDetail />} />
          <Route path="/work-orders" element={<WorkOrderList />} />
          <Route path="/work-orders/new" element={<WorkOrderForm />} />
          <Route path="/work-orders/:id" element={<WorkOrderDetail />} />
          <Route path="/work-orders/:id/edit" element={<WorkOrderForm />} />
          <Route path="/account" element={<AccountList />} />
          <Route path="/customers/:id/account" element={<AccountDetail />} />
          <Route path="/items-analysis" element={<ItemAnalysis />} />
                <Route path="/test" element={<TestConnection />} />
              </Routes>
            </MainLayout>
          </PrivateRoute>
        } />
      </Routes>
    </ThemeProvider>
  )
}

export default App