import _ from 'underscore'
import store from './store'

export default {
  send (routeName, events, args) {
    if (!_.isArray(events)) {
      throw new Error(`[ highway ] Route events definition for ${routeName} needs to be an Array`)
    }

    const { dispatcher } = store.get('options')

    if (!dispatcher) {
      throw new Error('[ highway ] No dispatcher has been declared to trigger events')
    }

    events.forEach(event => {
      if (_.isString(event)) {
        event = { name: event }
      }

      args = event.args || event.params || args

      console.log(`Trigger event ${event.name}, args:`, args)

      dispatcher.trigger(event.name, ...args)
    })
  }
}
