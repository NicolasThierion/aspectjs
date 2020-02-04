const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
   mode: 'production',
 });

module.exports = {
    mode: 'development',
    entry: './src/lib.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'aspect-core.js',
        library: 'AspectJS',
        libraryTarget: 'umd',
    },
    devtool: 'eval',
    optimization: {
        runtimeChunk: true,
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
};
