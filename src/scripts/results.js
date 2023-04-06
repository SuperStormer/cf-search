import { update_query_params, filter_results } from "./filters";
import { GAME_ID } from "./consts";
import { cf_api } from "./api";
import { human_readable, natural_compare } from "./utils";

let search_results = [];
// prevent double update_results with an AbortController
let current_ac = null;
export let current_updating_event = "";

export async function update_results(
	results_el,
	loading_indicator,
	form_data,
	filters,
	page,
	event_name
) {
	if (current_ac !== null) {
		current_ac.abort();
	}
	current_ac = new AbortController();
	current_updating_event = event_name;

	let params = new URLSearchParams(form_data);

	// update query params only if search parameters were modified
	if (current_updating_event == "control_change") {
		update_query_params(params, filters);
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
			populate_results(results_el, filters, query_result);
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

export function populate_results(results_el, filters, results) {
	results = filter_results(results, filters);

	let params = new URLSearchParams(window.location.search);

	let fragment = document.createDocumentFragment();
	for (let result of results) {
		let li = document.createElement("li");
		li.className = "result";

		//title
		let title = document.createElement("div");
		title.className = "result-title";

		let title_link = document.createElement("a");
		title_link.className = "result-title-link";
		title_link.href = result.links.websiteUrl;
		title_link.textContent = result.name;

		let author = document.createElement("span");
		author.className = "result-author";
		let author_link = document.createElement("a");
		author_link.className = "result-author-link";
		author_link.href = result.authors[0].url;
		author_link.textContent = result.authors[0].name;
		author.append("by", author_link);

		title.append(title_link, author);

		// subtitle
		let subtitle = document.createElement("div");
		subtitle.className = "result-subtitle";
		let downloads = document.createElement("span");
		downloads.textContent = `${human_readable(result.downloadCount)} Downloads`;
		let updated = document.createElement("span");
		updated.textContent = `Updated ${new Date(result.dateModified).toLocaleDateString()}`;
		let created = document.createElement("span");
		created.textContent = `Created ${new Date(result.dateCreated).toLocaleDateString()}`;
		subtitle.append(downloads, updated, created);

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

		// project id
		let id = document.createElement("span");
		id.className = "result-project-id";
		id.textContent = `Project ID: ${result.id}`;

		// download button
		let download = document.createElement("a");
		download.className = "download-button";
		download.href = get_download_url(result, params);
		let download_button = document.createElement("button");
		download_button.textContent = "Download";
		// nesting an <button> within an <a> is technically invalid HTML5, but I don't care
		download.append(download_button);

		//logo
		let logo = document.createElement("img");
		logo.className = "result-logo";
		if (result.logo) {
			logo.src = result.logo.thumbnailUrl;
		}
		logo.alt = "";

		li.append(logo, categories, download, id, title, subtitle, summary);
		fragment.append(li);
	}
	results_el.append(fragment);
}

function get_download_url(result, params) {
	let is_mod = params.get("classId") === "6";
	let is_modpack = params.get("classId") === "4471";
	let subver = params.get("gameVersion");
	let version = Number.parseInt(params.get("gameVersionTypeId"), 10);
	let modloader = Number.parseInt(params.get("modLoaderType"), 10);

	// handle mods where version, subver and mod-loader are all set
	// otherwise file to download is ambigious (file for the wrong MC version will break)
	if (
		is_mod &&
		params.get("gameVersion") &&
		params.get("gameVersionTypeId") &&
		params.has("modLoaderType") &&
		params.get("modLoaderType") !== "0"
	) {
		// fabric didn't exist before 1.14, so a lot of the old files are untagged with mod loader
		let is_old_forge = natural_compare(subver, "1.14") < 0 && modloader === 1;

		try {
			let file_id = result.latestFilesIndexes.find(
				(file) =>
					file.gameVersionTypeId === version &&
					file.gameVersion === subver &&
					(file.modLoader === modloader || (file.modLoader === null && is_old_forge))
			).fileId;
			return `${result.links.websiteUrl}/download/${file_id}/file`;
		} catch (e) {
			if (e instanceof TypeError) {
				console.log(`${result.name} has improperly tagged files`);
			}
			// fall through
		}
	} else if (is_modpack) {
		// handle all modpacks
		// if subver is unset, fallback to latest from the version
		// if ver is unset, fallback to latest file from any MC version.
		// This is safe, because downloading a pack for a random MC version *won't* cause conflicts,
		// unlike mods, resourcepacks, or worlds where a file for the wrong MC version will break something.
		try {
			let file_id = result.latestFilesIndexes.find(
				(file) =>
					(Number.isNaN(version) || file.gameVersionTypeId === version) &&
					(subver === "" || file.gameVersion === subver)
			).fileId;
			return `${result.links.websiteUrl}/download/${file_id}/file`;
		} catch (e) {
			if (e instanceof TypeError) {
				console.log(`${result.name} has improperly tagged files`);
			}
			// fall through
		}
	} else if (
		!is_mod &&
		!is_modpack &&
		params.get("gameVersion") &&
		params.get("gameVersionTypeId")
	) {
		// handle resourcepacks and worlds
		// only when version and subversion are both set (otherwise, causes conflicts)
		try {
			let file_id = result.latestFilesIndexes.find(
				(file) => file.gameVersionTypeId === version && file.gameVersion === subver
			).fileId;
			return `${result.links.websiteUrl}/download/${file_id}/file`;
		} catch (e) {
			if (e instanceof TypeError) {
				console.log(`${result.name} has improperly tagged files`);
			}
			// fall through
		}
	}
	return `${result.links.websiteUrl}/files/all`;
}

export function populate_results_delayed(results_el, filters) {
	results_el.innerHTML = "";
	// setTimeout to avoid delay in checkbox visual update for large lists
	setTimeout(() => populate_results(results_el, filters, search_results), 0);
}
