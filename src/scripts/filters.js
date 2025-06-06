/* handle visual filters */
import { natural_compare, partition } from "./utils";
export function populate_filters(filters_el, categories, checked_callback) {
	filters_el.innerHTML = "";
	let fragment = document.createDocumentFragment();

	for (let category of categories) {
		let el = document.createElement("label");
		el.className = "checkbox-label";
		if (category._is_sub_category) {
			el.classList.add("checkbox-label-nested");
		}

		let checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = category.name;
		checkbox.value = category.id;

		checkbox.addEventListener("change", function (event) {
			// custom checkbox behavior for filters
			// cycle from off, include, exclude
			let el = event.target;
			if (!el.dataset.value || el.dataset.value === "off") {
				// off -> include
				el.checked = true;
				el.indeterminate = false;
				el.dataset.value = "include";
			} else if (el.dataset.value === "include") {
				// include -> exclude
				el.indeterminate = true;
				el.checked = true;
				el.dataset.value = "exclude";
			} else {
				// exclude -> off
				el.checked = false;
				el.indeterminate = false;
				el.dataset.value = "off";
			}

			// handle filtering
			checked_callback();
		});

		let label = document.createTextNode(category.name);
		el.append(checkbox, label);
		fragment.append(el);
	}

	filters_el.append(fragment);
}

export function get_active_filters(filters_el, version_filters_els) {
	let filters = Array.from(filters_el.elements).filter((x) => x.checked);
	let [include, exclude] = partition(filters, (x) => x.dataset.value === "include");
	[include, exclude] = [
		include.map((x) => parseInt(x.value, 10)),
		exclude.map((x) => parseInt(x.value, 10)),
	];

	let [min_ver, max_ver] = Array.from(version_filters_els).map((x) => x.value);

	return { include, exclude, max_ver, min_ver };
}

export function filter_results(results, filters, hidden_authors) {
	let { include, exclude, max_ver, min_ver } = filters;
	// handle includes
	if (include.length > 0) {
		results = results.filter((result) =>
			include.every((id) => result.categories.find((category) => category.id === id))
		);
	}

	// handle excludes
	if (exclude.length > 0) {
		results = results.filter((result) =>
			result.categories.every((category) => !exclude.includes(category.id))
		);
	}

	// handle max ver
	if (max_ver.length > 0) {
		if (max_ver.split(".").length === 2) {
			// only major version provided (eg. "1.12"),
			// so we add a string that will always compare greater than all of the subvers for that major ver
			max_ver += "a";
		}
		results = results.filter((result) =>
			result.latestFilesIndexes.some(
				(file) => natural_compare(file.gameVersion, max_ver) <= 0
			)
		);
	}

	// handle min ver
	if (min_ver.length > 0) {
		results = results.filter((result) =>
			result.latestFilesIndexes.some(
				(file) => natural_compare(file.gameVersion, min_ver) >= 0
			)
		);
	}

	// handle authors
	if (hidden_authors.length > 0) {
		results = results.filter(
			(result) =>
				!result.authors.some((author) => hidden_authors.includes(author.name.toLowerCase()))
		);
	}

	return results;
}
