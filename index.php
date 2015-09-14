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
	<link rel="stylesheet" href="assets/style.css">
	<title>Backbone.Router Test</title>
</head>
<body>

	<header>
		<h1>Backbone.Router Test</h1>

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

	<!-- Include Backbone.Router -->
	<script type="text/javascript" src="/src/backbone.router.js"></script>

	<!-- Include app script -->
	<script type="text/javascript" src="/assets/app.js"></script>	

	<script type="text/javascript">
	// Tell the router if the user is logged in
	window.loggedIn = <?php echo $_SESSION['logged_in'] ? "true" : "false"; ?>;
	window.user = "<?php echo $_SESSION['user']; ?>";
	</script>
</body>
</html>