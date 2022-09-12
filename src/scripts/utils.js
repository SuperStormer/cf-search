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

export function natural_sort(array) {
	return array.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export function format_categories(array, class_id) {
	let subcategories = group_by(array, "parentCategoryId");
	let top_level = subcategories[class_id];
	delete subcategories[class_id];

	top_level.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

	for (let [id, subcategory] of Object.entries(subcategories)) {
		id = parseInt(id, 10);
		subcategory.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
		subcategory.forEach((x) => {
			x.name = " └ " + x.name;
		});

		// insert subcategories below top level category
		let i = top_level.findIndex((x) => x.id === id);
		top_level.splice(i + 1, 0, ...subcategory);
	}
	return top_level;
}

export function sort_vers(versions) {
	return versions
		.filter((x) => x.name.startsWith("Minecraft")) //TODO figure out why other versions don't work and remove this temp fix
		.sort((a, b) => {
			a = a.name;
			b = b.name;
			if (a.startsWith("Minecraft")) {
				if (b.startsWith("Minecraft")) {
					if (a === "Minecraft Beta") {
						return 1;
					} else if (b === "Minecraft Beta") {
						return -1;
					}

					return -a.localeCompare(b, undefined, { numeric: true });
				}
				return -1;
			}
			if (b.startsWith("Minecraft")) {
				return 1;
			}
			return a.localeCompare(b, undefined, { numeric: true });
		});
}

export function sort_subvers(subvers) {
	return subvers.sort((a, b) => {
		if (a.endsWith("Snapshot")) {
			return 1;
		} else if (b.endsWith("Snapshot")) {
			return -1;
		}
		return -a.localeCompare(b, undefined, { numeric: true });
	});
}
