import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  TextField,
  MenuItem,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Assignment as WorkOrderIcon,
  ReceiptLong as InvoiceIcon,
  PointOfSale as SalesIcon,
  Assessment as UtilityIcon,
  AccountBalance as AccountIcon,
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  LocalOffer as TagIcon,
  Warehouse as WarehouseIcon,
  SwapHoriz as StockIcon,
  TrendingUp as PriceUpdateIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import { useChannel } from '../context';

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 72;

const menuItems = [
  { text: 'Clientes', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Remitos', icon: <WorkOrderIcon />, path: '/work-orders' },
  { text: 'Facturas', icon: <InvoiceIcon />, path: '/invoices' },
  { text: 'Ventas', icon: <SalesIcon />, path: '/sales' },
  { text: 'Utilidades', icon: <UtilityIcon />, path: '/utilities' },
  { text: 'Productos', icon: <InventoryIcon />, path: '/products' },
  { text: 'Stock', icon: <StockIcon />, path: '/stock' },
  { text: 'Tags', icon: <TagIcon />, path: '/tags' },
  { text: 'Depósitos', icon: <WarehouseIcon />, path: '/warehouses' },
  { text: 'Actualización Masiva', icon: <PriceUpdateIcon />, path: '/products/bulk-price-update' },
  { text: 'Análisis de Items', icon: <InventoryIcon />, path: '/items-analysis' },
];

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { channel, setChannel, channels } = useChannel();
  const currentDrawerWidth = collapsed ? collapsedDrawerWidth : expandedDrawerWidth;

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ backgroundColor: '#1e293b', height: '100%', color: 'white' }}>
      <Toolbar sx={{ minHeight: '72px !important', backgroundColor: '#0f172a', px: 2 }}>
        {!collapsed && (
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, color: 'white' }}>
            🔧 MAPSA
          </Typography>
        )}
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title={collapsed ? 'Expandir menú' : 'Colapsar menú'} arrow placement="bottom">
          <IconButton
            size="small"
            onClick={() => setCollapsed(!collapsed)}
            sx={{ color: 'white' }}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed ? <ExpandIcon /> : <CollapseIcon />}
          </IconButton>
        </Tooltip>
      </Toolbar>
      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: collapsed ? 1 : 2 }}>
            <Tooltip title={collapsed ? item.text : ''} disableHoverListener={!collapsed} arrow placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  borderRadius: 2,
                  color: 'white',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  '&.Mui-selected': {
                    backgroundColor: '#2563eb',
                    '&:hover': {
                      backgroundColor: '#1d4ed8',
                    },
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 40 }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={() => {
            sessionStorage.removeItem('user')
            sessionStorage.removeItem('isAuthenticated')
            navigate('/login')
          }}
          sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
        >
          Salir
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { md: `${currentDrawerWidth}px` },
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            Sistema de Gestión
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <TextField
            select
            size="small"
            label="Canal"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            sx={{ minWidth: 140, backgroundColor: 'white' }}
          >
            {channels.map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: currentDrawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: expandedDrawerWidth,
              border: 'none'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: currentDrawerWidth,
              border: 'none'
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          backgroundColor: 'background.default',
          minHeight: '100vh'
        }}
      >
        <Toolbar sx={{ minHeight: '72px !important' }} />
        {children}
      </Box>
    </Box>
  );
}