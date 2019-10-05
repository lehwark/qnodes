const path = require('path');


const frontend = (env) => ({
	target: 'web',
	entry: {
		index: './src/QNodes.ts'
	},
	mode: env === "prod" ? "production" : "development",
	output: {
		path: path.resolve(__dirname, 'build'),
		filename: '[name].js',
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	module: {
		rules: [
			{ test: /\.tsx?$/, loader: "ts-loader" }
		]
	},
	devtool: env === "prod" ? "none" : "source-map",
	optimization: { minimize: env === "prod" },
	watchOptions: {
		ignored: /node_modules/
	}
});


module.exports = (env) => {
	return [
		Object.assign({}, frontend(env)),
	];
}