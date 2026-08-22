export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const withRetry = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            if (i === maxRetries - 1) throw error;

            const waitTime = baseDelay * Math.pow(2, i);
            console.warn(`Retry execution failed. Retrying in ${waitTime}ms...`, error);
            await sleep(waitTime);
        }
    }
};

export function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}