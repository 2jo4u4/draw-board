const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: {
    index: "./src/index.ts",
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
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
    library: "canvaslib",
    libraryTarget: "umd",
  },
  target: "web",
  plugins: [
    new HtmlWebpackPlugin({
      filename: "index.html",
      template: "public/index.html",
    }),
  ],
};
