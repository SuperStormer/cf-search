import { sort_classes, group_by, format_categories, sort_vers } from "./utils";
import { GAME_ID } from "./consts";
import { cf_api } from "./api";

/* populate dropdowns */
export function populate_dropdown(dropdown, values, default_value) {
	dropdown.innerHTML = "";
	let fragment = document.createDocumentFragment();

	for (let [name, value] of values) {
		let option = document.createElement("option");
		option.value = value;
		option.textContent = name;
		fragment.append(option);
	}

	dropdown.append(fragment);

	if (default_value == undefined) {
		// if no default value is specified, create a default option with the category name
		// based on https://stackoverflow.com/a/8442831
		let default_option = document.createElement("option");
		default_option.value = "";
		default_option.selected = true;
		default_option.textContent = dropdown.dataset.name;
		dropdown.dataset.default = "";
		dropdown.prepend(default_option);
	} else {
		// otherwise, select the corresponding <option>
		let option = Array.from(dropdown.options).find((x) => x.value === default_value);
		option.selected = true;
		dropdown.dataset.default = default_value;
		dropdown.dispatchEvent(new Event("change"));
	}
}

/* fetch dropdown values from CF API */
async function fetch_categories() {
	let categories = await cf_api("/v1/categories", { gameId: GAME_ID });
	categories = group_by(categories, "classId");

	let classes = sort_classes(categories[undefined]);
	delete categories[undefined];

	// ignore bukkit plugins, customizations, addons, shaders
	// API doesn't work and I don't feel like figuring out why
	let broken_classes = [5, 4546, 4559, 4979, 6552];
	for (let id of broken_classes) {
		delete categories[id];
	}
	classes = classes.filter((x) => !broken_classes.includes(x.id));

	// format categories
	for (let class_ in categories) {
		categories[class_] = format_categories(categories[class_], class_);
	}

	// ignore Fabric, FancyMenu, QoL, Vanilla+ tags
	// these tags don't exist anymore, idk why they're still in the API
	let broken_mod_categories = [5192, 4780, 5190, 5129];
	categories[6] = categories[6].filter((x) => !broken_mod_categories.includes(x.id));
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
