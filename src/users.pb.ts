/// <reference path="../types/pocketbase.d.ts" />

routerAdd('POST', '/api/v2/users/request-verify-email', (c) => {
    const { email } = $apis.requestInfo(c).data as {
        email: string;
    };
    try {
        const user = $app.dao().findAuthRecordByEmail('users', email);
        if (user.verified()) {
            return c.json(400, {
                code: 'email_already_verified',
                message: 'Email has been already verified.',
            });
        }
        const code = $security.randomStringWithAlphabet(6, '0123456789');
        $app.dao().saveRecord(
            new Record($app.dao().findCollectionByNameOrId('codes'), {
                email: email,
                code,
                type: 'VERIFY_EMAIL',
            }),
        );
        $http.send({
            method: 'POST',
            url: 'http://localhost:8090/api/v2/internal/mail/send',
            body: JSON.stringify({
                email: email,
                subject: 'Verify your email',
                template: 'verify-email',
                data: {
                    code,
                },
            }),
        });
        return c.json(200, {
            code: 'succeeded',
            message: 'Verification mail has been sent successfully.',
        });
    } catch {
        return c.json(400, {
            code: 'verification_request_failed',
            message: 'Verification request could not be processed.',
        });
    }
});

routerAdd('POST', '/api/v2/users/register', (c) => {
    const data = $apis.requestInfo(c).data as User;
    const user = new Record($app.dao().findCollectionByNameOrId('users'));
    const form = new RecordUpsertForm($app, user);
    data.activated = data.subscription === 'FREE';
    form.loadData(data);
    form.submit();
    const saved = $app.dao().findAuthRecordByEmail('users', form.email);
    let succeeded = false;
    try {
        const { statusCode, json } = $http.send({
            method: 'POST',
            url: 'http://localhost:8090/api/v1/internal/register', // internal call
            body: JSON.stringify({
                ...data,
                username: saved.username(),
            }),
        });
        if (statusCode >= 400) {
            return c.json(500, {
                code: 'v1_registration_failed',
                message: 'Something went wrong.',
                data: {
                    v1: json,
                },
            });
        }
        succeeded = true;
        return c.json(201, {
            code: 'succeeded',
            message: 'Registered successfully.',
            data: {
                email: form.email,
                v1: json,
            },
        });
    } finally {
        if (succeeded) {
            $http.send({
                method: 'POST',
                url: 'http://localhost:8090/api/v2/users/request-verify-email', // internal call
                body: JSON.stringify({
                    email: form.email,
                }),
            });
        } else {
            $app.dao().deleteRecord(saved);
        }
    }
});

routerAdd('POST', '/api/v2/users/verify-email', (c) => {
    const { email, code } = $apis.requestInfo(c).data as {
        email: string;
        code: string;
    };
    let verified = false;
    try {
        const user = $app.dao().findAuthRecordByEmail('users', email);
        if (user.verified()) {
            return c.json(400, {
                code: 'email_already_verified',
                message: 'Email has been already verified.',
            });
        }
        const record = new Record();
        $app.dao()
            .recordQuery('codes')
            .andWhere(
                $dbx.hashExp({
                    email,
                    code,
                    type: 'VERIFY_EMAIL',
                }),
            )
            .orderBy('created DESC')
            .one(record);
        const expiration = record.created.time().unix() + 5 * 60; // after 5 minutes
        const now = new DateTime().time().unix();
        if (expiration < now) throw new Error();
        const { statusCode, json } = $http.send({
            method: 'POST',
            url: 'http://localhost:8090/api/v1/internal/update-user', // internal call
            body: JSON.stringify({
                username: user.username(),
                activated: true,
            }),
        });
        if (statusCode >= 400) {
            return c.json(500, {
                code: 'v1_activation_failed',
                message: 'Something went wrong.',
                data: {
                    v1: json,
                },
            });
        }
        user.setVerified(true);
        $app.dao().saveRecord(user);
        verified = true;
        return c.json(200, {
            code: 'succeeded',
            message: 'Verified successfully.',
            data: {
                user,
                token: $tokens.recordAuthToken($app, user),
                v1: json,
            },
        });
    } catch {
        return c.json(400, {
            code: 'verification_failed',
            message: 'Provided email or code is invalid.',
        });
    } finally {
        if (verified) {
            $http.send({
                method: 'POST',
                url: 'http://localhost:8090/api/v2/internal/mail/send',
                body: JSON.stringify({
                    email,
                    template: 'verify-email-successfully',
                    subject: 'Your have verified your email',
                }),
            });
        }
    }
});

routerAdd('POST', '/api/v2/users/authenticate', (c) => {
    try {
        const { email, password } = $apis.requestInfo(c).data as {
            email: string;
            password: string;
        };
        const user = $app.dao().findAuthRecordByEmail('users', email);
        if (user.validatePassword(password)) {
            return c.json(200, {
                code: 'succeeded',
                message: 'Authenticated successfully.',
                data: {
                    user,
                    token: $tokens.recordAuthToken($app, user),
                },
            });
        }
    } catch {}
    return c.json(401, {
        code: 'authentication_failed',
        message: 'Provided email or password is incorrect.',
    });
});
