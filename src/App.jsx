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
import ProductList from './pages/ProductList'
import ProductForm from './pages/ProductForm'
import ProductDetail from './pages/ProductDetail'
import ProductStock from './pages/ProductStock'
import TagList from './pages/TagList'
import TagForm from './pages/TagForm'
import WarehouseList from './pages/WarehouseList'
import WarehouseForm from './pages/WarehouseForm'
import WarehouseStock from './pages/WarehouseStock'
import StockOverview from './pages/StockOverview'
import StockMovements from './pages/StockMovements'
import BulkPriceUpdate from './pages/BulkPriceUpdate'
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
                <Route path="/" element={<Navigate to="/customers" replace />} />
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
          <Route path="/products" element={<ProductList />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/edit/:id" element={<ProductForm />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/stock" element={<ProductStock />} />
          <Route path="/products/bulk-price-update" element={<BulkPriceUpdate />} />
          <Route path="/tags" element={<TagList />} />
          <Route path="/tags/new" element={<TagForm />} />
          <Route path="/tags/edit/:id" element={<TagForm />} />
          <Route path="/warehouses" element={<WarehouseList />} />
          <Route path="/warehouses/new" element={<WarehouseForm />} />
          <Route path="/warehouses/edit/:id" element={<WarehouseForm />} />
          <Route path="/warehouses/:id/stock" element={<WarehouseStock />} />
          <Route path="/stock" element={<StockOverview />} />
          <Route path="/stock/movements" element={<StockMovements />} />
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