const logDebug = process.env.PROXY_DEBUG === 'true'
  ? (message, metadata = {}) => {
      const payload = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : ''
      console.log(`[proxy-debug] ${message}${payload}`)
    }
  : () => {}

module.exports = {
  logDebug
}
