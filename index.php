<?php



?>
<!DOCTYPE html>
<html>
<head>
	<title>MarionetteRouter Test</title>

	<style>

		html, body {
			margin: 0;
			padding: 0;
			overflow: auto;
			font-family: Arial, Helvetica, sans-serif;
		}

		body {

		}

		header {
			width: 100%;
			background: rgba(0, 0, 0, 0.8);
			color: white;
		}
		header:after {
			content: ".";
			display: block;
			clear: both;
			visibility: hidden;
			height: 0;
		}

		header h1 {
			float: left;
			margin: 0 15px;
			padding: 0;
			font-size: 1.7em;
			line-height: 40px;
		}

		header nav {
			float: right;
			height: 100%;
		}

		header nav ul {
			margin: 0 15px;
			padding: 0;
			list-style: none;
			height: 100%;
		}

		header nav ul li {
			float: left;
			padding: 0 10px;
			line-height: 40px;
		}

		header nav a {
			color: white;
			text-decoration: none;
		}
		header nav a:hover, header nav a:focus {
			text-decoration: underline;
		}

		header nav ul li.logout {
			display: none;
		}

		#main {
			margin: 10px 15px;
		}

	</style>
</head>
<body>

	<header>
		<h1>MarionetteRouter Test</h1>

		<nav>
			<ul>
				<li class="home"><a href="/" data-route="home">Home</a></li>
				<li class="users"><a href="/users" data-route="users_list">Users</a></li>
				<li class="users-alias"><a href="/some-alias" data-route="users_alias">Users Alias</a></li>
				<li class="user_42"><a href="/users/42" data-route="user_show" data-id="42">User #42</a></li>
				<li class="login"><a href="/login" data-route="login">Login</a></li>
				<li class="logout"><a href="/logout" data-route="logout">Logout</a></li>
			</ul>
		</nav>
	</header>

	<div id="main">
		<div class="user"></div>
		<div class="content"></div>
	</div>


	<!-- Include Libs -->
	<script type="text/javascript" src="/libs/jquery/jquery.min.js"></script>
	<script type="text/javascript" src="/libs/backbone/underscore-min.js"></script>
	<script type="text/javascript" src="/libs/backbone/backbone-min.js"></script>
	<script type="text/javascript" src="/libs/backbone/backbone.marionette.min.js"></script>

	<!-- Include MarionetteRouter -->
	<script type="text/javascript" src="/src/backbone.marionette-router.js"></script>

	<script type="text/javascript">
	(function() {
		"use strict";

		var App = new Backbone.Marionette.Application(),
			Router = Backbone.MarionetteRouter;

		window.App = App;
		App.Router = Router;

		App.user = null;

		Router.map(function() {
			
			// Declaring a home route
			this.route("home", {
				"path": "/",
				"before": [
					{ "name": "core", "cache": true },
					{ "name": "module", "cache": true }
				],
				"action": function() {
					$(".content").html("Current page: Home");
				}
			});

			// Declaring a users list route
			this.route("users_list", {
				"path": "/users",
				"before": [
					"home",	// Executing the home route as a trigger
					"other_module"
				],
				"action": function() {
					$(".content").html("Current page: Users");
				}
			});

			// Declaring an alias to the users list route
			this.route("users_alias", {
				"path": "/some-alias",
				"action": "users_list"
			});

			// Declaring a secured route with a parameter
			this.route("user_show", {
				"path": "/users/:id",
				"authed": true,
				"action": function(userId) {
					$(".content").html("Current page: User #" + userId);
				}
			});

			// Declaring a login route
			this.route("login", {
				"path": "/login",
				"authed": false,
				"before": [
					"prompt_user"
				],
				"action": function() {
					if (App.user != null) {
						$(".user").html("Current user : " + App.user);
						$("nav .login").hide().siblings(".logout").show();

						App.Router.authed = true;

						_.defer(function() {
							App.Router.go("home");
						});
					}
				}
			});

			// Declaring a logout route
			this.route("logout", {
				"path": "/logout",
				"authed": true,
				"action": function() {
					if (App.user != null) {
						$(".user").html("");
						$("nav .logout").hide().siblings(".login").show();

						App.user = null;

						App.Router.authed = false;

						_.defer(function() {
							App.Router.go("home");
						});
					}
				}
			});

		});


		App.MenuView = Backbone.Marionette.ItemView.extend({
			"events": {
				"click a": "navigate"
			},

			"initialize": function() {
				console.log("[App.MenuView.initialize] init the menu view");
			},

			"navigate": function(e) {
				e.preventDefault();
				
				var $el = $(e.target);

				var route = $el.attr("data-route"),
					id = $el.attr("data-id");

				if (id !== undefined) {
					App.Router.go(route, [id]);
				} else {
					App.Router.go(route);
				}
			},

			"render": function() {}
		});


		var registerEvents = function() {
			App.vent.on("prompt_user", function() {
				App.user = prompt("Enter your name :", "JS Ninja");
			});


			App.vent.on("core", function() {
				console.log("core");
			});
			App.vent.on("module", function() {
				console.log("module");
			});
			App.vent.on("other_module", function() {
				console.log("other module");
			});
		};


		$(function() {
			registerEvents();

			App.start();
			Router.start(App, {
				"debug": true
			});

			var menu = new App.MenuView({
				"el": $("header nav")
			});
		});
	})();
	</script>
</body>
</html>