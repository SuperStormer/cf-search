import { DEFAULT_PARAMS } from "./consts";
export function update_query_params(params, filters) {
	let params2 = new URLSearchParams(params);
	// don't overwrite filters query params
	let [include, exclude, max_ver, min_ver] = filters;
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
