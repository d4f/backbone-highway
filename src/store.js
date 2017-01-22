import _ from 'underscore'

function createStore () {
  const data = {}
  const keys = {}
  let lastRoute = null

  function get (key) {
    return keys[key]
  }

  function set (key, value) {
    keys[key] = value
  }

  function save (route) {
    // Retrieve route name
    const name = route.get('name')

    // If route is already declared throw an error
    if (_.has(data, name)) {
      throw new Error(`[ highway ] Route named ${name} already declared`)
    }

    // Store new route
    data[name] = route
  }

  function find (search) {
    if (search.path) {
      const options = this.get('options')
      search.path = search.path.replace(options.root, '').replace(/^(\/|#)/, '')
    }

    return _.find(data, route => {
      return search.name === route.get('name') || (route.pathRegExp && route.pathRegExp.test(search.path))
    })
  }

  function getDefinitions () {
    const routes = {}
    const controllers = {}

    _.forEach(data, (route, name) => {
      routes[route.get('path')] = name
    })

    _.forEach(data, (route, name) => {
      controllers[name] = route.get('action')
    })

    return _.extend({ routes }, controllers)
  }

  function getLastRoute () {
    return lastRoute
  }

  function setLastRoute (route) {
    lastRoute = route
  }

  return {
    get,
    set,
    save,
    find,
    getDefinitions,
    getLastRoute,
    setLastRoute
  }
}

export default createStore()
