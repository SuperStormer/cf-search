import { natural_sort, group_by, format_categories, sort_vers } from "./utils";
import { GAME_ID } from "./consts";
import { cf_api } from "./api";

/* populate dropdowns */
export function populate_dropdown(dropdown, values, defaultValue) {
	dropdown.innerHTML = "";
	let fragment = document.createDocumentFragment();

	for (let [name, value] of values) {
		let option = document.createElement("option");
		option.value = value;
		option.textContent = name;
		fragment.append(option);
	}

	dropdown.append(fragment);

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
	let brokenModCategories = new Set([5192, 4780, 5190, 5129]);
	categories[6] = categories[6].filter((x) => !brokenModCategories.has(x.id));
	return [classes, categories];
}

async function fetch_vers() {
	return sort_vers(await cf_api(`/v1/games/${GAME_ID}/version-types`));
}

function fetch_subvers() {
	return cf_api(`/v1/games/${GAME_ID}/versions`);
}

// fetch in parallel and cache
export async function fetch_dropdown_values() {
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
	return [classes, categories, versions, sub_versions];
}
