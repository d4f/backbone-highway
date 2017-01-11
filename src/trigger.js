import _ from 'underscore'
import store from './store'

export default {
  dispatch (evt, args) {
    const { dispatcher } = store.get('options')

    if (_.isString(evt)) {
      evt = { name: evt }
    }

    args = evt.args || evt.params || args

    console.log(`Trigger event ${evt.name}, args:`, args)

    dispatcher.trigger(evt.name, ...args)
  },

  exec (options) {
    let { name, events, args } = options

    if (!_.isEmpty && !_.isArray(events)) {
      throw new Error(`[ highway ] Route events definition for ${name} needs to be an Array`)
    }

    if (!_.isArray(events)) events = [events]

    return Promise.all(
      _.map(events, (evt) => {
        if (_.isFunction(evt)) {
          return new Promise((resolve, reject) => {
            evt({ resolve, reject, args })
            return null
          })
        }

        this.dispatch(evt, args)
        return Promise.resolve()
      })
    )
  }
}
