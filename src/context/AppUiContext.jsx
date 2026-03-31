import { createContext, useContext, useMemo, useRef, useState } from 'react'
import { Alert, Snackbar } from '@mui/material'
import ConfirmDialog from '../components/ConfirmDialog'

const AppUiContext = createContext(null)

const DEFAULT_CONFIRM_OPTIONS = {
  title: 'Confirmar accion',
  message: 'Esta accion no se puede deshacer.',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  confirmColor: 'primary',
}

export function AppUiProvider({ children }) {
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
    autoHideDuration: 4000,
  })
  const [confirmState, setConfirmState] = useState({
    open: false,
    ...DEFAULT_CONFIRM_OPTIONS,
  })
  const confirmResolverRef = useRef(null)

  const notify = (message, options = {}) => {
    setSnackbar({
      open: true,
      message,
      severity: options.severity || 'success',
      autoHideDuration: options.autoHideDuration || 4000,
    })
  }

  const closeSnackbar = (_, reason) => {
    if (reason === 'clickaway') return
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const closeConfirm = (result) => {
    setConfirmState((prev) => ({ ...prev, open: false }))
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result)
      confirmResolverRef.current = null
    }
  }

  const confirm = (options = {}) => new Promise((resolve) => {
    confirmResolverRef.current = resolve
    setConfirmState({
      open: true,
      ...DEFAULT_CONFIRM_OPTIONS,
      ...options,
    })
  })

  const value = useMemo(() => ({
    notify,
    confirm,
    success: (message, options = {}) => notify(message, { ...options, severity: 'success' }),
    error: (message, options = {}) => notify(message, { ...options, severity: 'error' }),
    info: (message, options = {}) => notify(message, { ...options, severity: 'info' }),
    warning: (message, options = {}) => notify(message, { ...options, severity: 'warning' }),
  }), [])

  return (
    <AppUiContext.Provider value={value}>
      {children}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={snackbar.autoHideDuration}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        cancelLabel={confirmState.cancelLabel}
        confirmColor={confirmState.confirmColor}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
    </AppUiContext.Provider>
  )
}

export function useAppUi() {
  const context = useContext(AppUiContext)
  if (!context) {
    throw new Error('useAppUi must be used within AppUiProvider')
  }
  return context
}

export function useNotify() {
  const { notify, success, error, info, warning } = useAppUi()
  return { notify, success, error, info, warning }
}

export function useConfirm() {
  const { confirm } = useAppUi()
  return confirm
}