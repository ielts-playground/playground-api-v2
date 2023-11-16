/// <reference path="../types/pocketbase.d.ts" />

routerAdd('GET', '/api/hello/:name', (c) => {
    const name = c.pathParam('name');
    return c.json(200, {
        message: `hello ${name}`,
    });
});
