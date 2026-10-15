const path = require('path')

module.exports = {
  mode: 'production',
  target: 'node',
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'index.js',
    clean: true
  },
  node: {
    __dirname: false,
    __filename: false
  }
}
