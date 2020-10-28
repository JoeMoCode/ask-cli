const fs = require('fs');
const inquirer = require('inquirer');
const path = require('path');

const Messenger = require('@src/view/messenger');

module.exports = {
    selectLocales,
    showSourcesForEachLocale
};

function selectLocales(localeChoices, callback) {
    inquirer.prompt([{
        message: 'Please select at least one locale to add:',
        type: 'checkbox',
        name: 'localeList',
        choices: localeChoices
    }]).then((answer) => {
        callback(null, answer.localeList);
    }).catch((error) => {
        callback(error);
    });
}

/**
 * Display the result of locales addition
 * @param {Map} iModelSourceByLocales Map { locale: filePath/remoteURI }
 */
function showSourcesForEachLocale(iModelSourceByLocales) {
    Messenger.getInstance().info('The following skill locale(s) have been added according to your local project:');
    iModelSourceByLocales.forEach((v, k) => {
        if (fs.existsSync(v)) {
            const sourceLocale = path.basename(v, path.extname(v));
            Messenger.getInstance().info(`  Added locale ${k}.json from ${sourceLocale}'s interactionModel`);
        } else {
            Messenger.getInstance().info(`  Added locale ${k}.json from the template of interactionModel`);
        }
    });
    Messenger.getInstance().info('Please check the added files above, and run "ask deploy" to deploy the changes.');
}
