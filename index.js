(async function () {
	const API_KEY = "$2a$10$pPhbqMbwV7vj4LwXd9Ye2e1XKKJbctRd6V6N1rYhSspG.CUOt7nb2";
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
	let page_els = document.getElementsByClassName("page");
	let loading_indicator = by_id("loading-indicator");
	let reset_button = by_id("reset");
	let filters_el = by_id("filters");

	let search_results;
	let page = 0;

	/* utility functions */

	// https://stackoverflow.com/a/34890276
	function group_by(xs, key) {
		return xs.reduce(function (rv, x) {
			(rv[x[key]] = rv[x[key]] || []).push(x);
			return rv;
		}, {});
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
		return versions.sort((a, b) => {
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
		//TODO fix snapshot sorting
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
			defaultOption.disabled = true;
			defaultOption.hidden = true;
			defaultOption.selected = true;
			defaultOption.textContent = dropdown.dataset.name;
			dropdown.dataset.default = dropdown.dataset.name;
			dropdown.prepend(defaultOption);
		} else {
			// otherwise, select the corresponding <option>
			let option = Array.from(dropdown.options).find((x) => x.textContent === defaultValue);
			dropdown.dataset.default = option.value;
			option.selected = true;
			dropdown.dispatchEvent(new Event("change"));
		}
	}
	/* handle secondary filters */
	function populate_filters(categories) {
		filters_el.innerHTML = "";
		let fragment = document.createDocumentFragment();

		for (let [category, id] of categories) {
			let el = document.createElement("label");

			let checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.name = category;
			checkbox.value = id;

			let label = document.createTextNode(category);

			el.append(checkbox, label);
			fragment.appendChild(el);
		}

		filters_el.appendChild(fragment);
	}
	function get_active_filters() {
		return Array.from(filters_el.elements)
			.filter((x) => x.checked)
			.map((x) => parseInt(x.value, 10));
	}

	function filter_results(results, active_filters) {
		return results.filter((result) =>
			result.categories.some((category) => active_filters.includes(category.id))
		);
	}

	/* fetch dropdown values from CF API */
	let categories = await cf_api("/v1/categories", { gameId: GAME_ID });
	categories = group_by(categories, "classId");

	let classes = natural_sort(categories[undefined]);
	delete categories[undefined];

	//bukkit plugins, customizations, addons - API doesn't work and I don't feel like figuring out why
	let brokenClasses = [5, 4546, 4559, 4979];
	for (let id of brokenClasses) {
		delete categories[id];
	}
	classes = classes.filter((x) => !brokenClasses.includes(x.id));

	// format categories
	for (let class_ in categories) {
		categories[class_] = format_categories(categories[class_], class_);
	}

	let versions = sort_vers(await cf_api(`/v1/games/${GAME_ID}/version-types`));
	let sub_versions = await cf_api(`/v1/games/${GAME_ID}/versions`);

	/* populate dropdowns */

	// categories
	populate_dropdown(categories_el, []);
	classes_el.addEventListener("change", function () {
		let class_ = classes_el.options[classes_el.selectedIndex].value;
		//TODO fix mod sorting to actually respect subcategories
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
		modloader_el.title = "";
		modloader_el.disabled = false;
	});

	// versions
	populate_dropdown(
		version_el,
		versions.map((version) => [version.name, version.id])
	);

	// sub versions
	populate_dropdown(sub_version_el, []);
	version_el.addEventListener("change", function () {
		let version = parseInt(version_el.options[version_el.selectedIndex].value, 10);
		let subvers = sort_subvers(sub_versions.find((x) => x.type === version).versions);
		populate_dropdown(
			sub_version_el,
			subvers.map((x) => [x, x])
		);
		modloader_el.title = modloader_el.dataset.title;
		modloader_el.disabled = true;
	});

	// sort
	populate_dropdown(sort_field_el, SORT_FIELDS, "Total Downloads");
	populate_dropdown(sort_order_el, SORT_ORDERS, "desc");

	/* prefill forms based on query params*/
	let params = new URLSearchParams(window.location.search);
	for (let control of search_form.elements) {
		if (params.has(control.name)) {
			control.value = params.get(control.name);
			control.dispatchEvent(new Event("change"));
		}
	}

	if (params.has("page")) {
		for (let page_el of page_els) {
			page_el.value = params.get("page");
		}
	}

	if (params.has("secondaryFilters")) {
		let filters = params.get("secondaryFilters").split(",");
		for (let control of filters_el.elements) {
			if (filters.includes(control.value)) {
				control.checked = true;
			}
		}
	}
	/* reset form */
	reset_button.addEventListener("click", function () {
		for (let control of search_form.elements) {
			if (control.dataset.default) {
				control.value = control.dataset.default;
			}
		}
		history.pushState({}, "", "");
	});
	/* handle form submission */
	async function update_results(event) {
		if (event !== undefined) {
			event.preventDefault();
		}

		let params = new URLSearchParams(new FormData(search_form));

		if (event !== undefined) {
			history.pushState({}, "", "?" + params.toString());
		}

		params.append("gameId", GAME_ID);
		// work-around for curseforge API being bad
		if (params.get("gameVersion") && params.get("modLoaderType") === "0") {
			params.delete("modLoaderType");
		}

		// index is the index of the first item to include in the response
		params.append("index", parseInt(params.get("pageSize"), 10) * page);
		params.delete("page");

		loading_indicator.hidden = false;
		search_results = await cf_api("/v1/mods/search", params);
		console.log(search_results);
		populate_results(search_results);
		loading_indicator.hidden = true;
	}

	function populate_results(results) {
		let filters = get_active_filters();
		if (filters.length > 0) {
			results = filter_results(results, filters);
		}
		console.log(results);
		let fragment = document.createDocumentFragment();
		for (let result of results) {
			let li = document.createElement("li");
			li.className = "result";

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

			let logo = document.createElement("img");
			logo.className = "result-logo";
			if (result.logo) {
				logo.src = result.logo.thumbnailUrl;
			}
			li.append(logo, title, secondary, categories);
			fragment.append(li);
		}
		results_el.innerHTML = "";
		results_el.appendChild(fragment);
	}

	search_form.addEventListener("submit", update_results);
	for (let page_el of page_els) {
		page_el.addEventListener("change", function (event) {
			page = parseInt(event.target.value, 10);

			let params = new URLSearchParams(window.location.search);
			params.set("page", page);
			history.pushState({}, "", "?" + params);

			update_results();
		});
	}

	update_results();
	setTimeout(function () {
		for (let control of search_form.elements) {
			if (control.type !== "submit") {
				control.addEventListener("change", update_results);
			}
		}
		for (let control of filters_el.elements) {
			control.addEventListener("change", function () {
				let params = new URLSearchParams(window.location.search);
				params.set("secondaryFilters", get_active_filters().join(","));
				history.pushState({}, "", "?" + params);
				populate_results(search_results);
			});
		}
	}, 0);
})();
