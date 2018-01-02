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
	if (data === undefined) {
		request = $.getJSON('/api/v2/UI_Menu?q=parent==%27%27');
		return request.then(convertMolgenisResponse).promise();
	} else {
		request = $.getJSON('/api/v2/UI_Menu?q=parent==' + data.node.key);
	}	
	data.result = request.then(convertMolgenisResponse).promise();
	return data;
}

function createTable(colums, rows) {
	var html = '<table class="table table-striped table-condensed table-bordered molgenis-table">'
	html += '<tr><thead>'
	for (let column of colums) {
		html += '<th>' + column + '</th>'
	}
	html += '</thead></tr>'	
	html += rows()
	html += '</table>'
	return html
}

function createRow(columns, data, metadata) {
	var html = '<tr>';
	for (let column of columns) {
		let variable = data[column];
		if (variable === undefined) {
			html += '<td></td>';
			continue;
		}
		let fieldType = metadata[column].fieldType;
		switch (fieldType) {
		case 'TEXT':
		case 'SCRIPT':
			html += '<td><pre>' + variable + '</pre></td>';
			break;
		case 'CATEGORICAL':
		case 'XREF':
			{
				let labelAttribute = metadata[column].refEntity.labelAttribute;
				html += '<td>' + variable[labelAttribute] + '</td>';				
			}
			break;			
		case 'CATEGORICAL_MREF':
		case 'ONE_TO_MANY':
		case 'MREF':
			{
				let labelAttribute = metadata[column].refEntity.labelAttribute;
				html += '<td>'
				for (let item of variable) {
					html += item[labelAttribute] + '<br>';
				}
				html += '</td>'
			}
			break;
		default:
			html += '<td>' + variable + '</td>';
		}
	}
	html += '</tr>';
	return html;
}

function extractMetadata(metadata) {
	let dict = {};
	for (let attribute of metadata) {
		dict[attribute.name] = attribute;
	}
	return dict
}

function createCoreVariablesTable(data) {
	let columns = ['variable', 'label', 'values', 'datatype', 'comments'];
	let metadata = extractMetadata(data.meta.attributes);
	let labels = columns.map(function(column) { return metadata[column].label; });
	return createTable(labels, function() {
		var rows = '';
		for (let item of data.items) {
			rows += createRow(columns, item, metadata);
		}
		return rows;
	});
}

function createHarmonizationRow(item, cohorts, metadata) {
	var html = '<tr><td>' + item.variable + '</td>';
	let labelAttribute = metadata['harmonizations'].refEntity.labelAttribute;
	let idAttribute = metadata['harmonizations'].refEntity.idAttribute;
	var harmonizedCohorts = {};
	for (let harmonization of item.harmonizations) {
		harmonizedCohorts[harmonization[labelAttribute]] = harmonization;
	}
	for (let cohort of cohorts) {
		var harmonizationStatus;
		if (harmonizedCohorts[cohort] !== undefined) {
			let id = harmonizedCohorts[cohort][idAttribute];
			harmonizationStatus = '<span style="color: green; font-size: large; font-weight: bold;" onclick="loadHarmonizationPopup(\'' + id + '\')">✓</span>';
		} else {
			harmonizationStatus = '<span style="color: red; font-size: large; font-weight: bold;">𐄂</span>';
		}
		html += '<td>' + harmonizationStatus + '</td>';
	}
	html += '</tr>';
	return html;
}
function createPopup(title, content) {
	var html = '<div id="myModal" class="modal fade" role="dialog">';
	html += '<div class="modal-dialog">';
	html += '<div class="modal-content">';
	html += '<div class="modal-header">';
	html += '<button type="button" class="close" data-dismiss="modal">&times;</button>';
	html += '<h4 class="modal-title">' + title + '</h4>';
	html += '</div>';
	html += '<div class="modal-body">';
	html += content;
	html += '</div>';
	html += '<div class="modal-footer">';
	html += '<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	html += '</div>';
	return html;
}

function createHarmonizationPopup(data, sources) {
	let columns = ["variable", "description", "values", "datatype", "collectionType", "comments"];
	let labels = ["Variable used", "Label/Description", "Acceptable values", "Data type", "Collection type", "Comments", "Description of harmonization"];
	let metadata = extractMetadata(sources.meta.attributes);
	// var html = '<div class="modal large in" id="entityReportModal" tabindex="-1" aria-hidden="true" style="z-index: 1040; display: block; padding-left: 0px;">';
	let title = 'Harmonisation of ' + data.targetLabel + ' in ' + data.sourceLabel;
	let content = createTable(labels, function() {
		var rows = '';
		for (let item of sources.items) {
			rows += createRow(columns, item, metadata);
		}
		return rows;
	});
	var html = createPopup(title, content);
	html += '</div>'
	$("#report").html(html);
}


function loadSourceVariables(data) {
	var list = data.sources.map(function(source) { return source.id;}).join();
	var request = $.getJSON('/api/v2/LifeCycle_SourceVariables?q=id=in=(' + list + ')');
	request.done(function(response) {
		createHarmonizationPopup(data, response);
	})
}

function loadHarmonizationPopup(id) {
	var request = $.getJSON('/api/v2/LifeCycle_Harmonizations/' + id);
	request.done(loadSourceVariables);
}

function createHarmonizationsTable(cohorts, data) {
	let labels = ['Variable'].concat(cohorts);
	let metadata = extractMetadata(data.meta.attributes);
	return createTable(labels, function() {
		var rows = '';
		for (let item of data.items) {
			rows += createHarmonizationRow(item, cohorts, metadata);
		}
		return rows;
	});
}

function createContentPanel(data) {
	var request = $.getJSON('/api/v2/LifeCycle_Cohorts');
	request.then(function(response) {
		let labelAttribute = response.meta.labelAttribute;
		let cohorts = response.items.map(function(item) { return item[labelAttribute]});
		var html = '<div id="content-panel">';
		html += createCoreVariablesTable(data);
		html += createHarmonizationsTable(cohorts, data);
		html += '</div>';
		return html;
	}).done(function(content) {
		$("#content-panel").replaceWith(content);		
	});
}

function loadContentPanel(event, data) {
	var variables = data.node.data.variables;
	if (variables === undefined || variables.length === 0) {
		return;
	}
	var list = variables.map(function(v) { return v.id }).join();
	var request = $.getJSON('/api/v2/LifeCycle_CoreVariables?q=id=in=(' + list +')');
	request.done(createContentPanel);
}

function init() {
	$("#tree").fancytree({
		source: loadFromMolgenisEntity,
		lazyLoad: loadFromMolgenisEntity,
		activate: loadContentPanel,
		icon: true
	});
}
