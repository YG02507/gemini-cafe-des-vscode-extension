# gemini-cafe-des-vscode-extension
A Visual Studio Code Extension for Discrete Event Simulation(DES) Analysis, Modeling Gemini Cafe System.

## 1. 개요 및 목표 (Overview & Goal)

본 프로젝트는 `VS Code` 확장 프로그램 형태로 이산 사건 시뮬레이션(Discrete Event Simulation, DES) 환경을 제공하여 시스템 공학적 개념 설계 및 운영 효율성을 분석하는 도구입니다.

사용자는 특정 포맷의 `JavaScript` 파일(`.des.js`)을 입력받아, 그 내용을 기반으로 시뮬레이션을 수행하고 결과를 시각적으로 `Webview UI`에 보여줍니다. 핵심 목표는 자원 경쟁(Resource Contention) 및 대기열(Queueing) 시스템을 모델링하고, 총 소요 시간과 총 운영 비용을 포함한 주요 성능 지표를 정확하게 도출하는 것입니다.

***

## 2. 핵심 아키텍처 및 기술적 특징 (Architecture & Features)

### 2.1. DES 엔진 로직 및 모델 특성

#### 시간 진행 방식 (Time Advance Mechanism)
본 `DES` 엔진은 다음 이벤트 방식(Next-Event Time Advance)을 채택합니다.
* `currentTime`을 다음 이벤트 시간으로 즉시 업데이트(`Time Jump`)합니다.
* 이벤트 간의 시간 차이($\Delta T$) 동안 모든 자원의 유휴 시간(Idle Time) 및 사용 시간(Busy Time) 통계를 누적 계산합니다.
* 이벤트 처리는 도착(`ARRIVAL`) → 프로세스 완료(`PROCESS_COMPLETE`) → 퇴장(`DEPARTURE`)의 순환 구조를 따르며, 이벤트 발생 시 `checkQueues()`를 호출하여 자원 재할당 기회를 부여합니다.

#### 자원 할당 및 대기열 로직 (Resource Allocation & Queue)
* 자원 상태 관리: 각 자원(`resources`)은 `count`, `available`, `busyTime`, `idleTime`을 포함하는 객체로 관리됩니다.
* 대기열 규칙: 자원이 부족할 경우, 고객은 FIFO(First In First Out) 방식의 `waitingQueue`에서 대기합니다.
* 대기열 해제: 프로세스가 완료되거나 이벤트 시간이 업데이트될 때마다 대기열을 순회하며, 필요한 자원이 가용해진 고객을 찾아 대기열에서 제거하고 즉시 프로세스를 시작합니다.

#### 결정론적 모델 및 확장성 (Determinism & Extensibility)
* 기본 모델: 현재 모델은 입력 파일의 모든 시간 파라미터를 고정된 상수로 처리하는 결정론적(Deterministic) 모델을 기본으로 하여, 수학적으로 검증 가능한 확정적 결과를 도출합니다.
* 확장성 설계: 향후 확률적 모델(Stochastic Model) 도입을 위해, 시뮬레이션 설정 파일 내에 `getArrivalInterval: () => number`와 같은 함수를 정의하여 분포 기반의 랜덤 시간 간격을 사용할 수 있도록 엔진 구조를 설계했습니다.

#### 안전 장치 (Safety Mechanism)
시나리오의 현실적인 운영 시간을 고려하여 최대 시뮬레이션 시간을 `5,000분`으로 설정했습니다. 이 제한은 무한 루프 등 비정상적인 실행 시 시스템 자원 보호를 위해 강제 종료하는 안전 장치입니다.

### 2.2. VS Code 확장 구조 및 통신

* `Custom Editor` 활용: `.des.js` 파일을 `Custom Editor`(`des.simulationViewer`)에 연결하여, 파일을 여는 즉시 `Webview UI`가 활성화되도록 구현했습니다.
* 보안 파싱: 시뮬레이션 설정 파일(`.des.js`) 파싱 시, `Node.js`의 `vm.runInNewContext` 모듈을 사용하여 외부 코드를 격리된 샌드박스 내에서만 실행합니다. 이는 호스트 시스템 접근을 차단하는 필수적인 보안 조치입니다.

***

## 3. 설치 및 실행 방법 (Installation & Usage)

본 확장 프로그램은 `VS Code Extension Development Host` 환경에서 실행됩니다.

### 3.1. 환경 준비

1. Node.js 설치: Node.js v20.x 또는 v22.x (LTS) 버전을 설치합니다.
2. VS Code 버전: Visual Studio Code v1.80.0 이상 버전을 사용니다.
3. 프로젝트 폴더 준비: `VS Code`를 실행하고 `des-project` 폴더를 작업 영역으로 엽니다.
4. 의존성 패키지 설치: 프로젝트 터미널에서 `npm install` 명령을 실행하여 개발 의존성 패키지를 설치합니다.

### 3.2. 확장 프로그램 실행 및 테스트

1. 디버그 뷰 진입: 왼쪽 사이드바에서 실행 및 디버그 뷰로 이동합니다.
2. 디버그 시작: 구성 드롭다운에서 `Run DES Extension`이 선택되었는지 확인하고, 시작 버튼을 클릭합니다.
3. 확장 호스트 창 활성화: 잠시 후 새로운 `VS Code` 창(`Extension Development Host`)이 열립니다.
4. 시뮬레이터 활성화 (`Webview` 테스트): 새로 열린 `Extension Development Host` 창에서 입력 파일인 `cafe_simulation.des.js`를 엽니다. 파일을 여는 즉시 시뮬레이션 뷰어 `Webview`가 표시됩니다.
5. 시뮬레이션 수행: `Webview` 내의 `시뮬레이션 시작` 버튼을 클릭하여 `DES` 엔진을 실행하고 최종 결과와 로그를 확인합니다.

***

## 4. 시뮬레이션 정의 파일 예시 (cafe\_simulation.des.js)

```javascript
// des-project\cafe_simulation.des.js

"use strict";

// 이 파일은 시뮬레이션 정의 파일입니다.
// 이 파일을 열면 VS Code 확장 프로그램이 활성화되어야 합니다.

const simulationConfig = {
  title: "Gemini 카페 운영 시뮬레이션",

  resources: [
    { name: "바리스타", count: 1 } 
  ],

  processes: [
    { name: "주문받기", duration: 2, cost: 10 },
    { name: "커피 제조", duration: 5, cost: 50, requires: "바리스타" }
  ],

  arrivalInterval: 3, // 3분 간격으로 손님 도착
  customerCount: 10   // 총 10명의 손님을 시뮬레이션
};

// 확장 프로그램은 이 'simulationConfig' 객체를 읽어서 사용해야 합니다.

// 별도로 실험한 '확장된 simulationConfig' 코드

// const simulationConfig = {
//     title: "Gemini 카페 운영 시뮬레이션 2",
    
//     resources: [
//         { name: '바리스타', count: 1 },
//         { name: '오븐', count: 1 }
//     ],

//     processes: [
//         { name: '주문받기', duration: 2, cost: 10, requires: null },
//         { name: '커피 제조', duration: 5, cost: 20, requires: '바리스타' },
//         { name: '디저트 제조', duration: 10, cost: 30, requires: '오븐' }
//     ],

//     arrivalInterval: 4.0,
//     customerCount: 10,
    
//     getArrivalInterval: () => {
//         const intervals = [3, 5, 4, 3, 5, 4, 3, 5, 4, 3];

//         if (simulationConfig._arrivalCounter === undefined) {
//           simulationConfig._arrivalCounter = 0;
//         }

//         return intervals[simulationConfig._arrivalCounter++];
//     }
// };

module.exports.simulationConfig = simulationConfig;