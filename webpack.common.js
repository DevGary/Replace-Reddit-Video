const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WebpackExtensionManifestPlugin = require("webpack-extension-manifest-plugin");
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );

const projectNameNoSpace = "replace-reddit-video"
const chromeBaseManifest = require("./src/chrome/manifest.json");
const npmPackageConfig = require("./package.json");

module.exports = {

    entry: {
        app: path.join(__dirname, "/src/app/main.ts"),
    },

    output: {
        path: path.resolve( __dirname, 'dist' ),
        filename: `${projectNameNoSpace}.js`,
    },

    plugins: [
        new CopyPlugin({
            patterns: [
                { from: './src/assets', to: './assets' },
                { from: './src/settings', to: './settings' },
                { from: './src/lib', to: './lib' },
                { from: './src/styles', to: './styles' },
            ],
        }),
        new WebpackExtensionManifestPlugin({
            config: {
                base: chromeBaseManifest,
                extend: { 
                    name: npmPackageConfig.nameWithSpace,
                    description: npmPackageConfig.description,
                    author: npmPackageConfig.author,
                    version: npmPackageConfig.version,
                }
            }
        }),
        new CleanWebpackPlugin(),
        new ForkTsCheckerWebpackPlugin(), // run TSC on a separate thread
    ],

    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },

    module: {
        rules: [
            {
                test: /\.tsx?/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                    }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ["babel-loader"]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: ["file-loader"]
            },
        ]
    },
};
