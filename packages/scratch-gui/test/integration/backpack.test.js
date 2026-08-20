import path from 'path';
import {By} from 'selenium-webdriver';
import SeleniumHelper from '../helpers/selenium-helper';

const {
    getDriver,
    getLogs,
    loadUri
} = new SeleniumHelper();

const uri = path.resolve(__dirname, '../../build/index.html');

let driver;

describe('Working with the how-to library', () => {
    beforeAll(() => {
        driver = getDriver();
    });

    afterAll(async () => {
        await driver.quit();
    });

    test('Backpack is hidden without backpack host param', async () => {
        await loadUri(uri);
        const backpackElements = await driver.findElements(By.xpath('//*[text()="Backpack"]'));
        await expect(backpackElements).toHaveLength(0);
        const logs = await getLogs();
        await expect(logs).toEqual([]);
    });
});
