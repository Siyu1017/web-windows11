const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserWebpackPlugin = require("terser-webpack-plugin");
const WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
    context: path.resolve(__dirname, 'public/src'),
    entry: {
        main: ['../src/index.js', '../src/index.css'],
        admin: ['../src/admin.js', '../src/admin.css']
    },
    mode: process.env.NODE_ENV,
    devtool: 'hidden-source-map',
    output: {
        path: path.resolve(__dirname, 'public/dist'),
        filename: '[name].[contenthash].js',
        hashDigestLength: 6
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: [MiniCssExtractPlugin.loader, "css-loader"],
            },
        ],
    },
    optimization: {
        minimize: true,
        minimizer: [new TerserWebpackPlugin()],
    },
    plugins: [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css'
        }),
        new HtmlWebpackPlugin({
            chunks: ["main"],
            filename: "index.html",
            template: '../../index.html'
        }),
        new HtmlWebpackPlugin({
            chunks: ["admin"],
            filename: "admin.html",
            template: '../../admin.html'
        }),
        new WebpackObfuscator({
            rotateUnicodeArray: true
        })
    ],
}
