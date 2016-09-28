import _ from 'underscore'
import Backbone from 'backbone'
import store from './store'

export default {
  create () {
    const Router = Backbone.Router.extend(
      store.getDefinitions()
    )
    return new Router()
  },

  start (options) {
    if (!Backbone.History.started) {
      return Backbone.history.start(
        _.pick(options, ['pushState', 'hashChange', 'silent', 'root'])
      )
    }

    return null
  },

  restart () {
    Backbone.history.stop()
    Backbone.history.start()
  }
}
