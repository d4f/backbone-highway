import { Events } from 'backbone'
// import highway from '../dist/backbone-highway'
import highway from '../src/index'
import _ from 'lodash'

const AppEvents = _.extend({}, Events)

window.highway = highway
window.AppEvents = AppEvents

AppEvents.on('test-event', (...args) => {
  console.log('Got test event!', args)
})

highway.route({
  name: '404',
  action () {
    console.log('404 controller!')
  }
})

highway.route({
  name: 'home',
  path: '/',
  before: [
    { name: 'test-event', params: [1, 2, 3, 4] },
    async () => {
      console.log('before middleware')

      return new Promise(resolve => {
        setTimeout(() => {
          console.log('resolve before middleware')
          resolve()
        }, 2000)
      })
    }
  ],
  async action () {
    console.log('home controller')

    return new Promise(resolve => {
      setTimeout(() => {
        resolve('youhou!')
      }, 2000)
    })
  },
  after: [
    (state) => {
      console.log(`after middleware`, state)
    }
  ]
})

highway.route({
  name: 'login',
  path: '/users(/:id)(/)',
  before: [{
    name: 'test-event'
  }],
  action (state) {
    console.log(state)
    console.log(`user controller for user #${state.params.id}`)
  }
})

console.log('Starting highway')
highway.start({
  dispatcher: AppEvents
})

highway.route({
  name: 'dynamic',
  path: '/dynamic',
  action () {
    console.log("Hello! I'm a dynamically declared route!")
  }
})

highway.route({
  name: 'action-query',
  path: '/action/query',
  action (state) {
    console.log('action query state', state)
  }
})
