/**
 * AEGIS Consensus Engine
 * Logic for decentralized agent decision making.
 */

export interface ConsensusResult {
    passed: boolean;
    requiredVotes: number;
    currentVotes: number;
    threshold: number;
}

/**
 * Calculates the required number of votes for a simple majority.
 * @param totalPeers Total number of agents in the swarm (excluding the active requester).
 * @returns The number of votes needed for consensus.
 */
export function calculateConsensusThreshold(totalPeers: number): number {
    // Total participants = knownPeers + 1 (the local agent)
    // Majority = floor(Total / 2) + 1
    return Math.floor((totalPeers + 1) / 2) + 1;
}

/**
 * Evaluates whether a proposal has reached consensus.
 */
export function evaluateConsensus(votes: number, peers: number): ConsensusResult {
    const threshold = calculateConsensusThreshold(peers);
    return {
        passed: votes >= threshold,
        requiredVotes: threshold,
        currentVotes: votes,
        threshold: threshold / (peers + 1)
    };
}
