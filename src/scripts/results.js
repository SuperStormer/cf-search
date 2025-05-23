import { filter_results } from "./filters";
import { GAME_ID } from "./consts";
import { cf_api } from "./api";
import { human_readable, natural_compare, uniq_by } from "./utils";

let search_results = [];

// prevent double update_results with an AbortController
let current_ac = null;
export let current_updating_event = "";

function fix_hostname(original_url, is_legacy_cf) {
	// replace hostname to fix #8
	let url = new URL(original_url);
	url.hostname = is_legacy_cf ? "legacy.curseforge.com" : "www.curseforge.com";
	return url.toString();
}
export async function* fetch_results(form_data, page, event_name) {
	let params = new URLSearchParams(form_data);

	// index + page_size <= 10,000 is a CF API limitation
	let page_size = Number.parseInt(params.get("pageSize"), 10);
	if (page_size * (page + 1) > 10000) {
		alert("The desired page is too large for the Curseforge API");
		return;
	}

	// cancel any updates in progress
	if (current_ac !== null) {
		current_ac.abort();
	}

	current_ac = new AbortController();
	current_updating_event = event_name;

	params.append("gameId", GAME_ID);

	// workaround for Curseforge API being bad
	if (params.get("gameVersion") && params.get("modLoaderType") === "0") {
		params.delete("modLoaderType");
	}

	search_results = [];
	try {
		// since CF API only lets us fetch 50 items at a time,
		// we have to split the desired pageSize into multiple requests
		let queries = [];
		for (let offset = 0; offset < page_size; offset += 50) {
			let real_page_size = Math.min(50, page_size - offset);
			let params2 = new URLSearchParams(params);

			// index is the index of the first item to include in the response
			let index = page_size * page + offset;

			params2.set("index", index);
			params2.set("pageSize", real_page_size);

			// workaround for #10
			// we do it here so it doesn't affect the modpack branch of get_download_url
			if (params2.get("gameVersion")) {
				params2.delete("gameVersionTypeId");
			}

			queries.push(cf_api("/v1/mods/search", params2, { signal: current_ac.signal }));
		}

		// await each query sequentially to ensure result elements are properly ordered
		let query_results = [];
		for (let query of queries) {
			let query_result = (await query).filter(
				// fix CF API returning shaders in customization search
				(result) => result.classId === parseInt(params.get("classId"), 10)
			);
			console.log(query_result);
			yield query_result;
			query_results.push(query_result);
		}
		search_results = query_results.flat();

		current_ac = null;
		current_updating_event = null;
	} catch (error) {
		if (error.name !== "AbortError") {
			throw error;
		}
	}
}

export function populate_results(results_el, filters, results, settings) {
	results = filter_results(results, filters, settings.hidden_authors.value);

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
		title_link.href = fix_hostname(result.links.websiteUrl, settings.use_legacy_cf.value);
		title_link.textContent = result.name;
		title.append(title_link);

		// check needed to fix #9
		if (result.authors.length > 0) {
			let author = document.createElement("span");
			author.className = "result-author";
			let author_link = document.createElement("a");
			author_link.className = "result-author-link";
			author_link.href = fix_hostname(result.authors[0].url, settings.use_legacy_cf.value);
			author_link.textContent = result.authors[0].name;
			author.append("by", author_link);
			title.append(author);
		}

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
		// uniquify categories to fix #20
		for (let category of uniq_by(result.categories, "id")) {
			// TODO change link to change form param instead
			let category_el = document.createElement("a");
			category_el.href = fix_hostname(category.url, settings.use_legacy_cf.value);

			let category_img = document.createElement("img");
			category_img.className = "result-category-image";
			category_img.src = category.iconUrl;
			category_img.title = category.name;

			category_el.append(category_img);
			categories.append(category_el);
		}

		// project id
		let id = document.createElement("span");
		id.className = "result-project-id";
		id.textContent = `Project ID: ${result.id}`;

		// download button
		let download = document.createElement("a");
		download.className = "download-button";
		download.href = fix_hostname(
			get_download_url(result, params),
			settings.use_legacy_cf.value
		);
		let download_button = document.createElement("button");
		download_button.textContent = "Download";
		// nesting an <button> within an <a> is technically invalid HTML5, but I don't care
		download.append(download_button);

		//logo
		let logo = document.createElement("img");
		logo.className = "result-logo";
		if (result.logo) {
			// fallback to url (fixes #18)
			logo.src = result.logo.thumbnailUrl || result.logo.url;
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

	// handle mods where subver and mod loader are both set
	// otherwise file to download is ambigious (file for the wrong MC version will break)
	if (
		is_mod &&
		params.get("gameVersion") &&
		params.has("modLoaderType") &&
		params.get("modLoaderType") !== "0"
	) {
		// fabric didn't exist before 1.14, so a lot of the old files are untagged with mod loader
		let is_old_forge = natural_compare(subver, "1.14") < 0 && modloader === 1;

		try {
			let file_id = result.latestFilesIndexes.find(
				(file) =>
					file.gameVersion === subver &&
					(file.modLoader === modloader || (file.modLoader == null && is_old_forge))
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
					(!subver || file.gameVersion === subver)
			).fileId;
			return `${result.links.websiteUrl}/download/${file_id}/file`;
		} catch (e) {
			if (e instanceof TypeError) {
				console.log(`${result.name} has improperly tagged files`);
			}
			// fall through
		}
	} else if (!is_mod && !is_modpack && params.get("gameVersion")) {
		// handle resourcepacks and worlds
		// only when subversion is set (otherwise, causes conflicts)
		try {
			let file_id = result.latestFilesIndexes.find(
				(file) => file.gameVersion === subver
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

export function refresh_results(results_el, filters, settings) {
	// refresh results based on updated filters/settings
	// setTimeout to avoid delay in checkbox visual update for large lists
	setTimeout(() => {
		results_el.innerHTML = "";
		populate_results(results_el, filters, search_results, settings);
	}, 0);
}
