// des-project\src\SimulationEngine.js

"use strict";

const EventQueue = require('./EventQueue');

class SimulationEngine {
    constructor(config, zeroTimeArrival = true) {
        this.config = config;
        this.zeroTimeArrival = zeroTimeArrival;
        this.log = [];
        this.eventQueue = new EventQueue();
        this.currentTime = 0;
        this.customerCounter = 1;
        this.customers = {};
        this.waitingQueue = [];
        this.resources = {};

        this.initializeResources();

        this.statistics = {
            totalTime: 0,
            totalCost: 0,
            customersServed: 0,
            lastDepartureTime: 0,
            totalWaitTime: 0,
        };
        
        this.processMap = new Map();

        this.config.processes.forEach((p, index) => {
            this.processMap.set(p.name, { ...p, index });
        });
    }

    initializeResources() {
        this.config.resources.forEach(res => {
            this.resources[res.name] = {
                count: res.count,
                available: res.count,
                busyTime: 0,
                idleTime: 0,
                lastUpdateTime: 0
            };
        });
    }

    /**
     * @param {number} time
     * @returns {string}
     */
    formatTime(time) {
        const roundedTime = Math.round(time * 100) / 100;

        if (roundedTime === Math.floor(roundedTime)) {
            return roundedTime.toString();
        } else {
            return roundedTime.toFixed(2);
        }
    }

    run() {
        const firstArrivalDelta = this.zeroTimeArrival ? 0 : (this.config.arrivalInterval || 3);
        const firstArrivalTime = this.currentTime + firstArrivalDelta;

        this.log.push(`[T=${this.formatTime(this.currentTime)}] (시뮬레이션 초기화)`);

        this.scheduleEvent(firstArrivalTime, 'ARRIVAL', { customerId: this.customerCounter });

        this.customerCounter++;

        while (!this.eventQueue.isEmpty()) {
            const nextEvent = this.eventQueue.dequeue();
            
            if (this.statistics.customersServed >= this.config.customerCount &&
                this.eventQueue.isEmpty()) {
                break;
            }

            this.updateResourceStats(nextEvent.time);

            this.currentTime = nextEvent.time;
            
            this.handleEvent(nextEvent);

            this.checkQueues();
            
            if (this.currentTime > 5000) {
                this.log.push(`[T=${this.formatTime(this.currentTime)}] ERROR: 시뮬레이션 시간이 5000분을 초과하여 강제 중단됩니다.`);
                
                break;
            }
        }
        
        return this.generateReport();
    }

    scheduleEvent(time, type, details = {}) {
        const event = { 
            time: time, 
            type: type, 
            details: { ...details } 
        };

        this.eventQueue.enqueue(event);
    }

    handleEvent(event) { 
        const { type, time, details } = event;

        const customerId = details.customerId;
        
        switch (type) { 
            case 'ARRIVAL':
                this.handleArrival(customerId, time);

                break;
            case 'PROCESS_COMPLETE':
                const completedIndex = details.processIndex;

                if (completedIndex === undefined) { 
                    this.log.push(`[T=${this.formatTime(this.currentTime)}] FATAL_ERROR: Customer ${customerId}의 프로세스 완료 이벤트에 인덱스가 누락되었습니다. 이벤트 중단.`);

                    return;
                }

                this.handleProcessComplete(customerId, completedIndex, time);

                break;
            case 'DEPARTURE':
                this.handleDeparture(customerId, time);

                break;
        }
    }

    handleArrival(customerId, time) { 
        this.customers[customerId] = {
            id: customerId,
            arrivalTime: time,
            waitStartTime: time,
            waitTime: 0,
            currentProcessIndex: 0,
            isProcessing: false
        };
        this.log.push(`[T=${this.formatTime(time)}] 손님 ${customerId} 도착`);

        if (this.customerCounter <= this.config.customerCount) {
              const nextArrivalTime = time + this.config.arrivalInterval;

              this.scheduleEvent(nextArrivalTime, 'ARRIVAL', { customerId: this.customerCounter });

              this.customerCounter++;
        }
    }
    
    handleProcessComplete(customerId, completedProcessIndex, time) {
        const customer = this.customers[customerId];

        if (!customer) {
            return;
        }

        const processInfo = this.config.processes[completedProcessIndex]; 

        if (processInfo.requires) {
            const resName = processInfo.requires;

            this.resources[resName].available++;
        }

        this.statistics.totalCost += processInfo.cost;

        const nextProcessIndex = completedProcessIndex + 1;

        customer.currentProcessIndex = nextProcessIndex; 

        customer.isProcessing = false;
        
        const nextProcessInfo = this.config.processes[nextProcessIndex];

        let logMessage = `
            [T=${this.formatTime(time)}] 손님 ${customerId}, '${processInfo.name}' 완료.
        `;
        
        if (nextProcessInfo) { 
            customer.waitStartTime = time;
            
            if (nextProcessInfo.requires) {
                this.waitingQueue.push(customer.id);

                logMessage += ` '${nextProcessInfo.name}' 대기 시작 (자원: ${nextProcessInfo.requires})`;
            } else {
                logMessage += ` 다음 프로세스 '${nextProcessInfo.name}' 준비.`;
            }
        } else {
            this.scheduleEvent(time, 'DEPARTURE', { customerId: customerId });

            logMessage += ` 모든 프로세스 완료. 퇴장 예정.`;
        }
        
        this.log.push(logMessage);
    }
    
    handleDeparture(customerId, time) {
        const customer = this.customers[customerId];

        if (!customer) {
            return;
        }

        this.statistics.customersServed++;

        this.statistics.lastDepartureTime = time;

        this.log.push(`[T=${this.formatTime(time)}] 손님 ${customerId} 퇴장. 총 소요 시간: ${this.formatTime(time - customer.arrivalTime)}분.`);
        
        delete this.customers[customerId];
    }
    
    checkQueues() {
        for (const custId in this.customers) {
            const customer = this.customers[custId];

            const processIndex = customer.currentProcessIndex;

            const processInfo = this.config.processes[processIndex]; 

            if (!customer.isProcessing && processInfo && !processInfo.requires) {
                customer.waitTime += this.currentTime - customer.waitStartTime;

                this.statistics.totalWaitTime += (this.currentTime - customer.waitStartTime);

                this.scheduleEvent(
                    this.currentTime + processInfo.duration,
                    'PROCESS_COMPLETE',
                    { customerId: customer.id, processIndex: processIndex } 
                );

                this.log.push(`[T=${this.formatTime(this.currentTime)}] 손님 ${customer.id}, '${processInfo.name}' 시작 (${this.formatTime(processInfo.duration)}분 소요)`); 
                
                customer.isProcessing = true; 
            }
        }
        
        for (let processIndexToStart = 1; processIndexToStart < this.config.processes.length; processIndexToStart++) {
            const processInfo = this.config.processes[processIndexToStart];
            
            if (!processInfo || !processInfo.requires) {
                continue;
            }

            const resName = processInfo.requires;

            const resource = this.resources[resName];

            while (resource.available > 0 && this.waitingQueue.length > 0) {
                let customerIndexInQueue = -1;

                let customerIdToStart = null;
                
                for(let i = 0; i < this.waitingQueue.length; i++) {
                    const custId = this.waitingQueue[i];

                    if (this.customers[custId] &&
                        this.customers[custId].currentProcessIndex === processIndexToStart) {
                        customerIndexInQueue = i;

                        customerIdToStart = custId;

                        break;
                    }
                }

                if (customerIndexInQueue !== -1) {
                    this.waitingQueue.splice(customerIndexInQueue, 1);

                    const customer = this.customers[customerIdToStart];

                    resource.available--;
                    
                    customer.waitTime += this.currentTime - customer.waitStartTime;

                    this.statistics.totalWaitTime += (this.currentTime - customer.waitStartTime);

                    this.scheduleEvent(
                        this.currentTime + processInfo.duration,
                        'PROCESS_COMPLETE',
                        { customerId: customerIdToStart, processIndex: processIndexToStart }
                    );
                    
                    this.log.push(`[T=${this.formatTime(this.currentTime)}] ${resName}가 손님 ${customerIdToStart}의 '${processInfo.name}' 시작 (${this.formatTime(processInfo.duration)}분 소요)`);

                    customer.isProcessing = true;

                } else {
                    break;
                }
            }
        }
    }

    updateResourceStats(newTime) {
        const delta = newTime - this.currentTime;

        if (delta <= 0) {
            return;
        }
        
        for (const name in this.resources) {
            if (!this.resources.hasOwnProperty(name)) {
                continue;
            }

            const res = this.resources[name];
            
            if (res.available < res.count) {
                res.busyTime += (res.count - res.available) * delta;
            } else {
                res.idleTime += res.available * delta;
            }

            res.lastUpdateTime = newTime;
        }
    }
    
    generateReport() {
        this.statistics.totalTime = this.statistics.lastDepartureTime;
            
        const firstResourceName = this.config.resources[0]?.name;

        const baristaStats = this.resources[firstResourceName];

        let avgWaitTime;

        let utilization = 0;

        if (this.statistics.customersServed > 0) {
            avgWaitTime = this.statistics.totalWaitTime / this.statistics.customersServed;
        } else {
            avgWaitTime = 0;
        }
        
        if (baristaStats && this.statistics.totalTime > 0) {
            utilization = (baristaStats.busyTime / (baristaStats.count * this.statistics.totalTime)) * 100;
        }

        return {
            log: [...this.log],
            summary: {
                totalTime: this.statistics.totalTime.toFixed(2),
                totalCost: this.statistics.totalCost.toFixed(2),
                customersServed: this.statistics.customersServed,
                averageWaitTime: avgWaitTime.toFixed(2),
                baristaUtilization: utilization.toFixed(2) + '%'
            }
        };
    }
}

module.exports = SimulationEngine;