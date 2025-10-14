// des-project\src\EventQueue.js

"use strict";

class EventQueue {
    constructor() {
        this.heap = [null]; 
    }

    isEmpty() {
        return this.heap.length <= 1;
    }

    enqueue(event) {
        this.heap.push(event);

        this.heapifyUp();
    }

    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        if (this.heap.length === 2) {
            return this.heap.pop();
        }

        const minEvent = this.heap[1];

        this.heap[1] = this.heap.pop();

        this.heapifyDown();

        return minEvent;
    }

    heapifyUp() {
        let currentIndex = this.heap.length - 1;

        while (currentIndex > 1) {
            const parentIndex = Math.floor(currentIndex / 2);
            
            if (this.heap[currentIndex].time < this.heap[parentIndex].time) {
                this.swap(currentIndex, parentIndex);

                currentIndex = parentIndex;
            } else {
                break;
            }
        }
    }

    heapifyDown() {
        let currentIndex = 1;

        const lastIndex = this.heap.length - 1;

        while (true) {
            let leftChildIndex = 2 * currentIndex;
            let rightChildIndex = 2 * currentIndex + 1;
            let smallestIndex = currentIndex;

            if (leftChildIndex <= lastIndex &&
                this.heap[leftChildIndex].time < this.heap[smallestIndex].time) {
                smallestIndex = leftChildIndex;
            }

            if (rightChildIndex <= lastIndex &&
                this.heap[rightChildIndex].time < this.heap[smallestIndex].time) {
                smallestIndex = rightChildIndex;
            }

            if (smallestIndex !== currentIndex) {
                this.swap(currentIndex, smallestIndex);

                currentIndex = smallestIndex;
            } else {
                break;
            }
        }
    }

    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}

module.exports = EventQueue;