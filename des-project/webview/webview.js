// des-project\webview\webview.js

"use strict";

const vscode = acquireVsCodeApi();

const runButton = document.getElementById('runButton');
const summaryArea = document.getElementById('summary');
const logOutput = document.getElementById('output');
const simulationTitle = document.getElementById('simulationTitle');
const zeroTimeArrivalCheck = document.getElementById('zeroTimeArrivalCheck');

runButton.addEventListener('click', () => {
    runButton.disabled = true;

    summaryArea.innerHTML = `
        <p style="color: blue;">시뮬레이션 실행 중... (시간이 다소 소요될 수 있음)</p>
    `;

    logOutput.innerHTML = `
        <div class="log-entry">시뮬레이션을 요청했습니다.</div>
    `;

    vscode.postMessage(
        {
            command: 'runSimulation',
            data: {
                zeroTimeArrival: zeroTimeArrivalCheck.checked
            }
        }
    )
});

window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'initialConfig':
            if (message.data && message.data.title) {
                simulationTitle.textContent = message.data.title;
            }

            break;
        case 'simulationResult':
            runButton.disabled = false;

            displayResult(message.data);

            break;
        case 'simulationError':
            runButton.disabled = false;

            displayError(message.message);

            break;
    }
});

function displayResult(result) {
    summaryArea.innerHTML = `
        <p style="color: green;">
            [O] 시뮬레이션 완료! (총 ${result.summary.customersServed}명 서비스)
        </p>
        <p>총 시뮬레이션 소요 시간: ${result.summary.totalTime}분</p>
        <p>총 운영 비용: ${result.summary.totalCost}원</p>
    `;

    logOutput.innerHTML = result.log.map(entry => `
        <div class="log-entry">${entry}</div>
    `).join('');
}

function displayError(errorMessage) {
    summaryArea.innerHTML = `
        <p style="color: red;">
            [X] 시뮬레이션 오류 발생: ${errorMessage}
        </p>
    `;
    logOutput.innerHTML = ``;
}