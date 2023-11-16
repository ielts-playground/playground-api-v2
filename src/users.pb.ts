/// <reference path="../types/pocketbase.d.ts" />

routerAdd(
    'POST',
    '/api/v2/users/send-verification-mail',
    (c) => {
        const { email: userEmail } = $apis.requestInfo(c).data;
        const verification = new Record();
        $app.dao()
            .recordQuery('codes')
            .select('code')
            .where(
                $dbx.hashExp({
                    email: userEmail,
                    type: 'VERIFY_EMAIL',
                }),
            )
            .orderBy('created DESC')
            .one(verification);
        const senderAddress = $app.settings().meta.senderAddress;
        const senderName = $app.settings().meta.senderName;
        const subject = `Verify your email`;
        const html = $template
            .loadFiles(`${__hooks}/views/verify-email.html`)
            .render({
                code: verification.get('code'),
            });
        const address = (email: string, name: string = '') => ({
            address: email,
            name,
            string: () => email,
        });
        $app.newMailClient().send({
            from: address(senderAddress, senderName),
            to: [address(userEmail)],
            subject,
            html,
            bcc: [],
            cc: [],
            text: '',
            headers: {},
            attachments: {},
        });
        return c.json(200, {});
    },
    $apis.activityLogger($app),
);

routerAdd('POST', '/api/v2/users/register', (c) => {
    const data = $apis.requestInfo(c).data;
    const user = new Record($app.dao().findCollectionByNameOrId('users'));
    const form = new RecordUpsertForm($app, user);
    form.loadData(data);
    form.submit();
    const code = $security.randomStringWithAlphabet(6, '0123456789');
    $app.dao().saveRecord(
        new Record($app.dao().findCollectionByNameOrId('codes'), {
            email: form.email,
            code,
            type: 'VERIFY_EMAIL',
        }),
    );
    try {
        return c.json(201, {
            code: 'succeeded',
            message: 'Registered successfully.',
        });
    } finally {
        if (form.email) {
            $http.send({
                method: 'POST',
                url: 'http://localhost:8090/api/v2/users/send-verification-mail', // internal call
                body: JSON.stringify({
                    email: form.email,
                }),
            });
        }
    }
});

routerAdd(
    'POST',
    '/api/v2/users/verify',
    (c) => {
        const { email, code } = $apis.requestInfo(c).data;
        let user: models.Record | undefined = undefined;
        try {
            const record = new Record();
            $app.dao()
                .recordQuery('codes')
                .andWhere(
                    $dbx.hashExp({
                        email,
                        code,
                    }),
                )
                .orderBy('created DESC')
                .one(record);
            const expiration = record.created.time().unix() + 5 * 60; // after 5 minutes
            const now = new DateTime().time().unix();
            if (expiration < now) throw new Error();
            user = $app.dao().findAuthRecordByEmail('users', email);
            user.setVerified(true);
            $app.dao().saveRecord(user);
            return c.json(200, {
                code: 'succeeded',
                message: 'Verified successfully.',
            });
        } catch {
            return c.json(400, {
                code: 'verification_failed',
                message: 'Email incorrect or Code expired.',
            });
        } finally {
            if (!user) return;
            const senderAddress = $app.settings().meta.senderAddress;
            const senderName = $app.settings().meta.senderName;
            const subject = `Your email has been verified`;
            const html = $template
                .loadFiles(`${__hooks}/views/verify-email-successfully.html`)
                .render({});
            const address = (email: string, name: string = '') => ({
                address: email,
                name,
                string: () => email,
            });
            $app.newMailClient().send({
                from: address(senderAddress, senderName),
                to: [address(email)],
                subject,
                html,
                bcc: [],
                cc: [],
                text: '',
                headers: {},
                attachments: {},
            });
        }
    },
    $apis.activityLogger($app),
);
