const fs = require('fs');
const path = require('path');

module.exports = (app) => {
    const modulesPath = __dirname;

    fs.readdirSync(modulesPath).forEach((moduleName) => {
        const routePath = path.join(modulesPath, moduleName, `${moduleName}.routes.js`);
        if (fs.existsSync(routePath)) {
            const routes = require(routePath);
            app.use(`/api/${moduleName}`, routes);
        }
    });
};