var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var helpers = require('./helpers');

module.exports = {
    entry: {
        'polyfills': './src/polyfills.ts',
        'vendor': './src/vendor.ts',
        'app': './src/main.ts',
      //  'tooltip': './vendor/pixeladmin/js/amd/pixeladmin/extensions/tooltip.js',
       /*   'js/alert.js',
          'js/button.js',
          'js/carousel.js',
          'js/collapse.js',
          'js/dropdown.js',
          'js/modal.js',
          'js/tooltip.js',
          'js/popover.js',
          'js/scrollspy.js',
          'js/tab.js',
          'js/affix.js'*/
        
    },

    resolve: {
        extensions: ['', '.ts', '.js']
    },
    output: {
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loaders: ['awesome-typescript-loader', 'angular2-template-loader']
            },
            {
                test: /\.html$/,
                loader: 'html'
            },
            {
                test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
                loader: 'file?name=assets/[name].[hash].[ext]'
            },
            /* {
                 test: /\.css$/,
                 exclude: helpers.root('src', 'app'),
                 loader: ExtractTextPlugin.extract('style', 'css?sourceMap')
             },*/
            {
                test: /\.css$/,
                //   include: helpers.root('src', 'app', 'login'),
                loader: 'raw'
            },
           /* {
                test: /\.scss$/,
                loaders: ['raw-loader']
            }*/]
    },
    plugins: [
        new webpack.optimize.CommonsChunkPlugin({
            name: ['app', 'vendor', 'polyfills']
        }),

        new HtmlWebpackPlugin({
            template: 'src/index.html'
        })
    ],
    devServer: {
        headers: { 'Access-Control-Allow-Origin': '*' }
    }
}