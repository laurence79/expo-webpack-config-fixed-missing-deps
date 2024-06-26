"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAbsolute = exports.getProductionPath = exports.getPublicPaths = exports.getServedPath = exports.getPathsAsync = exports.getPaths = void 0;
/* eslint-env node */
const config_1 = require("@expo/config");
const paths_1 = require("@expo/config/paths");
const find_yarn_workspace_root_1 = __importDefault(require("find-yarn-workspace-root"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const getMode_1 = __importDefault(require("./getMode"));
/** Wraps `findYarnOrNpmWorkspaceRoot` and guards against having an empty `package.json` file in an upper directory. */
function findYarnOrNpmWorkspaceRootSafe(projectRoot) {
    try {
        return (0, find_yarn_workspace_root_1.default)(projectRoot);
    }
    catch (error) {
        if (error.message.includes('Unexpected end of JSON input')) {
            return null;
        }
        throw error;
    }
}
function getAbsolutePathWithProjectRoot(projectRoot, ...pathComponents) {
    // Simple check if we are dealing with a URL.
    if ((pathComponents === null || pathComponents === void 0 ? void 0 : pathComponents.length) === 1 && pathComponents[0].startsWith('http')) {
        return pathComponents[0];
    }
    return path_1.default.resolve(projectRoot, ...pathComponents);
}
function getModulesPath(projectRoot) {
    const workspaceRoot = findYarnOrNpmWorkspaceRootSafe(path_1.default.resolve(projectRoot)); // Absolute path or null
    if (workspaceRoot) {
        return path_1.default.resolve(workspaceRoot, 'node_modules');
    }
    return path_1.default.resolve(projectRoot, 'node_modules');
}
function getPlatformExtensions(platform) {
    if (platform === 'ios' || platform === 'android') {
        return [platform, 'native'];
    }
    return [platform];
}
function parsePaths(projectRoot, nativeAppManifest, env = {}) {
    var _a;
    const inputProjectRoot = projectRoot || (0, paths_1.getPossibleProjectRoot)();
    function absolute(...pathComponents) {
        return getAbsolutePathWithProjectRoot(inputProjectRoot, ...pathComponents);
    }
    const packageJsonPath = absolute('package.json');
    const modulesPath = getModulesPath(inputProjectRoot);
    const productionPath = absolute((0, config_1.getWebOutputPath)(nativeAppManifest));
    function templatePath(filename = '') {
        var _a;
        const overridePath = absolute((_a = env.platform) !== null && _a !== void 0 ? _a : 'web', filename);
        if (fs_1.default.existsSync(overridePath)) {
            return overridePath;
        }
        return path_1.default.join(__dirname, '../../web-default', filename);
    }
    function getProductionPath(...props) {
        return path_1.default.resolve(productionPath, ...props);
    }
    function getIncludeModule(...props) {
        return path_1.default.resolve(modulesPath, ...props);
    }
    let appMain = null;
    try {
        appMain = (0, paths_1.getEntryPoint)(inputProjectRoot, ['./index', './src/index'], getPlatformExtensions((_a = env.platform) !== null && _a !== void 0 ? _a : 'web'));
    }
    catch {
        // ignore the error
    }
    return {
        absolute,
        includeModule: getIncludeModule,
        packageJson: packageJsonPath,
        root: path_1.default.resolve(inputProjectRoot),
        appMain,
        modules: modulesPath,
        servedPath: getServedPath(inputProjectRoot),
        template: {
            get: templatePath,
            folder: templatePath(),
            indexHtml: templatePath('index.html'),
            manifest: templatePath('manifest.json'),
            serveJson: templatePath('serve.json'),
            favicon: templatePath('favicon.ico'),
        },
        production: {
            get: getProductionPath,
            folder: getProductionPath(),
            indexHtml: getProductionPath('index.html'),
            manifest: getProductionPath('manifest.json'),
            serveJson: getProductionPath('serve.json'),
            favicon: getProductionPath('favicon.ico'),
        },
    };
}
/**
 * Sync method for getting default paths used throughout the Webpack config.
 * This is useful for Next.js which doesn't support async Webpack configs.
 *
 * @param projectRoot
 * @category env
 */
function getPaths(projectRoot, env = {}) {
    const { exp } = (0, config_1.getConfig)(projectRoot, {
        skipSDKVersionRequirement: true,
    });
    return parsePaths(projectRoot, exp, env);
}
exports.getPaths = getPaths;
/**
 * Async method for getting default paths used throughout the Webpack config.
 *
 * @param projectRoot
 * @category env
 */
async function getPathsAsync(projectRoot, env = {}) {
    let exp;
    try {
        exp = (0, config_1.getConfig)(projectRoot, { skipSDKVersionRequirement: true }).exp;
    }
    catch { }
    return parsePaths(projectRoot, exp, env);
}
exports.getPathsAsync = getPathsAsync;
/**
 * Get paths dictating where the app is served regardless of the current Webpack mode.
 *
 * @param projectRoot
 * @category env
 */
function getServedPath(projectRoot) {
    const { pkg } = (0, config_1.getConfig)(projectRoot, {
        skipSDKVersionRequirement: true,
    });
    const envPublicUrl = process.env.WEB_PUBLIC_URL;
    // We use `WEB_PUBLIC_URL` environment variable or "homepage" field to infer
    // "public path" at which the app is served.
    // Webpack needs to know it to put the right <script> hrefs into HTML even in
    // single-page apps that may serve index.html for nested URLs like /todos/42.
    // We can't use a relative path in HTML because we don't want to load something
    // like /todos/42/static/js/bundle.7289d.js. We have to know the root.
    const publicUrl = envPublicUrl || pkg.homepage;
    const servedUrl = envPublicUrl || (publicUrl ? url_1.default.parse(publicUrl).pathname : '/');
    return (0, paths_1.ensureSlash)(servedUrl, true);
}
exports.getServedPath = getServedPath;
/**
 * Get paths dictating where the app is served. In development mode this returns default values.
 *
 * @param env
 * @category env
 */
function getPublicPaths(env) {
    const parsedMode = (0, getMode_1.default)(env);
    if (parsedMode === 'production') {
        const publicPath = getServedPath(env.projectRoot);
        return {
            publicPath,
            publicUrl: publicPath.slice(0, -1),
        };
    }
    return { publicUrl: '', publicPath: '/' };
}
exports.getPublicPaths = getPublicPaths;
/**
 * Get the output folder path. Defaults to `web-build`.
 *
 * @param projectRoot
 * @category env
 */
function getProductionPath(projectRoot) {
    const { exp } = (0, config_1.getConfig)(projectRoot, {
        skipSDKVersionRequirement: true,
    });
    return getAbsolutePathWithProjectRoot(projectRoot, (0, config_1.getWebOutputPath)(exp));
}
exports.getProductionPath = getProductionPath;
/**
 * Get an absolute path relative to the project root while accounting for remote paths (`https://`).
 *
 * @param projectRoot
 * @category env
 */
function getAbsolute(projectRoot, ...pathComponents) {
    const inputProjectRoot = projectRoot || (0, paths_1.getPossibleProjectRoot)();
    return getAbsolutePathWithProjectRoot(inputProjectRoot, ...pathComponents);
}
exports.getAbsolute = getAbsolute;
//# sourceMappingURL=paths.js.map