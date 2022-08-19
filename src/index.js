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
		return subvers.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
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
			dropdown.prepend(defaultOption);
		} else {
			// otherwise, select the corresponding <option>
			Array.from(dropdown.options).find(
				(x) => x.textContent === defaultValue
			).selected = true;
			dropdown.dispatchEvent(new Event("change"));
		}
	}
	/* fetch dropdown values from CF API */
	let categories = await cf_api("/v1/categories", { gameId: GAME_ID });
	categories = group_by(categories, "classId");
	delete categories[4979]; // not entirely sure wtf this is

	let classes = natural_sort(categories[undefined]);
	delete categories[undefined];

	let versions = sort_vers(await cf_api(`/v1/games/${GAME_ID}/version-types`));
	let sub_versions = await cf_api(`/v1/games/${GAME_ID}/versions`);

	/* populate dropdowns */

	// categories
	populate_dropdown(categories_el, []);
	classes_el.addEventListener("change", function () {
		let category = classes_el.options[classes_el.selectedIndex].value;
		//TODO fix mod sorting to actually respect subcategories
		populate_dropdown(
			categories_el,
			natural_sort(categories[category]).map((category) => [category.name, category.id])
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
		//TODO fix snapshot sorting
		let subvers = sub_versions.find((x) => x.type === version).versions;
		populate_dropdown(
			sub_version_el,
			sort_subvers(subvers).map((x) => [x, x])
		);
	});

	// sort
	populate_dropdown(sort_field_el, SORT_FIELDS, "Total Downloads");
	populate_dropdown(sort_order_el, SORT_ORDERS, "desc");

	/* handle form submission */
	async function update_results(event) {
		event.preventDefault();

		let params = new URLSearchParams(new FormData(search_form));
		params.append("gameId", GAME_ID);

		// index is the index of the first item to include in the response
		params.append("index", parseInt(params.get("pageSize"), 10) * parseInt(params.get("page")));
		params.delete("page");

		loading_indicator.hidden = false;
		let search_results = await cf_api("/v1/mods/search", params);
		console.log(search_results);
		populate_results(search_results);
		loading_indicator.hidden = true;
	}

	function populate_results(results) {
		let fragment = document.createDocumentFragment();
		for (let result of results) {
			let li = document.createElement("li");
			li.className = "result";

			let title = document.createElement("a");
			title.className = "result-title";
			title.href = result.links.websiteUrl;
			title.textContent = result.name;

			let secondary = document.createElement("div");
			secondary.className = "result-secondary";
			let downloads = document.createElement("span");
			downloads.textContent = `${human_readable(result.downloadCount)} Downloads`;
			let updated = document.createElement("span");
			updated.textContent = `Updated ${new Date(result.dateModified).toLocaleDateString()}`;
			let created = document.createElement("span");
			created.textContent = `Created ${new Date(result.dateCreated).toLocaleDateString()}`;
			secondary.append(downloads, updated, created);

			let categories = document.createElement("div");
			categories.className = "result-categories";
			for (let category of result.categories) {
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
			logo.src = result.logo.url;

			li.append(logo, title, secondary, categories);
			fragment.append(li);
		}
		results_el.innerHTML = "";
		results_el.appendChild(fragment);
	}

	search_form.addEventListener("submit", update_results);
	Array.from(page_els).forEach((el) => el.addEventListener("change", update_results));
	update_results({ preventDefault: () => {} });
})();
