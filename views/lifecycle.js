function getBatch(url, promise) {
	$.getJSON(url, function(response) {
		var nextHref = response.nextHref;
		if (nextHref !== undefined) {
			getBatch(nextHref, promise);
			promise.notify(response.items);
		} else {
			promise.resolve(response.items);
		}
	})
}

function loadEntity(entity) {
	var deferred = $.Deferred();
	getBatch('/api/v2/' + entity, deferred);
	return deferred;
}

function compareByPosition(lhs, rhs) {
	if (lhs === undefined && rhs === undefined) {
		return 0;
	}
	if (lhs === undefined) {
		return -1;
	}
	if (rhs === undefined) {
		return +1;
	}
	return lhs.position - rhs.position;
}

function sortVariables(lhs, rhs) {
	var group = compareByPosition(lhs.group, rhs.group);
	if (group !== 0) {
		return group;
	}

	var category = compareByPosition(lhs.category, rhs.category);
	if (category !== 0) {
		return category;
	}
	return compareByPosition(lhs, rhs);
}

function resolveById(items, id, key) {
	for (let item of items) {
		if (item[key] === id) {
			return item
		}
	}
	return null
}

function resolve(data) {
	data.variables =  data.variables.map(function(item) {
		item.group = resolveById(data.groups, item.group.id, 'id')
		if (item.category !== undefined) {
			item.category = resolveById(data.categories, item.category.id, 'id')
		}
		return item
	});
	return data;
}

function makeGroup(item) {
	alert(item.group.label);
	return {
		title: item.group.label,
		key: item.group.id,
		folder: true,
		children: []
	};
}

function makeCategory(item) {
	if (item.category === undefined) {
		return null
	}
	alert(item.category.label);
	return {
		title: item.category.label,
		key: item.category.id,
		folder: true,
		children: []
	}
}

function makeVariable(item) {
	alert(item.label);
	return {
		title: item.label,
		key: item.variable,
		folder: item.children.length > 0,
		children: []
	}
}

function getTarget(category, group) {
	if (category !== null) {
		return category;
	}
	return group;
}

function tableRow(values) {
	if (values == undefined) {
		return null
	}
	var row = "<tr>"
	row += values.map(function(value) { return "<td>" + value + "</td>"}).join("")
	row += "</tr>"
	return row
}

function createDetailsPanel(variable, harmonizations, cohorts) {
	var html = '<div id="content-panel">'
	html += '<div id="description">'
	html += "<h4>" + variable.label + " description</h4>"
	html += "<table id=\"harmonisations\" class=\"table table-striped table-condensed table-bordered molgenis-table\">"
	html += tableRow(["Variable:", variable.variable]);
	if (variable.values.length > 0) {
		var values = variable.values.map(function(item) { return item.code + ": " + item.value }).join(", ")
		html += tableRow(["Acceptable values:", values]);
	}
	html += tableRow(["Data type:", variable.datatype.label]);
	html += tableRow(["Description:", variable.description]);
	if (variable.comments !== undefined) {
		html += tableRow(["Comments:", variable.comments]);
	}
	html += tableRow(["Status:", harmonizations.length + "/" + cohorts.length])
	html += "</table>"
	html += '</div>'
	if (harmonizations.length > 0) {
		html += '<div style=\"overflow-y: scroll; height:400px;\">'
		html += '<h4>Harmonizations</h4>'
		html += '<table id=\"harmonizations\" class=\"table table-striped table-condensed table-bordered molgenis-table\">'
		html += '<thead>'
		html += tableRow(['Cohort', 'Variables', 'Description', 'Status']);
		html += '</thead>'
		html += harmonizations.map(function(item) {
				var sources = item.sources.map(function(item) { return item.variable }).join(", ");
				return tableRow([item.sourceLabel, sources, item.description, item.status.label]);
			}).join("");
		html +='</table>'
		html +='</div>'			
	}
	html +='</div>'
	$("#content-panel").replaceWith(html)
}

function showDetails(event, data) {
	var keys = data.node.key.split("#")
	if (data.node.isFolder() == false) {
		var variable = keys[keys.length -1];
		
		var futureDescription = $.Deferred();
		$.getJSON("/api/v2/LifeCycle_CoreVariables/" + variable, function(variable) { futureDescription.resolve(variable); });
		
		var futureHarmonization = $.Deferred();
		$.getJSON("/api/v2/LifeCycle_Harmonizations?q=target==" + variable, function(response) { futureHarmonization.resolve(response.items); });
		
		var futureCohorts = $.Deferred()
		$.getJSON("/api/v2/LifeCycle_Cohorts", function(response) { futureCohorts.resolve(response.items); });
		
		$.when(futureDescription, futureHarmonization, futureCohorts).then(createDetailsPanel)
	}
}

function isDifferent(item, id) {
	if (item === null) {
		return true;
	}
	return (item.key !== id);
}

function buildMenu(data) {
	var menu = [];
	var group = null;
	var category = null;

	var items = data.variables;
	for (let item of items) {
		if (isDifferent(group, item.group.id)) {
			group = makeGroup(item)
			menu.push(group);
			category = null;
		}
		if (item.category !== undefined) {
			if (isDifferent(category, item.category.id)) {
				alert(item.category.id);
				category = makeCategory(item);
				if (category !== null) {
					group.children.push(category);
				}
			}
		}
		var variable = makeVariable(item);
		var addToVariable = item.parent !== undefined;
		var target = getTarget(category, group);
		if (addToVariable) {
			var parent = resolveById(target.children, item.parent.variable, 'key');
			parent.children.push(variable);
		} else {
			target.children.push(variable);
		}
	}
	return menu;
}

function init() {
	var data = {
		groups: [],
		categories: [],
		variables: []
	};

	var groupsFuture = loadEntity('LifeCycle_Groups').progress(function(items) {
		alert('Groups: ' + items.length);
		data.groups = data.groups.concat(items);
	});
	var categoriesFuture = loadEntity('LifeCycle_Categories').progress(function(items) {
		alert('Categories: ' + items.length);
		data.categories = data.categories.concat(items);
	});
	var variablesFuture = loadEntity('LifeCycle_CoreVariables').progress(function(items) {
		alert('Variables: ' + items.length);
		data.variables = data.variables.concat(items);
	});
	$.when(groupsFuture, categoriesFuture, variablesFuture).done(function(groups, categories, variables) {
		data.groups = data.groups.concat(groups);
		data.categories = data.categories.concat(categories);
		data.variables = data.variables.concat(variables);
		data = resolve(data)
		data.variables = data.variables.sort(sortVariables)
		var menu = buildMenu(data);
		$("#tree").fancytree({
			source: menu,
			activate: showDetails,
			icon: true
		})
	});
}
