import React, { useEffect, useState } from 'react';
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
  Divider,
  Collapse
} from '@mui/material';
import {
  Menu as MenuIcon,
  People as PeopleIcon,
  Assignment as WorkOrderIcon,
  ReceiptLong as InvoiceIcon,
  Receipt as ReceiptIcon,
  Assessment as UtilityIcon,
  BarChart as ReportIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Warehouse as WarehouseIcon,
  SwapHoriz as StockIcon,
  TrendingUp as PriceUpdateIcon,
  ChevronLeft as CollapseIcon,
  ChevronRight as ExpandIcon,
  Folder as MastersIcon,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import Tooltip from '@mui/material/Tooltip';
import { useChannel } from '../context';

const expandedDrawerWidth = 240;
const collapsedDrawerWidth = 72;

const mainMenuItems = [
  { text: 'Clientes', icon: <PeopleIcon />, path: '/customers' },
  { text: 'Remitos', icon: <WorkOrderIcon />, path: '/work-orders' },
  { text: 'Facturas', icon: <InvoiceIcon />, path: '/invoices' },
  { text: 'Recibos', icon: <ReceiptIcon />, path: '/receipts' },
];

const menuGroups = [
  {
    id: 'reportes',
    text: 'Reportes',
    icon: <ReportIcon />,
    items: [
      { text: 'Equipos Vendidos', icon: <InventoryIcon />, path: '/sales/products' },
      { text: 'Utilidades', icon: <UtilityIcon />, path: '/utilities' },
    ],
  },
  {
    id: 'maestros',
    text: 'Maestros',
    icon: <MastersIcon />,
    items: [
      { text: 'Productos', icon: <InventoryIcon />, path: '/products' },
      { text: 'Categorías', icon: <CategoryIcon />, path: '/categories' },
      { text: 'Depósitos', icon: <WarehouseIcon />, path: '/warehouses' },
    ],
  },
];

const bottomMenuItems = [
  { text: 'Stock', icon: <StockIcon />, path: '/stock' },
  { text: 'Actualización Masiva', icon: <PriceUpdateIcon />, path: '/products/bulk-price-update' },
];

export default function MainLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState({ reportes: false, maestros: false });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { channel, setChannel, channels } = useChannel();
  const currentDrawerWidth = collapsed ? collapsedDrawerWidth : expandedDrawerWidth;

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      let changed = false;
      menuGroups.forEach((group) => {
        if (group.items.some((item) => location.pathname.startsWith(item.path)) && !prev[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [location.pathname]);

  const handleGroupToggle = (id) => {
    if (collapsed) {
      setCollapsed(false);
      setOpenGroups((prev) => ({ ...prev, [id]: true }));
      return;
    }
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  const handleNavigate = (path) => {
    navigate(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

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
        {mainMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: collapsed ? 1 : 2 }}>
            <Tooltip title={collapsed ? item.text : ''} disableHoverListener={!collapsed} arrow placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigate(item.path)}
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

        {menuGroups.map((group) => {
          const isActive = group.items.some((item) => location.pathname.startsWith(item.path));
          const isOpen = !!openGroups[group.id];
          return (
            <React.Fragment key={group.id}>
              <ListItem disablePadding sx={{ mb: 0.5, px: collapsed ? 1 : 2 }}>
                <Tooltip title={collapsed ? group.text : ''} disableHoverListener={!collapsed} arrow placement="right">
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleGroupToggle(group.id)}
                    sx={{
                      borderRadius: 2,
                      color: 'white',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(37, 99, 235, 0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(29, 78, 216, 0.35)',
                        },
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: 'inherit', minWidth: collapsed ? 0 : 40 }}>
                      {group.icon}
                    </ListItemIcon>
                    {!collapsed && (
                      <>
                        <ListItemText
                          primary={group.text}
                          primaryTypographyProps={{ fontWeight: 500, fontSize: '0.95rem' }}
                        />
                        {isOpen ? <ExpandMoreIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
                      </>
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>

              <Collapse in={isOpen && !collapsed} timeout="auto" unmountOnExit>
                <List disablePadding>
                  {group.items.map((item) => (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 2 }}>
                      <ListItemButton
                        selected={location.pathname.startsWith(item.path)}
                        onClick={() => handleNavigate(item.path)}
                        sx={{
                          borderRadius: 2,
                          color: 'white',
                          pl: 4,
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
                        <ListItemIcon sx={{ color: 'inherit', minWidth: 32 }}>
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{ fontWeight: 500, fontSize: '0.9rem' }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          );
        })}

        <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />

        {bottomMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: collapsed ? 1 : 2 }}>
            <Tooltip title={collapsed ? item.text : ''} disableHoverListener={!collapsed} arrow placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigate(item.path)}
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
        {!collapsed && (
          <TextField
            select
            size="small"
            fullWidth
            label="Canal"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            sx={{
              mb: 1.25,
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.8)' },
              '& .MuiInputLabel-root.Mui-focused': { color: 'white' },
              '& .MuiOutlinedInput-root': {
                color: 'white',
                backgroundColor: 'rgba(255,255,255,0.06)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.45)' },
                '&.Mui-focused fieldset': { borderColor: '#93c5fd' },
              },
              '& .MuiSvgIcon-root': { color: 'white' },
            }}
          >
            {channels.map((item) => (
              <MenuItem key={item} value={item}>{item}</MenuItem>
            ))}
          </TextField>
        )}
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
          display: { xs: 'block', md: 'none' },
          width: '100%',
          ml: 0,
          backgroundColor: 'white',
          borderBottom: '1px solid #e2e8f0',
          color: 'text.primary'
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
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
          backgroundColor: channel === 'VIGIA' ? '#eef7ff' : 'background.default',
          minHeight: '100vh'
        }}
      >
        <Toolbar sx={{ display: { xs: 'block', md: 'none' }, minHeight: '56px !important' }} />
        {children}
      </Box>
    </Box>
  );
}