import { DEFAULT_PARAMS } from "./consts";

const API_PARAM_MAP = new Map([
	["class", "classId"],
	["category", "categoryId"],
	["version", "gameVersionTypeId"],
	["sub_version", "gameVersion"],
	["modloader", "modLoaderType"],
	["sort_field", "sortField"],
	["sort_order", "sortOrder"],
	["search", "searchFilter"],
	["page_size", "pageSize"],
]);

// map from old query string names to new ones
const LEGACY_PARAM_MAP = new Map([
	...API_PARAM_MAP.entries().map(([k, v]) => [v, k]),
	["filtersInclude", "include_filters"],
	["filtersExclude", "exclude_filters"],
	["maxVer", "max_ver"],
	["minVer", "min_ver"],
]);

export function update_query_params(params, filters) {
	let params2 = new URLSearchParams(params);
	// don't overwrite filters query params
	let { include, exclude, max_ver, min_ver } = filters;
	params2.set("filtersInclude", include.join(" "));
	params2.set("filtersExclude", exclude.join(" "));
	params2.set("maxVer", max_ver);
	params2.set("minVer", min_ver);

	// remove unnecessary query params
	// use Array.from to clone the entries to avoid deleting values from what we're iterating over
	for (let [key, value] of Array.from(params2.entries())) {
		if ((key in DEFAULT_PARAMS && value === DEFAULT_PARAMS[key]) || value === "") {
			params2.delete(key);
		}
	}
	if (window.location.search !== "?" + params2.toString()) {
		history.pushState({}, "", "?" + params2.toString());
	}
}

export function to_api_params(params) {
	let new_params = new URLSearchParams();
	for (let [key, value] of params.entries()) {
		new_params.append(API_PARAM_MAP.get(key) || key, value);
	}
	return new_params;
}

export function load_query_params() {
	let params = new URLSearchParams(window.location.search);
	let new_params = new Map();
	for (let [key, value] of params) {
		new_params.set(LEGACY_PARAM_MAP.get(key) || key, value);
	}

	return new_params;
}
