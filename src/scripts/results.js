import { get_active_filters, filter_results } from "./filters";
import { GAME_ID } from "./consts";
import { cf_api } from "./api";
import { human_readable } from "./utils";

let search_results = [];
// prevent double update_results with an AbortController
let current_ac = null;
export let current_updating_event = "";

export async function update_results(
	results_el,
	search_form,
	filters_el,
	loading_indicator,
	page,
	event_name,
	show_ids
) {
	if (current_ac !== null) {
		current_ac.abort();
	}
	current_ac = new AbortController();
	current_updating_event = event_name;

	let params = new URLSearchParams(new FormData(search_form));

	// update query params if not already set
	if (!["default", "reset", "popstate"].includes(current_updating_event)) {
		let params2 = new URLSearchParams(params);

		// don't overwrite filters query params
		let [include, exclude] = get_active_filters(filters_el);
		params2.set("filtersInclude", include.join(" "));
		params2.set("filtersExclude", exclude.join(" "));
		if (window.location.search !== "?" + params2.toString()) {
			history.pushState({}, "", "?" + params2.toString());
		}
	}

	params.append("gameId", GAME_ID);

	// work-around for curseforge API being bad
	if (params.get("gameVersion") && params.get("modLoaderType") === "0") {
		params.delete("modLoaderType");
	}

	loading_indicator.hidden = false;
	results_el.innerHTML = "";

	search_results = [];
	try {
		// since CF API only lets us fetch 50 at a time,
		// this horrible code splits the desired pageSize into multiple requests
		let queries = [];
		let page_size = Number.parseInt(params.get("pageSize"), 10);

		for (let offset = 0; offset < page_size; offset += 50) {
			let real_page_size = Math.min(50, page_size - offset);
			let params2 = new URLSearchParams(params);

			// index is the index of the first item to include in the response
			let index = page_size * page + offset;

			params2.set("index", index);
			params2.set("pageSize", real_page_size);

			queries.push(cf_api("/v1/mods/search", params2, { signal: current_ac.signal }));
		}
		// await each query sequentially to ensure result elements are properly ordered
		let query_results = [];
		for (let query of queries) {
			let query_result = await query;
			console.log(query_result);
			populate_results(results_el, filters_el, query_result, show_ids);
			query_results.push(query_result);
		}
		search_results = query_results.flat();

		loading_indicator.hidden = true;

		current_ac = null;
		current_updating_event = null;
	} catch (error) {
		if (error.name !== "AbortError") {
			throw error;
		}
	}
}

export function populate_results(results_el, filters_el, results, show_ids) {
	let [include, exclude] = get_active_filters(filters_el);
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
		let id = document.createElement("span");
		id.className = "project-id";
		id.textContent = `Project ID: ${result.id}`;
		secondary.append(downloads, updated, created, id);

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

			el.append(img);
			categories.append(el);
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
	results_el.append(fragment);
}

export function populate_results_delayed(results_el, filters_el, show_ids) {
	results_el.innerHTML = "";
	// setTimeout to avoid delay in checkbox visual update for large lists
	setTimeout(() => populate_results(results_el, filters_el, search_results, show_ids), 0);
}
