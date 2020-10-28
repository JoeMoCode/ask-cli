const { expect } = require('chai');
const inquirer = require('inquirer');
const sinon = require('sinon');
const fs = require('fs');

const Messenger = require('@src/view/messenger');

const ui = require('@src/commands/skill/add-locales/ui');

function validateInquirerConfig(stub, expectedConfig) {
    const { message, type, choices } = expectedConfig;
    expect(stub.message).equal(message);
    expect(stub.type).equal(type);
    if (choices) {
        expect(stub.choices).deep.equal(choices);
    }
}

describe('Commands add-locales - UI test', () => {
    describe('# validate method selectLocales', () => {
        const TEST_LOCALES = ['1', '2', '3'];
        const TEST_SELECTED_LOCALES = ['1'];
        const TEST_ERROR = 'error';

        beforeEach(() => {
            sinon.stub(inquirer, 'prompt');
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| select locales with error throw, expect error called back', (done) => {
            // setup
            inquirer.prompt.rejects(TEST_ERROR);
            // call
            ui.selectLocales(TEST_LOCALES, (err, results) => {
                // verify
                validateInquirerConfig(inquirer.prompt.args[0][0][0], {
                    message: 'Please select at least one locale to add:',
                    type: 'checkbox',
                    choices: TEST_LOCALES
                });
                expect(results).equal(undefined);
                expect(err.name).equal(TEST_ERROR);
                done();
            });
        });

        it('| select locales successfully, expect result list called back', (done) => {
            // setup
            inquirer.prompt.resolves({ localeList: TEST_SELECTED_LOCALES });
            // call
            ui.selectLocales(TEST_LOCALES, (err, results) => {
                // verify
                expect(err).equal(null);
                expect(results).deep.equal(TEST_SELECTED_LOCALES);
                done();
            });
        });
    });

    describe('# validate method showSourcesForEachLocale', () => {
        new Messenger({});
        let infoStub;
        const TEST_MAP = new Map([
            ['1', 'file1.json'],
            ['2', 'file2.json'],
            ['3', 'file3.json']
        ]);

        beforeEach(() => {
            infoStub = sinon.stub();
            sinon.stub(Messenger, 'getInstance').returns({
                info: infoStub
            });
        });

        afterEach(() => {
            sinon.restore();
        });

        it('| display info message as expected', () => {
            // setup
            sinon.stub(fs, 'existsSync');
            fs.existsSync.withArgs('file1.json').returns(true);
            fs.existsSync.withArgs('file2.json').returns(false);
            fs.existsSync.withArgs('file3.json').returns(true);
            // call
            ui.showSourcesForEachLocale(TEST_MAP);
            // verify
            expect(infoStub.args[0][0]).equal('The following skill locale(s) have been added according to your local project:');
            expect(infoStub.args[1][0]).equal('  Added locale 1.json from file1\'s interactionModel');
            expect(infoStub.args[2][0]).equal('  Added locale 2.json from the template of interactionModel');
            expect(infoStub.args[3][0]).equal('  Added locale 3.json from file3\'s interactionModel');
            expect(infoStub.args[4][0]).equal('Please check the added files above, and run "ask deploy" to deploy the changes.');
        });
    });
});
