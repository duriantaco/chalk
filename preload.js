const { contextBridge, ipcRenderer } = require('electron')

const INBOUND = new Set([
  'ui:openQuickAdd',
])

const OUTBOUND = new Set([
])

contextBridge.exposeInMainWorld('api', {
  on(channel, cb) {
    if (!INBOUND.has(channel)) 
      return () => {}

    const listener = (_event, payload) => cb(payload)
    ipcRenderer.on(channel, listener)

    return () => ipcRenderer.removeListener(channel, listener)
  },
  once(channel, cb) {
    if (!INBOUND.has(channel)) 
      return

    ipcRenderer.once(channel, (_event, payload) => cb(payload))
  },
  off(channel) {
    if (!INBOUND.has(channel)) 
      return

    ipcRenderer.removeAllListeners(channel)
  },
  send(channel, payload) {
    if (!OUTBOUND.has(channel)) 
      return

    ipcRenderer.send(channel, payload)
  },
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload)
})


// if (process.env.NODE_ENV === 'production') {
//   console.log = console.info = console.debug = console.warn = function() {};
// }