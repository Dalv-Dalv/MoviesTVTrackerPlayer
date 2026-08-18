export const deduplicateFolders = (folders) => {
    if (!folders || !folders.length) return [];

    const normalized = folders
        .map(f => f.replace(/\\/g, '/').replace(/\/$/, ''))
        .filter(Boolean);

    normalized.sort((a, b) => a.length - b.length);

    const result = [];
    for (const folder of normalized) {
        const isChild = result.some(parent => folder === parent || folder.startsWith(parent + '/'));
        if (!isChild) {
            result.push(folder);
        }
    }

    return result;
};