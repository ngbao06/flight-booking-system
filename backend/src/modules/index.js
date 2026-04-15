import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url'; // 1. Thêm pathToFileURL ở đây

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadModules = async (app) => {
    const modulesPath = __dirname;
    const modules = fs.readdirSync(modulesPath);

    for (const moduleName of modules) {
        const routePath = path.join(
            modulesPath,
            moduleName,
            `${moduleName}.routes.js`
        );

        if (fs.existsSync(routePath)) {
            const routeUrl = pathToFileURL(routePath).href;
            const routes = await import(routeUrl);

            // KIỂM TRA TẠI ĐÂY:
            if (routes.default && typeof routes.default === 'function') {
                app.use(`/api/${moduleName}`, routes.default);
                console.log(`✅ Loaded routes for module: ${moduleName}`);
            } else {
                console.warn(`⚠️  Module ${moduleName} is missing a default export in its routes file.`);
                continue;
            }
        }
    }
};

export default loadModules;