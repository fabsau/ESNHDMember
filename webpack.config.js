const path = require("path");

module.exports = {
  entry: "./views/main.js",

  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public"),
  },
  module: {
    rules: [
      {
        // Apply rule for .js
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          // Use babel loader
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"],
          },
        },
      },
      {
        // Apply rule for .css files
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
};
