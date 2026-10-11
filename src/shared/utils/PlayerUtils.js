export const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s
            .toString()
            .padStart(2, '0')}`;
    }

    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const formatRuntime = (mins) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);

    if (h > 0) {
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    }

    return `${m}m`;
};



const languageNames = new Intl.DisplayNames(["en"], {
    type: "language",
});

const SPECIAL_LANGUAGE_CASES = {
    "en-US": "English (US)",
    "en-GB": "English (UK)",
    "en-AU": "English (Australia)",
    "en-CA": "English (Canada)",

    "pt-BR": "Portuguese (Brazil)",
    "pt-PT": "Portuguese (Portugal)",

    "es-ES": "Spanish (Spain)",
    "es-419": "Spanish (Latin America)",

    "zh-CN": "Chinese (Simplified)",
    "zh-TW": "Chinese (Traditional)",
    "zh-Hans": "Chinese (Simplified)",
    "zh-Hant": "Chinese (Traditional)",
};

export const formatLanguage = (code) => {
    if (!code) return "Unknown";

    let localeStr = code;
    try {
        localeStr = new Intl.Locale(code).toString();
    } catch (e) {
        try {
            localeStr = new Intl.Locale(code.split('-')[0]).toString();
        } catch (e2) {
            return code;
        }
    }

    if (SPECIAL_LANGUAGE_CASES[localeStr]) {
        return SPECIAL_LANGUAGE_CASES[localeStr];
    }

    try {
        const base = new Intl.Locale(localeStr).language;
        return languageNames.of(base) ?? localeStr;
    } catch {
        return localeStr;
    }
};

export const formatSeasonName = (season) => {
    if (!season) return '';
    if (season.number === 0) return season.name || 'Specials';
    return season.name?.trim() || `Season ${season.number}`;
};