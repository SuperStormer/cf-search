/* handle visual filters */
import { partition } from "./utils";
export function populate_filters(filters_el, categories, checked_callback) {
	filters_el.innerHTML = "";
	let fragment = document.createDocumentFragment();

	for (let [category, id] of categories) {
		let el = document.createElement("label");

		let checkbox = document.createElement("input");
		checkbox.type = "checkbox";
		checkbox.name = category;
		checkbox.value = id;

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
			update_query_params(window.location.search, get_active_filters(filters_el));

			checked_callback();
		});

		let label = document.createTextNode(category);
		el.append(checkbox, label);
		fragment.append(el);
	}

	filters_el.append(fragment);
}

export function get_active_filters(filters_el) {
	let filters = Array.from(filters_el.elements).filter((x) => x.checked);
	let [include, exclude] = partition(filters, (x) => x.dataset.value === "include");
	return [include.map((x) => parseInt(x.value, 10)), exclude.map((x) => parseInt(x.value, 10))];
}

export function filter_results(results, include, exclude) {
	// handle includes
	if (include.length > 0) {
		results = results.filter((result) =>
			include.every((id) => result.categories.find((category) => category.id == id))
		);
	}

	//handle excludes
	if (exclude.length > 0) {
		results = results.filter((result) =>
			result.categories.every((category) => !exclude.includes(category.id))
		);
	}

	return results;
}

export function update_query_params(params, filters) {
	let params2 = new URLSearchParams(params);
	// don't overwrite filters query params
	let [include, exclude] = filters;
	params2.set("filtersInclude", include.join(" "));
	params2.set("filtersExclude", exclude.join(" "));
	if (window.location.search !== "?" + params2.toString()) {
		history.pushState({}, "", "?" + params2.toString());
	}
}
