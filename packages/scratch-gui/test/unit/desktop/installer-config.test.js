const fs = require('fs');
const path = require('path');

const installer = fs.readFileSync(path.resolve(__dirname, '../../../desktop/installer.iss'), 'utf8');

describe('Windows installer', () => {
    test('installs on double-click without wizard choices', () => {
        expect(installer).toMatch(/^DisableDirPage=yes$/m);
        expect(installer).toMatch(/^DisableReadyPage=yes$/m);
        expect(installer).toMatch(/^DisableFinishedPage=yes$/m);
        expect(installer).not.toMatch(/^PrivilegesRequiredOverridesAllowed=dialog$/m);
        expect(installer).not.toMatch(/^\[Tasks\]$/m);
        expect(installer).not.toMatch(/Flags:.*postinstall/);
    });
});
