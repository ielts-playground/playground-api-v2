/// <reference path="../types/pocketbase.d.ts" />

/**
 * This middleware will accept only the requests from this host
 * to the paths starting with `/api/v2/internal/`.
 *
 * @group v2
 */
function internalRequestGuard(next: echo.HandlerFunc): echo.HandlerFunc {
    return (c) => {
        const request = c.request();
        const isInternalRequest =
            request.url?.path?.startsWith('/api/v2/internal/');
        const isNotFromThisHost = !/^127\.0\.0\.1(:\d+)?$/.test(
            request.remoteAddr,
        );
        if (isInternalRequest && isNotFromThisHost) {
            throw new UnauthorizedError(
                'This resource can be accessed only from internal services.',
            );
        }
        next(c);
    };
}

/**
 * This middleware will accept only the requests with Admin-authenticated
 * token to the paths starting with `/api/v2/admin/`.
 *
 * @group v2
 */
function adminRequestGuard(next: echo.HandlerFunc): echo.HandlerFunc {
    return (c) => {
        const request = c.request();
        const isAdminRequest = request.url?.path?.startsWith('/api/v2/admin/');
        const isNotAdmin = !$apis.requestInfo(c).admin;
        if (isAdminRequest && isNotAdmin) {
            throw new UnauthorizedError(
                'Only administrators can access this resource.',
            );
        }
        next(c);
    };
}

/**
 * Sets context for `v1` requests.
 */
function verOneRequestMiddleware(next: echo.HandlerFunc): echo.HandlerFunc {
    return (c) => {
        const request = c.request();
        const isVersionOne = request.url?.path?.startsWith('/api/v1/');
        if (isVersionOne) {
            const user = $apis.requestInfo(c).authRecord;
            const isInternalRequest =
                request.url?.path?.startsWith('/api/v1/internal/');
            const isNotFromThisHost = !/^127\.0\.0\.1(:\d+)?$/.test(
                request.remoteAddr,
            );
            const userUnauthorized = !user && !isInternalRequest;
            const internalUnauthorized = isInternalRequest && isNotFromThisHost;
            if (userUnauthorized || internalUnauthorized) {
                throw new UnauthorizedError(
                    'Only authorized users can access this resource.',
                );
            }
            c.set('v1', {
                baseUrl: `${process.env.V1_SERVICE}/private`,
                headers: {
                    'Content-Type':
                        $apis.requestInfo(c).headers['Content-Type'] ||
                        'application/json',
                    'X-Api-Key': process.env.PRIVATE_KEY_V2_CLIENT,
                    'X-Forwarded-For-User': user
                        ? user.username()
                        : $apis.requestInfo(c).headers['X-Forwarded-For-User'],
                },
            } as VerOneRequest);
        }
        next(c);
    };
}

routerUse($apis.activityLogger($app));
routerUse(adminRequestGuard);
routerUse(internalRequestGuard);
routerUse(verOneRequestMiddleware);
