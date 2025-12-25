
/**
 * Determines if the projection is in "Select Mode" (inclusive) or "Omit Mode" (exclusive).
 * 
 * Rules:
 * 1. If any field is `1` (true), it is Select Mode.
 * 2. If any field is an object (nested projection), we check if that nested projection implies Select Mode.
 *    - If nested is Select Mode, it contributes to parent Select Mode.
 *    - If nested is Omit Mode, it contributes to parent Omit Mode (conceptually).
 * 3. Only if ALL contributing fields are Omit-style (0 or nested Omit), then it is Omit Mode.
 */
function isSelectMode(projection: any): boolean {
    if (typeof projection !== 'object' || projection === null) return false;

    const keys = Object.keys(projection);
    for (const key of keys) {
        const val = projection[key];
        if (val === 1 || val === true) return true;
        if (typeof val === 'object' && val !== null) {
            if (isSelectMode(val)) return true;
        }
    }
    return false;
}

export function applyProjection(data: any, projection: any): any {
    if (!data || typeof data !== 'object' || !projection || typeof projection !== 'object') {
        return data;
    }

    if (Array.isArray(data)) {
        return data.map(item => applyProjection(item, projection));
    }

    const mode = isSelectMode(projection);
    const result: any = mode ? {} : { ...data };

    if (mode) {
        // Select Mode: Pick only specified fields
        for (const key in projection) {
            const val = projection[key];
            if (val === 0 || val === false) continue; // Should not happen often in pure Select Mode but valid to ignore

            if (val === 1 || val === true) {
                if (key in data) result[key] = data[key];
            } else if (typeof val === 'object' && val !== null) {
                // Nested projection
                if (key in data) {
                    result[key] = applyProjection(data[key], val);
                }
            }
        }
    } else {
        // Omit Mode: Remove specified fields
        for (const key in projection) {
            const val = projection[key];
            if (val === 0 || val === false) {
                delete result[key];
            } else if (typeof val === 'object' && val !== null) {
                // Nested projection in Omit Mode usually implies deeper omission
                if (key in data) {
                    result[key] = applyProjection(data[key], val);
                }
            }
        }
    }

    return result;
}
