// Deterministic Explainable Eligibility Matching Engine

export class EligibilityEngine {
  /**
   * Flattens a citizen's profile into normalized key-value map
   */
  static buildProfileMap(profile) {
    if (!profile) return {};
    const map = {};
    for (const [key, val] of Object.entries(profile)) {
      if (val !== null && val !== undefined) {
        map[key.toLowerCase().trim()] = String(val).trim();
      }
    }
    return map;
  }

  /**
   * Evaluates a single rule operator against the citizen's profile value
   */
  static evaluateRule(profileVal, operator, ruleVal) {
    if (!profileVal) return false;
    const pVal = profileVal.toLowerCase();
    const rVal = ruleVal.toLowerCase();

    switch (operator.toUpperCase()) {
      case 'EQUALS':
        return pVal === rVal;

      case 'NOT_EQUALS':
        return pVal !== rVal;

      case 'CONTAINS':
        return pVal.includes(rVal);

      case 'IN': {
        const allowed = rVal.split(',').map(s => s.trim());
        return allowed.includes(pVal);
      }

      case 'GREATER_THAN': {
        const numP = parseFloat(pVal);
        const numR = parseFloat(rVal);
        return !isNaN(numP) && !isNaN(numR) && numP > numR;
      }

      case 'LESS_THAN': {
        const numP = parseFloat(pVal);
        const numR = parseFloat(rVal);
        return !isNaN(numP) && !isNaN(numR) && numP < numR;
      }

      case 'GREATER_THAN_OR_EQUAL': {
        const numP = parseFloat(pVal);
        const numR = parseFloat(rVal);
        return !isNaN(numP) && !isNaN(numR) && numP >= numR;
      }

      case 'LESS_THAN_OR_EQUAL': {
        const numP = parseFloat(pVal);
        const numR = parseFloat(rVal);
        return !isNaN(numP) && !isNaN(numR) && numP <= numR;
      }

      default:
        return false;
    }
  }

  /**
   * Evaluates a scheme against a citizen profile and returns explainable match metadata
   */
  static evaluateScheme(scheme, profile) {
    const profileMap = this.buildProfileMap(profile);
    const rules = scheme.rules || [];

    const matchedConditions = [];
    const failedConditions = [];
    const missingInformation = [];

    // State level pre-check: if scheme is state-specific and user state differs, it's not a match
    if (scheme.governmentLevel === 'STATE' && scheme.state && scheme.state !== 'All India') {
      const userState = profileMap['state'];
      if (!userState) {
        missingInformation.push(`State of residence required to verify eligibility for ${scheme.state} state scheme`);
      } else if (userState.toLowerCase() !== scheme.state.toLowerCase()) {
        failedConditions.push(`Restricted to residents of ${scheme.state} (Profile state: ${userState})`);
      }
    }

    let evaluatableCount = 0;
    let matchedCount = 0;

    for (const rule of rules) {
      evaluatableCount++;
      const fieldKey = rule.field.toLowerCase().trim();
      const profileValue = profileMap[fieldKey];

      if (!profileValue) {
        // Condition cannot be evaluated because user has not provided this information yet
        missingInformation.push(
          rule.description || `Confirmation of ${rule.field} is required (${rule.operator} ${rule.value})`
        );
      } else {
        const passed = this.evaluateRule(profileValue, rule.operator, rule.value);
        if (passed) {
          matchedCount++;
          matchedConditions.push(
            rule.description || `${rule.field} satisfies criteria (${profileValue})`
          );
        } else {
          failedConditions.push(
            rule.description
              ? `Did not satisfy: ${rule.description} (Your profile: ${profileValue})`
              : `${rule.field} does not match required ${rule.value} (Found: ${profileValue})`
          );
        }
      }
    }

    // Calculate match score percentage
    let matchScore = 0;
    if (evaluatableCount > 0) {
      matchScore = Math.round((matchedCount / evaluatableCount) * 100);
    } else {
      matchScore = 75; // Default baseline if scheme has open universal eligibility
    }

    // Determine Match Type Tier
    let matchType = 'NOT_A_MATCH';
    if (failedConditions.length > 0) {
      matchType = 'NOT_A_MATCH';
    } else if (missingInformation.length > 0 && matchedConditions.length === 0) {
      matchType = 'MORE_INFORMATION_REQUIRED';
    } else if (missingInformation.length > 0) {
      matchType = matchScore >= 60 ? 'POTENTIAL_MATCH' : 'MORE_INFORMATION_REQUIRED';
    } else if (matchScore >= 80) {
      matchType = 'STRONG_MATCH';
    } else if (matchScore >= 50) {
      matchType = 'POTENTIAL_MATCH';
    } else {
      matchType = 'MORE_INFORMATION_REQUIRED';
    }

    return {
      schemeId: scheme.id,
      schemeName: scheme.name,
      schemeCategory: scheme.category,
      governmentLevel: scheme.governmentLevel,
      state: scheme.state,
      benefit: scheme.benefit,
      sourceUrl: scheme.sourceUrl,
      lastVerified: scheme.lastVerified,
      matchScore,
      matchType,
      matchedConditions,
      failedConditions,
      missingInformation,
      totalRulesCount: evaluatableCount,
      evaluatedAt: new Date().toISOString()
    };
  }
}
