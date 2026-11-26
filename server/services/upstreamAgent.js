const https = require('https')

// Upstreams (ArcGIS, OS) close idle keep-alive connections, so reusing one gives "socket hang up" (ECONNRESET) and a 502.
// Free sockets are destroyed after a short idle period, well before the upstream drops them.
const upstreamAgent = new https.Agent({ keepAlive: true, timeout: 4000 })

module.exports = { upstreamAgent }
