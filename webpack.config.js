/* eslint-env node */
const TerserPlugin = require("terser-webpack-plugin");
const PROD = process.env.NODE_ENV !== "development";
module.exports = {
	mode: PROD ? "production" : "development",
	entry: "./src/scripts/index.js",
	devtool: PROD ? "source-map" : "eval-source-map",
	optimization: {
		minimize: PROD,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: true,
					},
				},
			}),
		],
	},
	output: {
		filename: "index.js",
	},
};
