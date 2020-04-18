var webpack = require("webpack");
var path = require ("path");

var DIST_DIR = path.resolve(__dirname,"dist");
var SRC_DIR = path.resolve(__dirname,"src");

var config = {

	devServer: {
    	headers: {
      //   	"Access-Control-Allow-Origin": "*",
      //   	"Access-Control-Allow-Credentials": "true",
    		// "Access-Control-Allow-Headers": "Content-Type, Authorization, x-id, Content-Length, X-Requested-With",
    		// "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS"
        }
	},
	entry: {
		bundle: SRC_DIR + "/app/index.jsx",
		dep: SRC_DIR + "/app/dep.jsx"
	},
	output: {
		path: DIST_DIR + "/app",
		filename: "[name].js",
		publicPath: "/app/"
	},
	resolve: {
		alias: {
			'node_modules': path.join(__dirname, 'node_modules')
		}
	},
	devtool: "source-map",
	module: {
		rules: [
			{
				test: /\.(js|jsx)?/,
				include: SRC_DIR,
				exclude: /node_modules/,
				loader: "babel-loader",
			},
			{
			  test: /jquery.min.js$/,
			  use: [{
			      loader: 'expose-loader',
			      options: 'jQuery'
			  },{
			      loader: 'expose-loader',
			      options: '$'
			  }]
			},
			{
			    test: /\.(scss)$/,
			    use: [
			    	{ loader: 'style-loader', }, // inject CSS to page
			    	{ loader: 'css-loader', }, // translates CSS into CommonJS modules 
			    	{ loader: 'postcss-loader', // Run post css actions
			      		options: {
			        		plugins: function () { // post css plugins, can be exported to postcss.config.js
			          			return [
			            			require('precss'),
			            			require('autoprefixer')
			          			];
			        		}
			      		}
			    	}, 
			    	{ loader: 'sass-loader' } // compiles Sass to CSS
				]
			},
			{
        		test: /\.css$/,
        		use: ['style-loader', 'css-loader']
      		},
      		{
		        test: /\.woff2?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
		        use: 'url-loader?limit=10000',
			},
			{
				test: /\.(svg)$/,
		        use: 'file-loader',
		    },
			{
				test: /\.(png)$/,
		        use: 'file-loader',
		    },
			{
				test: /\.(ttf|eot|svg)(\?[\s\S]+)?$/,
		        use: 'file-loader',
		    },
		    {
		    	test: /\.(jpe?g|png|gif|svg)$/i,
		    	use: [
		    		'file-loader?name=images/[name].[ext]',
		        	'image-webpack-loader?bypassOnDebug'
		        ]
		    }
		]
	}
};

module.exports = config;