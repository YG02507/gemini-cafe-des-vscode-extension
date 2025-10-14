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