/* eslint-env node */
const TerserPlugin = require("terser-webpack-plugin");
const PROD = process.env.NODE_ENV !== "development";
module.exports = {
	mode: PROD ? "production" : "development",
	entry: "./src/scripts/index.js",
	optimization: {
		minimize: PROD,
		minimizer: [new TerserPlugin()],
	},
	output: {
		filename: "index.js",
	},
};
