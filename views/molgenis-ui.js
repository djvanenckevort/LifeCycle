
function makeLogo(logo, alt, url) {
	return '<div class="navbar-header">' 
    + '<a class="navbar-brand" href="/menu/main/redirect?url=' + url + '">'
	+ '<img class="img-responsive" style="max-width:100%;max-height:100%;" src="' + logo + '" alt="' + alt + '"></a>'
    + '<button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-molgenis-navbar">'
    + '<span class="sr-only">Toggle navigation</span>'
    + '<span class="icon-bar"></span>'
    + '<span class="icon-bar"></span>'
    + '<span class="icon-bar"></span>'
    + '</button>'
    + '</div>'
}

function makeSignOutButton() {
	return '<form id="logout-form" method="post" action="/logout" class="navbar-form navbar-right"><button id="signout-button" type="button" class="btn btn-primary btn-sm">Sign out</button></form>'
}

function makeSignInButton() {
	return '<form class="navbar-form navbar-right" method="post" action="/login"><a id="open-button" type="btn" class="btn btn-default" data-toggle="modal" data-target="#login-modal">Sign in</a></form>'
}

function makeHelpMenu() {
	return '<li class="nav-item"><a href="https://molgenis.gitbooks.io/molgenis/content/" target="_blank" class="nav-link navbar-right">Help</a></li>'
}

function makeLanguageDropDown() {
	return ''
}

function makeSubMenu(path, item) {
	var url = '/menu/' + item.id + '/'
	var html = '<li class="dropdown">'
	html += '<a class="dropdown-toggle" data-toggle="dropdown" href="#" role="button" aria-expanded="false">'
	html += item.label
	html += '<b class="caret"></b></a>'
	html += '<ul class="dropdown-menu" role="menu">'
	for (index in item.items) {
		var sub = item.items[index]
		if (sub.type === 'plugin') {
			html += makeMenuItem(url, sub)
		} else if (sub.type === 'menu') {
			html += makeSubMenu(url, sub)
		}
	}
	html += '</ul></li>'
	return html
}

function makeMenuItem(path, item) {
	var url = path + item.id
	if (item.params !== undefined) {
		url += '?' + item.params
	}
	return '<li><a href="' + url + '">' + item.label + '</a></li>'
}

function makeMenu() {
	$.getJSON('/api/v2/sys_set_app/app', function(data) {
		if (data.molgenis_menu !== undefined) {
			var menu = JSON.parse(data.molgenis_menu)
			var items = menu.items
			var html = ''
			if (items.length === 0) {
				return
			}
			html += '<nav class="navbar navbar-default navbar-fixed-top" style="margin-bottom: 10px" role="navigation"><div class="container-fluid">'
			var start = 0
			var path = '/menu/' + menu.id + '/'
			if (items[start].label === 'Home' && items[start].type === 'plugin') {
				var url = path + items[start].id + '?' + items[start].params
				var logo = data.logo_href_navbar
				var alt = data.title
				html += makeLogo(logo, alt, url)
				start += 1
			}
			html += '<div class="collapse navbar-collapse" id="bs-molgenis-navbar"><ul class="nav navbar-nav">'
			for (var index = start; index < items.length; index++) {
				if (items[index].type === 'plugin') {
					html += makeMenuItem(path, items[index])
				} else if (items[index].type === 'menu') {
					html += makeSubMenu(path, items[index])					
				}
			}
			html += makeHelpMenu()
			html += '</ul>'
			html += makeSignInButton()
			html += '</div></div></nav>'
			$('#menu').replaceWith(html)
		}
	})
}