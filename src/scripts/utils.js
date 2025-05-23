/* utility functions */
// https://stackoverflow.com/a/34890276
export function group_by(xs, key) {
	return xs.reduce(function (rv, x) {
		(rv[x[key]] = rv[x[key]] || []).push(x);
		return rv;
	}, {});
}

// https://stackoverflow.com/a/50636286
export function partition(array, filter) {
	let pass = [],
		fail = [];
	array.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e));
	return [pass, fail];
}

// based on https://stackoverflow.com/a/9229821
export function uniq_by(array, key) {
	const seen = Object.create(null);
	return array.filter(function (item) {
		if (Object.prototype.hasOwnProperty.call(seen, item[key])) {
			return false;
		} else {
			seen[item[key]] = true;
			return true;
		}
	});
}

// based on https://stackoverflow.com/a/4499062
export function human_readable(number) {
	if (number < 1000) {
		return number.toString();
	} else if (number < 1000 * 1000) {
		return (number / 1000).toFixed(1) + "K";
	} else {
		return (number / 1000 / 1000).toFixed(1) + "M";
	}
}

export function natural_compare(a, b) {
	return a.localeCompare(b, "en", { numeric: true });
}

export function sort_classes(array) {
	// move "Mods" and "Modpacks" to the top
	let modsIndex = array.findIndex((class_) => class_.name === "Mods");
	let modClass = array.splice(modsIndex, 1)[0];
	let modpackIndex = array.findIndex((class_) => class_.name === "Modpacks");
	let modpackClass = array.splice(modpackIndex, 1)[0];
	return [modClass, modpackClass].concat(array.sort((a, b) => natural_compare(a.name, b.name)));
}

export function format_categories(array, class_id) {
	let subcategories = group_by(array, "parentCategoryId");
	let top_level = subcategories[class_id];
	delete subcategories[class_id];

	top_level.sort((a, b) => natural_compare(a.name, b.name));

	for (let [id, subcategory] of Object.entries(subcategories)) {
		id = parseInt(id, 10);
		subcategory.sort((a, b) => natural_compare(a.name, b.name));
		subcategory.forEach((x) => {
			x._is_sub_category = true;
		});

		// insert subcategories below top level category
		let i = top_level.findIndex((x) => x.id === id);
		top_level.splice(i + 1, 0, ...subcategory);
	}
	return top_level;
}

export function clean_vers(versions) {
	return versions
		.filter(
			(version) => version.name.startsWith("Minecraft ") && version.name !== "Minecraft Beta"
		)
		.map((version) => ({ ...version, name: version.name.slice("Minecraft ".length) }));
}

export function sort_vers(versions) {
	return versions.sort((a, b) => {
		return -natural_compare(a.name, b.name);
	});
}

export function sort_subvers(subvers) {
	return subvers.sort((a, b) => {
		if (a.endsWith("Snapshot")) {
			return 1;
		} else if (b.endsWith("Snapshot")) {
			return -1;
		}
		return -natural_compare(a, b);
	});
}
