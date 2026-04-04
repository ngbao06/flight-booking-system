import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
            const routes = await import(routePath);
            app.use(`/api/${moduleName}`, routes.default);
        }
    }
};

export default loadModules;