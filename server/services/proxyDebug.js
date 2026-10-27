const { config } = require('../config')
const logDebug = config.debug
  ? (logLabel, message, metadata = {}) => {
      if (!config.debugFilter.includes(logLabel)) {
        return
      }
      console.log(logLabel, `${message}`)
      if (Object.keys(metadata).length) {
        console.dir(metadata, { depth: null })
      }
      console.log('\n')
    }
  : () => {}

module.exports = {
  logDebug
}
