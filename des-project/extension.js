// des-project\extension.js

"use strict";

const vscode = require('vscode');
const SimulationEditorProvider = require('./src/SimulationEditorProvider');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    console.log('DES EXTENSION ACTIVATED!');

    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            'des.simulationViewer',
            new SimulationEditorProvider(context),
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                },
                supportsMultipleEditorsPerDocument: false
            }
        )
    );
}

function deactivate() {
}

module.exports = {
    activate,
    deactivate
};