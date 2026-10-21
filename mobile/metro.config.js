// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// The Bikoom repo is not an npm workspace, but the app imports shared
// types from ../../shared — watch the repo root so Metro resolves and
// hot-reloads those files.
config.watchFolders = [workspaceRoot];

module.exports = config;
