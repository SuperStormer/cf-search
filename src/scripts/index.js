import { MODLOADERS, SORT_FIELDS, SORT_ORDERS } from "./consts";
import { sort_subvers } from "./utils";
import { populate_dropdown, fetch_dropdown_values } from "./dropdowns";
import {
	current_updating_event,
	populate_results_delayed,
	update_results as _update_results,
} from "./results";
import { populate_filters as _populate_filters } from "./filters";
(async function () {
	const by_id = document.getElementById.bind(document);
	const search_form = by_id("search-form");
	const classes_el = by_id("classes");
	const categories_el = by_id("categories");
	const modloader_el = by_id("modloader");
	const version_el = by_id("version");
	const sub_version_el = by_id("sub-version");
	const sort_field_el = by_id("sort-field");
	const sort_order_el = by_id("sort-order");
	const results_el = by_id("results");
	const page_size_el = by_id("page-size");
	const page_els = document.getElementsByClassName("page");
	const loading_indicator = by_id("loading-indicator");
	const reset_button = by_id("reset");
	const filters_el = by_id("filters");

	const update_results = _update_results.bind(
		_update_results,
		results_el,
		search_form,
		filters_el,
		loading_indicator
	);
	const populate_filters = _populate_filters.bind(_populate_filters, filters_el);

	let page = 0;
	// avoid triggering update_results when you trigger change event programmatically
	// (in order to populate dropdowns for prefill and defai;t)
	let should_update = false;

	/* utility functions */

	let [classes, categories, versions, sub_versions] = await fetch_dropdown_values();

	// categories
	populate_dropdown(categories_el, []);

	classes_el.addEventListener("change", function () {
		update_modloader();

		let class_ = classes_el.value;

		let categories2 = categories[class_].map((category) => [category.name, category.id]);
		populate_dropdown(categories_el, categories2);
		populate_filters(
			categories2,
			populate_results_delayed.bind(populate_results_delayed, results_el, filters_el)
		);
	});

	// classes
	populate_dropdown(
		classes_el,
		classes.map((x) => [x.name, x.id]),
		"Mods"
	);

	// modloaders
	populate_dropdown(modloader_el, MODLOADERS, "Any");

	sub_version_el.addEventListener("change", function () {
		update_modloader();
	});

	function disable_modloader() {
		modloader_el.title = modloader_el.dataset.title;
		modloader_el.disabled = true;
	}

	function enable_modloader() {
		modloader_el.title = "";
		modloader_el.disabled = false;
	}

	function update_modloader() {
		if (classes_el.value === "6" && sub_version_el.value !== "") {
			// if mods is selected and a subver is selected,
			// enable the modloader dropdown
			enable_modloader();
		} else {
			disable_modloader();
		}
	}
	// versions
	populate_dropdown(
		version_el,
		versions.map((version) => [version.name, version.id])
	);

	// sub versions
	populate_dropdown(sub_version_el, []);

	version_el.addEventListener("change", function () {
		disable_modloader();

		let val = version_el.value;

		// reset subvers dropdown if version was deselected
		if (val === "") {
			populate_dropdown(sub_version_el, []);
			return;
		}

		let version = Number.parseInt(val, 10);

		let subvers = sort_subvers(sub_versions.find((x) => x.type === version).versions);
		populate_dropdown(
			sub_version_el,
			subvers.map((x) => [x, x])
		);
	});

	// sort field and order
	populate_dropdown(sort_field_el, SORT_FIELDS, "Total Downloads");
	populate_dropdown(sort_order_el, SORT_ORDERS, "desc");

	/* prefill forms based on query params*/
	function prefill_forms() {
		should_update = false;
		let params = new URLSearchParams(window.location.search);

		// prefill search form
		for (let control of search_form.elements) {
			if (params.has(control.name)) {
				control.value = params.get(control.name);
				control.dispatchEvent(new Event("change"));
			}
		}

		// prefill page selector
		if (params.has("page")) {
			for (let page_el of page_els) {
				page_el.value = params.get("page") + 1;
			}
		}

		// prefill visual filters
		if (params.has("filtersInclude")) {
			let filters = params.get("filtersInclude").split(" ");
			for (let control of filters_el.elements) {
				if (filters.includes(control.value)) {
					control.checked = true;
					control.dataset.value = "include";
				}
			}
		}
		if (params.has("filtersExclude")) {
			let filters = params.get("filtersExclude").split(" ");
			for (let control of filters_el.elements) {
				if (filters.includes(control.value)) {
					control.indeterminate = true;
					control.checked = true;
					control.dataset.value = "exclude";
				}
			}
		}
		should_update = true;
	}

	prefill_forms();

	// back + forward history buttons
	window.addEventListener("popstate", function () {
		reset_form();
		prefill_forms();
		update_results(page, "popstate");
	});

	/* override step validation for page size in search form*/
	// based on https://stackoverflow.com/a/51585161
	page_size_el.addEventListener("invalid", function (event) {
		let el = event.target;
		for (let state in el.validity) {
			if (state == "stepMismatch") {
				continue;
			}
			if (el.validity[state]) {
				return;
			}
		}
		event.preventDefault();
		reset_page();
		update_results(page, "control_change");
	});
	/* reset page numbering when query changes*/
	function reset_page() {
		page = 0;
		for (let el of page_els) {
			el.value = 1;
		}
	}

	/* reset form*/
	function reset_form() {
		for (let control of search_form.elements) {
			if (control.dataset.default !== undefined) {
				control.value = control.dataset.default;
			} else if (control.type === "text") {
				control.value = "";
			}
		}

		for (let control of filters_el.elements) {
			control.dataset.value = "off";
			control.checked = false;
			control.indeterminate = false;
		}

		for (let page_el of page_els) {
			page_el.value = 1;
		}

		disable_modloader();
	}

	reset_button.addEventListener("click", function (event) {
		event.preventDefault();
		history.pushState({}, "", window.location.pathname);
		reset_form();
		update_results(page, "reset");
	});

	/* handle results updates */

	// update results if form is submitted
	search_form.addEventListener("submit", function (event) {
		event.preventDefault();

		if (current_updating_event !== "control_change") {
			reset_page();
			update_results(page, "form_submit");
		}
	});

	// update results when page changes
	for (let page_el of page_els) {
		page_el.addEventListener("change", function (event) {
			if (!page_el.reportValidity()) {
				return;
			}

			page = Number.parseInt(event.target.value, 10) - 1;

			for (let page_el2 of page_els) {
				page_el2.value = page + 1;
			}

			let params = new URLSearchParams(window.location.search);
			params.set("page", page);
			history.pushState({}, "", "?" + params);

			update_results(page, "page_change");
		});
	}

	// update results when dropdowns are changed
	for (let control of search_form.elements) {
		if (control.type !== "submit") {
			control.addEventListener("change", function (event) {
				if (event.target.form.reportValidity() && should_update) {
					reset_page();
					update_results(page, "control_change");
				}
			});
		}
	}

	// fetch default results
	update_results(page, "default");

	// allow "change" events to call update_results
	should_update = true;
})();
