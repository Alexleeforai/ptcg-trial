/**
 * Admin「系列範圍」輸入：右格可填 PriceCharting slug（substring）
 * 或與庫內 Card.setCode 完全一致嘅代號（唔分大小寫）。
 */

export function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {import('mongoose').Model} Card
 * @param {string} raw
 * @returns {Promise<
 *   | { ok: true; setIdQuery?: string | RegExp; setCodeQuery?: RegExp; resolvedVia: 'setCode' | 'setCode_direct' | 'setIdRegex'; canonicalSetId?: string }
 *   | { ok: false; reason: 'too_short' | 'ambiguous_set_code'; setIds?: string[]; message: string }
 * >}
 */
export async function resolveAdminSetScope(Card, raw) {
    const t = raw.trim();
    if (t.length < 2) {
        return {
            ok: false,
            reason: 'too_short',
            message: '至少 2 個字元'
        };
    }

    const setCodeRx = new RegExp(`^${escapeRegex(t)}$`, 'i');

    // Step 1: check how many distinct setIds map to this exact setCode
    const byCode = await Card.distinct('setId', {
        setCode: setCodeRx,
        setId: { $exists: true, $nin: [null, ''] }
    });

    if (byCode.length === 1) {
        const canonicalSetId = byCode[0];
        return {
            ok: true,
            setIdQuery: canonicalSetId,
            resolvedVia: 'setCode',
            canonicalSetId
        };
    }
    if (byCode.length > 1) {
        return {
            ok: false,
            reason: 'ambiguous_set_code',
            setIds: byCode,
            message: '呢個 setCode 對應多於一個 setId，請改用完整 setId slug。'
        };
    }

    // Step 2: byCode is empty — cards may exist with this setCode but no setId field.
    // Do a direct count to confirm before falling back to setId regex.
    const setCodeCount = await Card.countDocuments({ setCode: setCodeRx });
    if (setCodeCount > 0) {
        return {
            ok: true,
            setCodeQuery: setCodeRx,
            resolvedVia: 'setCode_direct',
            canonicalSetId: null
        };
    }

    // Step 3: treat input as a substring of setId
    return {
        ok: true,
        setIdQuery: new RegExp(escapeRegex(t), 'i'),
        resolvedVia: 'setIdRegex'
    };
}
