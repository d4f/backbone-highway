import _ from 'underscore'

const data = {}
const keys = {}

const store = {
  get (key) {
    return keys[key]
  },

  set (key, value) {
    keys[key] = value
  },

  save (route) {
    // Retrieve route name
    const name = route.get('name')

    // If route is already declared throw an error
    if (_.has(data, name)) {
      throw new Error(`[ highway ] Route named ${name} already declared`)
    }

    // Store new route
    data[name] = route
  },

  find (search) {
    if (search.path) {
      const options = this.get('options')
      search.path = search.path.replace(options.root, '').replace(/^(\/|#)/, '')
    }

    return this.findByName(search.name) || this.findByPath(search.path)
  },

  findByName (name) {
    return name && _.find(data, route => name === route.get('name'))
  },

  findByPath (path) {
    return path && _.find(data, route => route.pathRegExp.test(path))
  },

  getDefinitions () {
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
}

export default store
