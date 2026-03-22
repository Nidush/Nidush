// const { getDefaultConfig } = require("expo/metro-config");
// const { withNativeWind } = require("nativewind/metro");

// module.exports = (() => {
//   const config = getDefaultConfig(__dirname);

//   const { transformer, resolver } = config;

//   config.transformer = {
//     ...transformer,
//     babelTransformerPath: require.resolve("react-native-svg-transformer"),
//   };

//   config.resolver = {
//     ...resolver,
//     assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
//     sourceExts: [...resolver.sourceExts, "svg"],
//   };

//   return withNativeWind(config, { input: "./global.css" });
// })();
// metro.config.js
import { getDefaultConfig } from "@expo/metro-config";
import { withNativeWind } from "nativewind/dist/metro/index.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const config = getDefaultConfig(process.cwd());

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer"),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter(ext => ext !== "svg"),
  sourceExts: [...resolver.sourceExts, "svg"],
};

export default withNativeWind(config, { input: "./global.css" });