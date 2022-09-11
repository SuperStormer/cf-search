(async function () {
	// I'm assuming this is safe b/c ferium does the same thing ¯\_(ツ)_/¯
	// https://github.com/gorilla-devs/ferium/blob/f9bf7906fde4938255bd4e9d95a680ac5646c0b4/src/main.rs#L95
	const API_KEY = "$2a$10$3kFa9lBWciEK.lsp7NyCSupZ3XmlAYixZQ9fTczqsz1/.W9QDnLUy";
	const GAME_ID = 432;
	const MODLOADERS = ["Any", "Forge", "Cauldron", "LiteLoader", "Fabric", "Quilt"].map((v, i) => [
		v,
		i,
	]);
	const SORT_FIELDS = [
		"Featured",
		"Popularity",
		"Last Updated",
		"Name",
		"Author",
		"Total Downloads",
		"Category",
		"Game Version",
	].map((v, i) => [v, i + 1]);
	const SORT_ORDERS = ["asc", "desc"].map((v) => [v, v]);

	let by_id = document.getElementById.bind(document);
	let search_form = by_id("search-form");
	let classes_el = by_id("classes");
	let categories_el = by_id("categories");
	let modloader_el = by_id("modloader");
	let version_el = by_id("version");
	let sub_version_el = by_id("sub-version");
	let sort_field_el = by_id("sort-field");
	let sort_order_el = by_id("sort-order");
	let results_el = by_id("results");
	let page_size_el = by_id("page-size");
	let page_els = document.getElementsByClassName("page");
	let loading_indicator = by_id("loading-indicator");
	let reset_button = by_id("reset");
	let filters_el = by_id("filters");

	let search_results;
	let page = 0;
	// avoid triggering populate_results when you trigger change event programmatically (in order to populate dropdowns)
	let should_update = false;

	/* utility functions */

	// https://stackoverflow.com/a/34890276
	function group_by(xs, key) {
		return xs.reduce(function (rv, x) {
			(rv[x[key]] = rv[x[key]] || []).push(x);
			return rv;
		}, {});
	}

	// https://stackoverflow.com/a/50636286
	function partition(array, filter) {
		let pass = [],
			fail = [];
		array.forEach((e, idx, arr) => (filter(e, idx, arr) ? pass : fail).push(e));
		return [pass, fail];
	}

	// based on https://stackoverflow.com/a/4499062
	function human_readable(number) {
		if (number < 1000) {
			return number.toString();
		} else if (number < 1000 * 1000) {
			return (number / 1000).toFixed(1) + "K";
		} else {
			return (number / 1000 / 1000).toFixed(1) + "M";
		}
	}

	function natural_sort(array) {
		return array.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
	}

	function format_categories(array, class_id) {
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

	function sort_vers(versions) {
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

	function sort_subvers(subvers) {
		return subvers.sort((a, b) => {
			if (a.endsWith("Snapshot")) {
				return 1;
			} else if (b.endsWith("Snapshot")) {
				return -1;
			}
			return -a.localeCompare(b, undefined, { numeric: true });
		});
	}

	async function cf_api(endpoint, params) {
		if (typeof params === "object" && !(params instanceof URLSearchParams)) {
			params = new URLSearchParams(params);
		} else if (params == undefined) {
			params = "";
		}

		if (endpoint.startsWith("/")) {
			endpoint = endpoint.slice(1);
		}

		return fetch("https://api.curseforge.com/" + endpoint + "?" + params, {
			headers: { "x-api-key": API_KEY, accept: "application/json" },
		})
			.then((resp) => resp.json())
			.then((json) => json.data);
	}

	function populate_dropdown(dropdown, values, defaultValue) {
		dropdown.innerHTML = "";
		let fragment = document.createDocumentFragment();

		for (let [name, value] of values) {
			let option = document.createElement("option");
			option.value = value;
			option.textContent = name;
			fragment.appendChild(option);
		}

		dropdown.appendChild(fragment);

		if (defaultValue == undefined) {
			// if no default value is specified, create a default option with the category name
			// based on https://stackoverflow.com/a/8442831
			let defaultOption = document.createElement("option");
			defaultOption.value = "";
			defaultOption.selected = true;
			defaultOption.textContent = dropdown.dataset.name;
			dropdown.dataset.default = "";
			dropdown.prepend(defaultOption);
		} else {
			// otherwise, select the corresponding <option>
			let option = Array.from(dropdown.options).find((x) => x.textContent === defaultValue);
			dropdown.dataset.default = option.value;
			option.selected = true;
			dropdown.dispatchEvent(new Event("change"));
		}
	}
	/* handle visual filters */
	function populate_filters(categories) {
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
				let params = new URLSearchParams(window.location.search);
				let [include, exclude] = get_active_filters();

				params.set("filtersInclude", include.join(","));
				params.set("filtersExclude", exclude.join(","));
				history.pushState({}, "", "?" + params);

				results_el.innerHTML = "";
				// setTimeout to avoid delay in checkbox visual update for large lists
				setTimeout(() => populate_results(search_results), 0);
			});

			let label = document.createTextNode(category);

			el.append(checkbox, label);
			fragment.appendChild(el);
		}

		filters_el.appendChild(fragment);
	}
	function get_active_filters() {
		let filters = Array.from(filters_el.elements).filter((x) => x.checked);
		let [include, exclude] = partition(filters, (x) => x.dataset.value === "include");
		return [
			include.map((x) => parseInt(x.value, 10)),
			exclude.map((x) => parseInt(x.value, 10)),
		];
	}

	function filter_results(results, include, exclude) {
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

	/* fetch dropdown values from CF API */
	async function fetch_categories() {
		let categories = await cf_api("/v1/categories", { gameId: GAME_ID });
		categories = group_by(categories, "classId");

		let classes = natural_sort(categories[undefined]);
		delete categories[undefined];

		// ignore bukkit plugins, customizations, addons
		// API doesn't work and I don't feel like figuring out why
		let brokenClasses = [5, 4546, 4559, 4979];
		for (let id of brokenClasses) {
			delete categories[id];
		}
		classes = classes.filter((x) => !brokenClasses.includes(x.id));

		// format categories
		for (let class_ in categories) {
			categories[class_] = format_categories(categories[class_], class_);
		}

		// ignore Fabric, FancyMenu, QoL, Vanilla+ tags
		// these tags don't exist anymore, idk why they're still in the API
		let brokenModCategories = [5192, 4780, 5190, 5129];
		categories[6] = categories[6].filter((x) => !brokenModCategories.includes(x.id));
		return [classes, categories];
	}

	async function fetch_vers() {
		return sort_vers(await cf_api(`/v1/games/${GAME_ID}/version-types`));
	}

	function fetch_subvers() {
		return cf_api(`/v1/games/${GAME_ID}/versions`);
	}

	// fetch in parallel and cache
	let cache_time = localStorage.getItem("cache_time");
	let now = Date.now();
	let classes, categories, versions, sub_versions;
	if (!cache_time || now - cache_time > 24 * 60 * 60 * 1000) {
		let result = await Promise.all([fetch_categories(), fetch_vers(), fetch_subvers()]);
		[[classes, categories], versions, sub_versions] = result;
		localStorage.setItem("cache", JSON.stringify(result));
		localStorage.setItem("cache_time", now);
	} else {
		[[classes, categories], versions, sub_versions] = JSON.parse(localStorage.getItem("cache"));
	}

	/* populate dropdowns */

	// categories
	populate_dropdown(categories_el, []);

	classes_el.addEventListener("change", function () {
		let class_ = classes_el.value;
		if (class_ === "6" && sub_version_el.value !== "") {
			// if mods is selected, and a subver is selected,
			// enable the modloader dropdown
			modloader_el.title = "";
			modloader_el.disabled = false;
		} else {
			modloader_el.title = modloader_el.dataset.title;
			modloader_el.disabled = true;
		}

		let categories2 = categories[class_].map((category) => [category.name, category.id]);
		populate_dropdown(categories_el, categories2);
		populate_filters(categories2);
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
		// if mods is selected
		let class_ = classes_el.value;
		if (class_ === "6") {
			modloader_el.title = "";
			modloader_el.disabled = false;
		}
	});

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

		let version = parseInt(val, 10);

		let subvers = sort_subvers(sub_versions.find((x) => x.type === version).versions);
		populate_dropdown(
			sub_version_el,
			subvers.map((x) => [x, x])
		);

		modloader_el.title = modloader_el.dataset.title;
		modloader_el.disabled = true;
	});

	// sort field and order
	populate_dropdown(sort_field_el, SORT_FIELDS, "Total Downloads");
	populate_dropdown(sort_order_el, SORT_ORDERS, "desc");

	/* prefill forms based on query params*/
	function prefill_forms() {
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
				page_el.value = params.get("page");
			}
		}

		// prefill visual filters
		if (params.has("filtersInclude")) {
			let filters = params.get("filtersInclude").split(",");
			for (let control of filters_el.elements) {
				if (filters.includes(control.value)) {
					control.checked = true;
					control.dataset.value = "include";
				}
			}
		}
		if (params.has("filtersExclude")) {
			let filters = params.get("filtersExclude").split(",");
			for (let control of filters_el.elements) {
				if (filters.includes(control.value)) {
					control.indeterminate = true;
					control.checked = true;
					control.dataset.value = "exclude";
				}
			}
		}
	}

	prefill_forms();

	// back + forward history buttons
	window.addEventListener("popstate", function () {
		reset_form();
		should_update = false;
		prefill_forms();
		should_update = true;
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
		update_results();
	});
	/* reset page numbering when query changes*/
	function reset_page() {
		page = 0;
		for (let el of page_els) {
			el.value = 0;
		}
	}

	/* reset form*/
	function reset_form() {
		for (let control of search_form.elements) {
			if (control.dataset.default) {
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

		modloader_el.title = "";
		modloader_el.disabled = false;
	}

	reset_button.addEventListener("click", function (event) {
		event.preventDefault();
		history.pushState({}, "", window.location.pathname);
		reset_form();
		should_update = false;
		update_results();
		should_update = true;
	});

	/* handle form submission */
	async function update_results() {
		let params = new URLSearchParams(new FormData(search_form));

		if (should_update) {
			let params2 = new URLSearchParams(params);

			// don't overwrite filters query params
			let [include, exclude] = get_active_filters();
			params2.set("filtersInclude", include.join(","));
			params2.set("filtersExclude", exclude.join(","));

			history.pushState({}, "", "?" + params2.toString());
		}

		params.append("gameId", GAME_ID);

		// work-around for curseforge API being bad
		if (params.get("gameVersion") && params.get("modLoaderType") === "0") {
			params.delete("modLoaderType");
		}

		loading_indicator.hidden = false;
		results_el.innerHTML = "";

		search_results = [];

		// since CF API only lets us fetch 50 at a time,
		// this horrible code splits the desired pageSize into multiple requests
		let queries = [];
		let page_size = parseInt(params.get("pageSize"), 10);

		for (let offset = 0; offset < page_size; offset += 50) {
			let real_page_size = Math.min(50, page_size - offset);
			let params2 = new URLSearchParams(params);

			// index is the index of the first item to include in the response
			let index = page_size * page + offset;

			params2.set("index", index);
			params2.set("pageSize", real_page_size);

			queries.push(cf_api("/v1/mods/search", params2));
		}

		// await each query sequentially to ensure result elements are properly ordered
		let query_results = [];
		for (let query of queries) {
			let query_result = await query;
			console.log(query_result);
			populate_results(query_result);
			query_results.push(query_result);
		}
		search_results = query_results.flat();

		loading_indicator.hidden = true;
	}

	function populate_results(results) {
		let [include, exclude] = get_active_filters();
		results = filter_results(results, include, exclude);

		let fragment = document.createDocumentFragment();
		for (let result of results) {
			let li = document.createElement("li");
			li.className = "result";

			//title
			let title = document.createElement("a");
			title.className = "result-title";
			title.href = result.links.websiteUrl;
			title.textContent = result.name;

			// subtitle
			let secondary = document.createElement("div");
			secondary.className = "result-secondary";
			let downloads = document.createElement("span");
			downloads.textContent = `${human_readable(result.downloadCount)} Downloads`;
			let updated = document.createElement("span");
			updated.textContent = `Updated ${new Date(result.dateModified).toLocaleDateString()}`;
			let created = document.createElement("span");
			created.textContent = `Created ${new Date(result.dateCreated).toLocaleDateString()}`;
			secondary.append(downloads, updated, created);

			// summary
			let summary = document.createElement("p");
			summary.className = "result-summary";
			summary.textContent = result.summary;

			// category images
			let categories = document.createElement("div");
			categories.className = "result-categories";
			for (let category of result.categories) {
				// TODO change link to change form param instead
				let el = document.createElement("a");
				el.href = category.url;

				let img = document.createElement("img");
				img.className = "result-category-image";
				img.src = category.iconUrl;
				img.title = category.name;

				el.appendChild(img);
				categories.appendChild(el);
			}

			//logo
			let logo = document.createElement("img");
			logo.className = "result-logo";
			if (result.logo) {
				logo.src = result.logo.thumbnailUrl;
			}
			logo.alt = "";

			li.append(logo, categories, title, secondary, summary);
			fragment.append(li);
		}
		results_el.appendChild(fragment);
	}

	// update results if form is submitted
	search_form.addEventListener("submit", function (event) {
		event.preventDefault();

		reset_page();
		update_results();
	});

	// update results when page changes
	for (let page_el of page_els) {
		page_el.addEventListener("change", function (event) {
			page = parseInt(event.target.value, 10);

			for (let page_el2 of page_els) {
				page_el2.value = page;
			}

			let params = new URLSearchParams(window.location.search);
			params.set("page", page);
			history.pushState({}, "", "?" + params);

			update_results();
		});
	}

	// update results when dropdowns are changed
	for (let control of search_form.elements) {
		if (control.type !== "submit") {
			control.addEventListener("change", function (event) {
				if (event.target.form.reportValidity() && should_update) {
					reset_page();
					update_results();
				}
			});
		}
	}

	// fetch default results
	update_results();

	// allow "change" events to call update_results
	should_update = true;
})();
