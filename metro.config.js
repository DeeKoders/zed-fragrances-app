// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Emblems are SVG files rendered as they are (expo-image), so they bundle as assets.
if (!config.resolver.assetExts.includes("svg")) config.resolver.assetExts.push("svg");

module.exports = config;
