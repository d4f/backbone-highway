import _ from 'underscore'
import store from './store'

export default {
  dispatch (evt, params) {
    const { dispatcher } = store.get('options')

    if (_.isString(evt)) {
      evt = { name: evt }
    }

    if (!dispatcher) {
      throw new Error(`[ highway ] Event '${evt.name}' could not be triggered, missing dispatcher`)
    }

    params = evt.params || params

    console.log(`Trigger event ${evt.name}, params:`, params)

    dispatcher.trigger(evt.name, { params })
  },

  exec (options) {
    let { name, events, params } = options

    if (!_.isEmpty && !_.isArray(events)) {
      throw new Error(`[ highway ] Route events definition for ${name} needs to be an Array`)
    }

    if (!_.isArray(events)) events = [events]

    return Promise.all(
      _.map(events, (evt) => {
        if (_.isFunction(evt)) {
          return new Promise((resolve, reject) => {
            evt({ resolve, reject, params })
            return null
          })
        }

        this.dispatch(evt, params)
        return Promise.resolve()
      })
    )
  }
}
