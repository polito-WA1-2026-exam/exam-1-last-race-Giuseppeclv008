"use strict";

// Roulette wheel selection
export function pickWeightedEvent(events, rng = Math.random) {
    const total = events.reduce((sum,e) => sum + e.weight, 0);
    let r = rng() * total; // generates a random number between 0 and total
    // Iterate through the events to see where the random number r landed.
    // each event gets a segment 
    // strictly proportional to its weight.
    for (const event of events) {
        // Events with higher weights are more likely because they have a larger 
        // "target area" to catch the initial random number. The probability that r is a small number is higher in the [0, total] interval.
        // Example: Event A (weight: 6) and Event B (weight: 5). Total = 11.
        // If our random r is 8:
        // 1. Loop 1 (Event A): Is 8 < 6? No. The dart missed A's large target.
        if (r < event.weight) return event; 

        // 2. Subtract A's weight: r becomes 2 (8 - 6). 
        // We subtract the checked weight to shift the baseline for the next event, 
        // essentially asking: "Did the remainder fall into this next segment?"
        // 3. Loop 2 (Event B): Is 2 < 5? Yes! Event B is returned.                                  
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
    return {steps, finalScore: Math.max(coins, 0) }; // Math.max(coins, 0) ensures that the min value returned for coins is 0
}