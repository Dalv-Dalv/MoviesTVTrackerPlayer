export function isObject(item) {
    return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Deep merge two objects.
 * @param {Object} target The target object (e.g., global settings)
 * @param {Object} source The source object (e.g., media overrides)
 * @returns {Object} A new merged object
 */
export function deepMerge(target, source) {
    if (!source) return target;

    const output = { ...target };
    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target))
                    Object.assign(output, { [key]: source[key] });
                else
                    output[key] = deepMerge(target[key], source[key]);
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    } else if (!isObject(target) && isObject(source)) {
        return { ...source };
    } else if (!isObject(target) && !isObject(source)) {
        return source !== undefined ? source : target;
    }
    
    return output;
}
