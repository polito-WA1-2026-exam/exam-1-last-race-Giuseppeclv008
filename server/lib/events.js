"use strict";

export function pickWeightedEvent(events, rng = Math.random) {
    const total = events.reduce((sum,e) => sum + e.weight, 0);
    let r = rng() * total;
    for (const event of events) {
        if (r < event.weight) return event;
        r -= event.weight;
    }
    return events[events.length - 1];
}

export function applyRoute(segmentCount, events, startCoins, rng = Math.random) {
    let coins = startCoins;
    const steps = [];
    for( let i= 0; i < segmentCount; i++) {
        const event = pickWeightedEvent(events, rng);
        coins += event.effect;
        steps.push({ event: event, effect: event.effect, coinsAfter: coins });
    }
    return {steps, finalScore: Math.max(coins, 0) };
}