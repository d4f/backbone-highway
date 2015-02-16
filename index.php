<?php

// Start a php session
session_start();

// Create some simple login logic
$user = isset($_GET['user']) ? $_GET['user'] : null;
$logout = isset($_GET['logout']) ? $_GET['logout'] : null;

// Handle user login
if (!empty($user)) {
	$_SESSION['user'] = $user;
	$_SESSION['logged_in'] = true;
	
	header("Location: /");
	exit;
}
// Handle user logout
elseif (!empty($logout)) {
	$_SESSION['user'] = null;
	$_SESSION['logged_in'] = false;
	
	header("Location: /");
	exit;
}

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
				<li class="user_42"><a href="/users/42" data-route="user_show" data-id="42">Secured: User #42</a></li>
				<li><a href="/some-random-inexisting-route" data-route="some_random_inexisting_route">Testing 404</a></li>
				<?php if (!$_SESSION["logged_in"]): ?>
				<li class="login"><a href="/login" data-route="login">Login</a></li>
				<?php else: ?>
				<li class="logout"><a href="/logout" data-route="logout">Logout</a></li>
				<?php endif; ?>
			</ul>
		</nav>
	</header>

	<div id="main">
		<div class="user">
			<?php if ($_SESSION['logged_in']): ?>
			User: <?php echo $_SESSION['user']; ?>
			<?php endif; ?>
		</div>
		<div class="content"></div>
	</div>


	<!-- Include Libs -->
	<script type="text/javascript" src="/libs/jquery/jquery.min.js"></script>
	<script type="text/javascript" src="/libs/backbone/underscore-min.js"></script>
	<script type="text/javascript" src="/libs/backbone/backbone-min.js"></script>
	<script type="text/javascript" src="/libs/backbone/backbone.marionette.min.js"></script>

	<!-- Include MarionetteRouter -->
	<script type="text/javascript" src="/src/backbone.router.js"></script>

	<script type="text/javascript">
	// Tell the router if the user is logged in
	window.logged_in = <?php echo $_SESSION['logged_in'] ? "true" : "false"; ?>;
	window.user = "<?php echo $_SESSION['user']; ?>";
	</script>

	<script type="text/javascript">
	(function() {
		"use strict";

		var App = window.App = new Backbone.Marionette.Application();

		App.Router = Backbone.Router;

		App.Router.map(function() {
			// Catching client-side 404s (optional)
			this.route("404", {
				"action": function(path) {
					console.log("Controller action: 404");
					$(".content").html("<h1>404 ! =(</h1>");
				}
			});

			// Catching client-side 403s (optional)
			this.route("403", {
				"action": function(path) {
					console.log("Controller action: 403");
					$(".content").html("<h1>403 ! =(</h1>");
				}
			});
			
			// Declaring a home route
			this.route("home", {
				"path": "/",
				"before": [
					{ "name": "core", "cache": true },
					{ "name": "module", "cache": true }
				],
				"action": function() {
					console.log("Controller action: home");
					$(".content").html("Current page: Home");
				},
				"close": function() {
					if (App.user) {
						return confirm("Do you really want to quit the page?");
					}

					return true;
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
					console.log("Controller action: users_list");
					$(".content").html("Current page: Users");
				}
			});

			// Multiple controller for a same route
			this.route("users_list_extension", {
				"path": "/users",
				"action": function() {
					console.log("Controller action: users_list_extension");
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
					console.log("Controller action: user_show");
					$(".content").html("Current page: User #" + userId);
				}
			});

			// Declaring a login route
			this.route("login", {
				"path": "/login",
				"authed": false,
				"action": function() {
					console.log("Controller action: login");

					App.user = prompt("Enter your name :", "JS Ninja");

					if (App.user !== null) {
						window.location.href = "/?user=" + App.user;
					}
				}
			});

			// Declaring a logout route
			this.route("logout", {
				"path": "/logout",
				"authed": true,
				"action": function() {
					console.log("Controller action: logout");

					window.location.href = "/?logout=true";
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


		/**
		 * Register to some app events that will be triggered by the router
		 * Typically where you would orchestrate the render of the application
		 */
		var registerEvents = function() {
			App.vent.on("core", function() {
				console.log("Got trigger: core");
			});

			App.vent.on("module", function() {
				console.log("Got trigger: module");
			});

			App.vent.on("other_module", function() {
				console.log("Got trigger: other module");
			});
		};


		$(function() {
			registerEvents();

			if (window.user) {
				App.user = window.user;
			}

			App.start();

			App.Router.start(App, {
				"debug": true,
				"authed": window.logged_in,
				"redirectToLogin": true,
				// "root": "/admin",
				// "pushState": false
			});

			var menu = new App.MenuView({
				"el": $("header nav")
			});
		});
	})();
	</script>
</body>
</html>