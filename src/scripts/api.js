import { API_KEY } from "./consts";
export async function cf_api(endpoint, params, additional_args) {
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
		...additional_args,
	})
		.then((resp) => resp.json())
		.then((json) => json.data);
}
