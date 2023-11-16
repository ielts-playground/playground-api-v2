/// <reference path="../types/pocketbase.d.ts" />

routerAdd('POST', '/api/v2/users/register', (c) => {
    const data = $apis.requestInfo(c).data;
    const collection = $app.dao().findCollectionByNameOrId('users');
    const record = new Record(collection);
    const form = new RecordUpsertForm($app, record);
    form.loadData(data);
    form.submit();
    return c.json(201, {
        code: 'succeeded',
        message: 'Registered successfully.',
    });
});
