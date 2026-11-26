const { isSafePath } = require('./safeProxyRequest')

describe('isSafePath', () => {
  it.each(['', undefined, 'FeatureServer/0/query', 'tile/1/2/3.pbf', 'a..b/c', 'resources/sprites/sprite@2x.json'])('allows %s', (path) => {
    expect(isSafePath(path)).toBe(true)
  })

  it.each(['../x', 'a/../x', '..\t/x', '..\n/x', '/x', '//host/x', 'https://host', 'a\\b', 'a?b', 'a#b'])('rejects %j', (path) => {
    expect(isSafePath(path)).toBe(false)
  })
})
