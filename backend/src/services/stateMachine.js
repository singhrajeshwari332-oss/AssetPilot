export const ASSET_STATUSES = {
  AVAILABLE: 'AVAILABLE',
  ASSIGNED: 'ASSIGNED',
  RETURN_REQUESTED: 'RETURN_REQUESTED',
  IN_REPAIR: 'IN_REPAIR',
  RETIRED: 'RETIRED'
};

export const ALLOWED_TRANSITIONS = {
  AVAILABLE: ['ASSIGNED', 'IN_REPAIR', 'RETIRED'],
  ASSIGNED: ['RETURN_REQUESTED', 'IN_REPAIR'],
  RETURN_REQUESTED: ['AVAILABLE', 'IN_REPAIR', 'RETIRED'],
  IN_REPAIR: ['AVAILABLE', 'RETIRED'],
  RETIRED: [] // Terminal state
};

/**
 * Validates whether a transition from currentStatus to nextStatus is allowed.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateStateTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return { valid: true };
  }

  const allowed = ALLOWED_TRANSITIONS[currentStatus];
  if (!allowed) {
    return {
      valid: false,
      error: `Unknown asset status: ${currentStatus}`
    };
  }

  if (currentStatus === ASSET_STATUSES.RETIRED) {
    return {
      valid: false,
      error: `Asset is in RETIRED terminal state and cannot be modified or transitioned.`
    };
  }

  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from ${currentStatus} to ${nextStatus}. Allowed next states: ${allowed.join(', ') || 'None'}`
    };
  }

  return { valid: true };
}

/**
 * Returns available next states for an asset based on its current state.
 * @param {string} currentStatus
 * @returns {string[]}
 */
export function getAvailableTransitions(currentStatus) {
  return ALLOWED_TRANSITIONS[currentStatus] || [];
}
