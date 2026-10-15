const logDebug = process.env.PROXY_DEBUG === 'true'
  ? (message, metadata = {}) => {
      // const payload = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : ''
      console.log(`${message}`)
      if (Object.keys(metadata).length) {
        console.dir(metadata, { depth: null })
      }
      console.log('\n')
    }
  : () => {}

module.exports = {
  logDebug
}
