import { GovernancePolicy } from './discernment-gate';

export let activeGovernancePolicy: GovernancePolicy = {
    version: 0,
    globalThresholdMultiplier: 1.0,
    blacklistedPatterns: []
};

export function updateActivePolicy(newPolicy: GovernancePolicy) {
    if (newPolicy.version > activeGovernancePolicy.version) {
        activeGovernancePolicy = newPolicy;
        return true;
    }
    return false;
}
