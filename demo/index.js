import { Events } from 'backbone';
import highway from '../dist/backbone-highway';
import $ from 'jquery';
import _ from 'lodash';

const AppEvents = _.extend({}, Events);

window.highway = highway;
window.AppEvents = AppEvents;

AppEvents.on('test-event', (...args) => {
  console.log('Got test event!', args);
});

highway.route({
  name: '404',
  action() {
    console.log('404 controller!');
  }
});

highway.route({
  name: 'home',
  path: '/',
  events: [{
    name: 'test-event',
    params: [1, 2, 3, 4]
  }],
  action() {
    console.log('home controller');
  }
});

highway.route({
  name: 'login',
  path: '/users/:id',
  events: [{
    name: 'test-event'
  }],
  action(id) {
    console.log(`user controller for user #${id}`);
  }
});

$(() => {
  console.log('Document ready, starting highway');
  highway.start({
    dispatcher: AppEvents
  });

  highway.route({
    name: 'dynamic',
    path: '/dynamic',
    action() {
      console.log("Hello! I'm a dynamically declared route!");
    }
  });
});
