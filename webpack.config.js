const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    main: "./src/example.ts",
    "pdf.worker": path.join(
      __dirname,
      "./node_modules/pdfjs-dist/build/pdf.worker.js"
    ),
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/i,
        type: "asset/inline",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new webpack.NormalModuleReplacementPlugin(/^pdfjs-dist$/, (resource) => {
      resource.request = path.join(
        __dirname,
        "./node_modules/pdfjs-dist/webpack"
      );
    }),
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "public/index.html",
    }),
  ],
};
