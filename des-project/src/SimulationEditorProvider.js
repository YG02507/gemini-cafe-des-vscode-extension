// des-project\src\SimulationEditorProvider.js

"use strict";

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const vscode = require('vscode');
const SimulationEngine = require('./SimulationEngine');

class SimulationEditorProvider {
    /**
     * @param {vscode.ExtensionContext} context 
     */
    constructor(context) {
        this.context = context;
    }

    resolveCustomTextEditor(document, webviewPanel, _token) {
        webviewPanel.webview.options = {
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'webview'))]
        };

        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview, document); 

        webviewPanel.webview.onDidReceiveMessage(message => { 
            if (message.command === 'runSimulation') {
                const zeroTimeArrival = message.data ? message.data.zeroTimeArrival : true;

                this.runSimulation(document, webviewPanel, zeroTimeArrival);
            }
        });

        try {
            const config = this.parseSimulationConfig(document);

            webviewPanel.webview.postMessage({
                command: 'initialConfig',
                data: {
                    title: config.title
                }
            });
        } catch (e) {
            vscode.window.showErrorMessage(`Error reading configuration file: ${e.message}`);
        }
    }

    getHtmlForWebview(webview, document) {
        const htmlPath = path.join(this.context.extensionPath, 'webview', 'index.html');

        const scriptUri = webview.asWebviewUri(vscode.Uri.file( 
            path.join(this.context.extensionPath, 'webview', 'webview.js')
        ));

        const styleUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'webview', 'style.css')
        ));
        
        let htmlContent = fs.readFileSync(htmlPath, 'utf8');

        let finalHtml = htmlContent.replace('${scriptUri}', scriptUri.toString());

        return finalHtml.replace('${styleUri}', styleUri.toString());
    }

    parseSimulationConfig(document) {
        const code = document.getText();

        const sandbox = {
            simulationConfig: undefined,
            module: {
                exports: {}
            }
        }; 

        try {
            vm.runInNewContext(code, sandbox, { 
                filename: document.uri.fsPath,
                timeout: 500
            });
        } catch (e) {
            throw new Error(`Error executing simulation config: ${e.message}`);
        }

        if (sandbox.simulationConfig) {
             return sandbox.simulationConfig;
        } 
        
        if (typeof sandbox.module.exports === 'object' && sandbox.module.exports !== null) {
             if (sandbox.module.exports.simulationConfig) {
                 return sandbox.module.exports.simulationConfig;
             }

             return sandbox.module.exports;
        }

        throw new Error("Simulation configuration object 'simulationConfig' not found in .des.js file."); 
    }

    runSimulation(document, webviewPanel, zeroTimeArrival) {
        try {
            const config = this.parseSimulationConfig(document);
            
            const engine = new SimulationEngine(config, zeroTimeArrival);

            const realResult = engine.run();

            webviewPanel.webview.postMessage({
                command: 'simulationResult',
                data: realResult
            });

        } catch (e) {
            const errorMessage = `Simulation failed: ${e.message}. Check your .des.js file format.`;
            
            webviewPanel.webview.postMessage({
                command: 'simulationError',
                message: errorMessage
            });
            
            vscode.window.showErrorMessage(errorMessage);
        }
    }
}

module.exports = SimulationEditorProvider;