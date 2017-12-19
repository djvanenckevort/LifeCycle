function edit(menu) {
	
}

function init() {
	var	menuitems = [];
	$.getJSON("/api/v2/UI_Components?q=name==corevariablestree", function(data) {
		if (data.items.count === 1) {
			$("#tree").fancytree({
				source: entity.items[0].data,
				activate: edit,
				icon: true
			})
	 	} else {
			$("#tree").fancytree({
				source: [],
				activate: edit,
				icon: true
			})	 		
	 	}
 	});
 }
