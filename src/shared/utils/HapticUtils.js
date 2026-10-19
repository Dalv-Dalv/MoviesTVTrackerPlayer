/**
 * Haptic / Vibration Utilities for Mobile Devices.
 *
 * Uses the Web Vibration API (navigator.vibrate) to provide tactile feedback
 * resembling native iOS (UIImpactFeedbackGenerator / UINotificationFeedbackGenerator)
 * and Android HapticFeedbackConstants.
 *
 * Vibration patterns are defined as:
 * - A single number (ms of vibration)
 * - An array of alternating vibration and silence intervals [vibrateMs, pauseMs, vibrateMs, ...]
 */

export const HAPTIC_PATTERNS = {
    // --- Impact / Tactile Feedbacks ---
    /** Ultra-short tick for sliders, scrubbers, pickers, or scrolling through items */
    selection: 10,

    /** Light tap for standard buttons, tabs, segmented controls */
    light: 15,

    /** Medium tactile feedback for toggle switches, card presses, drawer actions */
    medium: 30,

    /** Heavy impact for modal appearances, snap operations, prominent actions */
    heavy: 55,

    /** Soft gentle pulse */
    soft: 25,

    /** Crisp, rigid tap */
    rigid: 15,

    // --- Notification & State Feedbacks ---
    /** Ascending double-pulse indicating successful completion (like, download finish, save) */
    success: [15, 60, 35],

    /** Two alert pulses signaling caution or warning */
    warning: [40, 80, 40],

    /** Triple rapid stutter signaling validation error, reject, or blocked action */
    error: [40, 60, 40, 60, 50],

    // --- Interaction & Gesture Feedbacks ---
    /** Distinct single pulse when a long-press or hold gesture triggers */
    longPress: 45,

    /** Quick double-tap response (e.g. favorite / like animation) */
    doubleTap: [15, 60, 20],

    /** Ascending micro-pulse when turning a switch on */
    toggleOn: [12, 40, 20],

    /** Descending micro-pulse when turning a switch off */
    toggleOff: [20, 40, 12],

    /** Destructive action rumble (e.g. deleting an item or removing from library) */
    delete: [50, 50, 40],

    /** Subtle repetitive nudge to prompt user attention */
    nudge: [10, 40, 10, 40, 10]
};

/**
 * Checks whether the current environment supports the Web Vibration API.
 * @returns {boolean} True if vibration is supported
 */
export const isHapticSupported = () => {
    return (
        typeof window !== 'undefined' &&
        typeof navigator !== 'undefined' &&
        'vibrate' in navigator &&
        typeof navigator.vibrate === 'function'
    );
};

/**
 * Cancels any ongoing vibration pattern immediately.
 */
export const stopHaptic = () => {
    try {
        if (isHapticSupported()) {
            navigator.vibrate(0);
        }
    } catch {
        // Silently ignore errors
    }
};

/**
 * Triggers haptic feedback using a preset name, millisecond duration, or custom pattern array.
 *
 * @param {keyof typeof HAPTIC_PATTERNS | number | number[]} [patternOrPreset='light'] - Preset name, ms duration, or pattern array
 * @returns {boolean} True if the vibration call succeeded
 *
 * @example
 * triggerHaptic('light'); // 15ms light tap
 * triggerHaptic('success'); // [15, 60, 35] success pulse
 * triggerHaptic(20); // 20ms custom pulse
 * triggerHaptic([30, 50, 30]); // custom pattern
 */
export const triggerHaptic = (patternOrPreset = 'light') => {
    try {
        if (!isHapticSupported()) return false;

        let pattern = patternOrPreset;
        if (typeof patternOrPreset === 'string') {
            pattern = HAPTIC_PATTERNS[patternOrPreset] ?? HAPTIC_PATTERNS.light;
        }

        return navigator.vibrate(pattern);
    } catch {
        // Silently ignore if restricted by system or browser policies
        return false;
    }
};

// --- Convenience helper functions for common feedback styles ---

/** Light discrete tick (sliders, picker wheels, scrubbers) */
export const hapticSelection = () => triggerHaptic(HAPTIC_PATTERNS.selection);

/** Light tap (buttons, tabs, chips) */
export const hapticLight = () => triggerHaptic(HAPTIC_PATTERNS.light);

/** Medium tactile hit (switches, drawers, active toggles) */
export const hapticMedium = () => triggerHaptic(HAPTIC_PATTERNS.medium);

/** Heavy impact (modals, destructive action reveals) */
export const hapticHeavy = () => triggerHaptic(HAPTIC_PATTERNS.heavy);

/** Positive confirmation notification (success) */
export const hapticSuccess = () => triggerHaptic(HAPTIC_PATTERNS.success);

/** Warning notification */
export const hapticWarning = () => triggerHaptic(HAPTIC_PATTERNS.warning);

/** Error / rejection notification (error) */
export const hapticError = () => triggerHaptic(HAPTIC_PATTERNS.error);

/** Long press gesture activation */
export const hapticLongPress = () => triggerHaptic(HAPTIC_PATTERNS.longPress);

/** Double-tap gesture (heart / like) */
export const hapticDoubleTap = () => triggerHaptic(HAPTIC_PATTERNS.doubleTap);

/** Switch toggle feedback */
export const hapticToggle = (isOn) => triggerHaptic(isOn ? HAPTIC_PATTERNS.toggleOn : HAPTIC_PATTERNS.toggleOff);
