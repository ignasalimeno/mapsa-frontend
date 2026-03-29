import { createContext, useContext, useMemo, useState } from 'react'

const ChannelContext = createContext(null)

const VALID_CHANNELS = ['MAPSA', 'VIGIA']
const DEFAULT_CHANNEL = 'MAPSA'

const normalizeChannel = (value) => {
  const candidate = String(value || DEFAULT_CHANNEL).toUpperCase()
  return VALID_CHANNELS.includes(candidate) ? candidate : DEFAULT_CHANNEL
}

export function ChannelProvider({ children }) {
  const [channel, setChannelState] = useState(() => normalizeChannel(sessionStorage.getItem('channel')))

  const setChannel = (value) => {
    const nextChannel = normalizeChannel(value)
    sessionStorage.setItem('channel', nextChannel)
    setChannelState(nextChannel)
  }

  const value = useMemo(() => ({
    channel,
    setChannel,
    channels: VALID_CHANNELS,
  }), [channel])

  return <ChannelContext.Provider value={value}>{children}</ChannelContext.Provider>
}

export function useChannel() {
  const context = useContext(ChannelContext)
  if (!context) {
    throw new Error('useChannel must be used within ChannelProvider')
  }
  return context
}
