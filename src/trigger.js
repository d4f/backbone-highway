import _ from 'underscore'
import store from './store'

export default {
  dispatch ({ evt, params, query, result }) {
    const { dispatcher } = store.get('options')

    if (_.isString(evt)) evt = { name: evt }

    if (!dispatcher) {
      throw new Error(`[ highway ] Event '${evt.name}' could not be triggered, missing dispatcher`)
    }

    params = evt.params || params

    dispatcher.trigger(evt.name, { params, query, result })
  },

  exec (options) {
    let { name, events, params, query, result } = options

    if (!_.isEmpty && !_.isArray(events)) {
      throw new Error(`[ highway ] Route events definition for ${name} needs to be an Array`)
    }

    // Normalize events as an array
    if (!_.isArray(events)) events = [events]

    return Promise.all(
      _.map(events, (evt) => {
        // Handle event as a function
        if (_.isFunction(evt)) {
          // Wrap in a promise in case `evt` is not async
          return Promise.resolve(
            evt({ params, query, result })
          )
        }

        // Else dispatch event to
        this.dispatch({ evt, params, query, result })

        return true
      })
    )
  }
}
