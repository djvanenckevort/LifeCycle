function getBatched(url, promise) {
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
	getBatched('/api/v2/' + entity, deferred);
	return deferred;
}
