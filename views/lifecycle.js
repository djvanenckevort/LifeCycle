function convertMolgenisResponse(data) {
	var menu = [];
	for (let item of data.items) {
		if (item.variables.length === 0) {
			item.lazy = true;
			item.folder = true;
			delete item.variables;
		}
		menu.push(item);
	}
	return menu.sort(function(lhs, rhs) { return lhs.position - rhs.position });
}

function loadFromMolgenisEntity(event, data) {
	var request;
	if (data.node.key !== 'root') {
		request = $.getJSON('/api/v2/UI_Menu?q=parent==' + data.node.key);
	} else {
		request = $.getJSON('/api/v2/UI_Menu?q=parent==%27%27');
	}	
	data.result = request.then(convertMolgenisResponse).promise();
}

function showDetails(event, data) {
}

function init() {
	$("#tree").fancytree({
		source: [{
			folder: true,
			title: 'Core Variables',
			lazy: true,
			key: 'root'
		}],
		lazyLoad: loadFromMolgenisEntity,
		activate: showDetails,
		icon: true
	});
}
