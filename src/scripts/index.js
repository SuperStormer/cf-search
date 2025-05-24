import { MODLOADERS, SORT_FIELDS, SORT_ORDERS, DEFAULT_PARAMS } from "./consts";
import { sort_subvers } from "./utils";
import { populate_dropdown, fetch_dropdown_values } from "./dropdowns";
import {
	current_updating_event,
	refresh_results,
	fetch_results,
	populate_results,
} from "./results";
import { get_active_filters, populate_filters as _populate_filters } from "./filters";

import { update_query_params, load_query_params, to_api_params } from "./params";
// eslint-disable-next-line sonarjs/cognitive-complexity
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
	const page_size_el = by_id("page-size");

	const reset_button = by_id("reset");

	const page_els = document.getElementsByClassName("page");
	const loading_indicator = by_id("loading-indicator");
	const results_el = by_id("results");

	const sidebar_el = by_id("sidebar");
	const filters_el = by_id("filters");
	const version_filters_els = document.getElementsByClassName("version-filter");
	const show_filters = by_id("show-filters");

	const settings = {
		show_id: {
			value: false,
			on_change(toggled) {
				results_el.classList.toggle("show-id", toggled);
			},
		},
		show_author: {
			value: false,
			on_change(toggled) {
				results_el.classList.toggle("show-author", toggled);
			},
		},
		use_legacy_cf: {
			value: false,
			on_change() {
				let filters = get_active_filters(filters_el, version_filters_els);
				refresh_results(results_el, filters, settings);
			},
		},
		hidden_authors: {
			_value: [],
			set value(value) {
				this._value = value.split(",").map((author) => author.trim().toLowerCase());
			},
			get value() {
				return this._value;
			},
			on_change() {
				let filters = get_active_filters(filters_el, version_filters_els);
				refresh_results(results_el, filters, settings);
			},
		},
	};

	let page = 0;
	// avoid triggering update_results when you trigger change event programmatically
	// (in order to populate dropdowns for prefill and default)
	let should_update = false;

	async function update_results(event_name) {
		let params = new FormData(search_form);
		let filters = get_active_filters(filters_el, version_filters_els);

		// update query params only if search parameters were modified
		if (event_name === "control_change") {
			update_query_params(params, filters);
		}

		loading_indicator.hidden = false;
		results_el.innerHTML = "";

		for await (let query_result of fetch_results(to_api_params(params), page, event_name)) {
			populate_results(results_el, filters, query_result, settings);
		}

		loading_indicator.hidden = true;
	}
	const populate_filters = _populate_filters.bind(_populate_filters, filters_el);

	// fetch values for dropdowns
	let [classes, categories, versions, sub_versions] = await fetch_dropdown_values();

	// categories
	populate_dropdown(categories_el, []);

	classes_el.addEventListener("change", function () {
		update_modloader();

		let class_ = classes_el.value;
		let category_dropdown_values = categories[class_].map((category) => [
			category._is_sub_category ? " └ " + category.name : category.name,
			category.id,
		]);

		populate_dropdown(categories_el, category_dropdown_values);

		populate_filters(categories[class_], update_result_filters);
	});

	// classes
	populate_dropdown(
		classes_el,
		classes.map((x) => [x.name, x.id]),
		DEFAULT_PARAMS.classId
	);

	// modloaders
	populate_dropdown(modloader_el, MODLOADERS, DEFAULT_PARAMS.modLoaderType);

	function disable_modloader() {
		modloader_el.title = modloader_el.dataset.title;
		modloader_el.disabled = true;
	}

	function enable_modloader() {
		modloader_el.title = "";
		modloader_el.disabled = false;
	}

	function update_modloader() {
		if (
			["Mods", "Modpacks", "Worlds"].includes(
				classes.find((class_) => class_.id === parseInt(classes_el.value, 10)).name
			)
		) {
			// if mods or modpacks are selected
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
	populate_dropdown(sort_field_el, SORT_FIELDS, DEFAULT_PARAMS.sortField);
	populate_dropdown(sort_order_el, SORT_ORDERS, DEFAULT_PARAMS.sortOrder);

	/* prefill forms based on query params*/
	function prefill_forms() {
		should_update = false;
		const params = load_query_params();

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
				page_el.value = params.get("page");
			}
		}

		// prefill visual filters
		if (params.has("include_filters")) {
			let filters = params.get("include_filters").split(" ");
			for (let control of filters_el.elements) {
				if (filters.includes(control.value)) {
					control.checked = true;
					control.dataset.value = "include";
				}
			}
		}
		if (params.has("exclude_filters")) {
			let filters = params.get("exclude_filters").split(" ");
			for (let control of filters_el.elements) {
				if (filters.includes(control.value)) {
					control.indeterminate = true;
					control.checked = true;
					control.dataset.value = "exclude";
				}
			}
		}

		// prefill version filters
		if (params.has("min_version")) {
			version_filters_els[0].value = params.get("min_version");
		}
		if (params.has("max_version")) {
			version_filters_els[1].value = params.get("max_version");
		}

		should_update = true;
	}

	prefill_forms();

	/* back + forward history buttons */
	window.addEventListener("popstate", function () {
		reset_form();
		prefill_forms();
		update_results("popstate");
	});

	/* setttings checkboxes*/
	for (let setting in settings) {
		let input = by_id(setting.replace(/_/g, "-"));

		if (input.type === "checkbox") {
			input.checked = localStorage.getItem(setting) === "true";
		} else {
			input.value = localStorage.getItem(setting);
		}

		let on_change = function () {
			let value = input.type === "checkbox" ? input.checked : input.value;
			// on_change should recieve a value modified by getters/setters, but localStorage shouldn't
			localStorage.setItem(setting, value);
			settings[setting].value = value;
			settings[setting].on_change(settings[setting].value);
		};

		input.addEventListener("change", on_change);
		on_change();
	}

	/* visual and version filters */
	function update_result_filters() {
		// handle filtering
		let filters = get_active_filters(filters_el, version_filters_els);
		update_query_params(window.location.search, filters);

		refresh_results(results_el, filters, settings);
	}

	/* version filters */
	for (let control of version_filters_els) {
		control.addEventListener("change", function () {
			if (!control.reportValidity()) {
				return;
			}
			update_result_filters();
		});
	}

	/* show/hide visual filters for small screens */
	show_filters.addEventListener("click", function () {
		if (sidebar_el.classList.toggle("show-filters")) {
			show_filters.textContent = "Hide";
		} else {
			show_filters.textContent = "Show";
		}
	});

	/* override step validation for page size in search form*/
	// based on https://stackoverflow.com/a/51585161
	page_size_el.addEventListener("invalid", function (event) {
		let el = event.target;
		for (let state in el.validity) {
			if (state === "stepMismatch") {
				continue;
			}
			if (el.validity[state]) {
				return;
			}
		}
		event.preventDefault();
		reset_page();
		update_results("control_change");
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

		for (let control of version_filters_els) {
			control.value = "";
		}

		for (let page_el of page_els) {
			page_el.value = 1;
		}
	}

	reset_button.addEventListener("click", function (event) {
		event.preventDefault();
		history.pushState({}, "", window.location.pathname);
		reset_form();
		update_results("reset");
	});

	/* handle results updates */

	// update results if form is submitted
	search_form.addEventListener("submit", function (event) {
		event.preventDefault();

		if (current_updating_event !== "control_change") {
			reset_page();
			update_results("form_submit");
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
			params.set("page", page + 1);
			history.pushState({}, "", "?" + params);

			update_results("page_change");
		});
	}

	// update results when dropdowns are changed
	for (let control of search_form.elements) {
		if (control.type !== "submit") {
			control.addEventListener("change", function (event) {
				if (event.target.form.reportValidity() && should_update) {
					reset_page();
					update_results("control_change");
				}
			});
		}
	}

	// fetch default results
	update_results("default");

	// allow "change" events to call update_results
	should_update = true;
})();
