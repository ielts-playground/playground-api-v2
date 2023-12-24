/// <reference path="../types/pocketbase.d.ts" />

routerAdd(
    'GET',
    '/api/v1/random/:skill',
    (c) => {
        const skill = c.pathParam('skill');
        const id = c.queryParam('id');
        const v1 = c.get('v1') as VerOneRequest;
        const { statusCode, json } = $http.send({
            url: `${v1?.baseUrl}/test/random?skill=${skill}&id=${id}`,
            headers: v1?.headers,
        });
        return c.json(statusCode, json);
    },
    $apis.requireRecordAuth(),
);

routerAdd(
    'PUT',
    '/api/v1/exam/:submitId/submit',
    (c) => {
        const submitId = parseInt(c.pathParam('submitId'));
        const v1 = c.get('v1') as VerOneRequest;
        const { statusCode, json } = $http.send({
            method: 'PUT',
            url: `${v1?.baseUrl}/exam/submit`,
            headers: v1?.headers,
            body: JSON.stringify({
                ...$apis.requestInfo(c).data,
                submitId,
            }),
        });
        return c.json(statusCode, json);
    },
    $apis.requireRecordAuth(),
);

routerAdd('POST', '/api/v1/internal/register', (c) => {
    const user = $apis.requestInfo(c).data as User;
    const v1 = c.get('v1') as VerOneRequest;
    const { statusCode, json } = $http.send({
        method: 'POST',
        url: `${v1?.baseUrl}/register`,
        headers: v1?.headers,
        body: JSON.stringify({
            username: user.username,
            password: user.password,
            email: user.email,
            phoneNumber: user.phoneNumber,
            subscription: user.subscription,
            firstName: user.fullName,
            lastName: '[v2]',
            activated: user.activated,
        }),
    });
    return c.json(statusCode, json);
});

routerAdd('POST', '/api/v1/internal/update-user', (c) => {
    const user = $apis.requestInfo(c).data as User;
    const v1 = c.get('v1') as VerOneRequest;
    const { statusCode, json } = $http.send({
        method: 'PATCH',
        url: `${v1?.baseUrl}/users`,
        headers: v1?.headers,
        body: JSON.stringify({
            username: user.username,
            password: user.password,
            email: user.email,
            phoneNumber: user.phoneNumber,
            subscription: user.subscription,
            firstName: user.fullName,
            lastName: '[v2]',
            activated: user.activated,
        }),
    });
    return c.json(statusCode, json);
});