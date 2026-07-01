/** The canonical regular expression governing fully valid web slug formatting sequences. */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Static layout prioritization tracking flag indicating ultimate sequence prioritization. */
const EXERCISE_DISPLAY_ORDER = 999;

/** Static layout prioritization tracking flag indicating foundational initialization priority. */
const INTRO_DISPLAY_ORDER = 0;

/**
 * Transforms an arbitrary dirty string into a canonical, safe, maximum 80-character URL component slug.
 * @param {string} raw - The unformatted string parameter targeting sanitation
 * @returns {string} The structural sanitized URL component slug outcome
 */
function sanitizeSlug(raw) {
    if (typeof raw !== 'string' || !raw.trim()) {
        throw new Error('sanitizeSlug requires a non-empty string');
    }

    const processed = raw
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);

    if (!processed) {
        throw new Error('sanitizeSlug requires a non-empty string');
    }

    return processed;
}

/**
 * Performs a safe, non-throwing evaluation of a slug string's semantic structural validity.
 * @param {string} slug - The formatted target slug parameter under test
 * @returns {boolean} Outcome verifying structure match, character boundaries, and emptiness boundaries
 */
function validateSlug(slug) {
    if (typeof slug !== 'string') return false;
    return SLUG_REGEX.test(slug) && slug.length > 0 && slug.length <= 80;
}

/**
 * Throws a processing runtime exception if a given slug structure breaks structural rules.
 * @param {string} slug - The target slug parameter validating state parameters
 */
function assertValidSlug(slug) {
    if (!validateSlug(slug)) {
        throw new Error(`Invalid slug: "${slug}"`);
    }
}

/**
 * Creates a formatted canonical Document system resource path reference identifier string mapping.
 * @param {string} title - Raw naming metric parameter text targeting transformation
 * @returns {string} Fully sanitized safe Document level resource routing key
 */
function buildDocumentSlug(title) {
    return sanitizeSlug(title);
}

/**
 * Creates a formatted canonical Chapter system resource path reference identifier string mapping.
 * @param {string} title - Raw naming metric parameter text targeting transformation
 * @returns {string} Fully sanitized safe Chapter level resource routing key
 */
function buildChapterSlug(title) {
    return sanitizeSlug(title);
}

/**
 * Creates a formatted canonical Topic system resource path reference identifier string mapping.
 * @param {string} headingText - Raw naming metric parameter text targeting transformation
 * @returns {string} Fully sanitized safe Topic level resource routing key
 */
function buildTopicSlug(headingText) {
    return sanitizeSlug(headingText);
}

/**
 * Combines parent-child contextual elements to compute an absolute global uniqueness key path resource reference.
 * @param {string} documentSlug - Contextual sanitized reference tracking path segment name
 * @param {number} chapterNumber - Numeric sequence tracking index positioning descriptor
 * @param {string} topicSlug - Leaf reference localization target property context
 * @returns {string} Validated composite canonical path pointer
 */
function buildGlobalSlug(documentSlug, chapterNumber, topicSlug) {
    return sanitizeSlug(`${documentSlug}-ch${chapterNumber}-${topicSlug}`);
}

/**
 * Re-formats unique localized relative routing nodes when namespace collision issues manifest within identical scoping contexts.
 * @param {string} slug - Target relative baseline pathway routing address descriptor
 * @param {string|number} sectionNumber - Distinct secondary positional sub-indexing property parameter
 * @returns {string} Resolved safe uniqueness fallback address pathway sequence string
 */
function dedupeSlug(slug, sectionNumber) {
    return sanitizeSlug(`${slug}-${sectionNumber}`);
}

/**
 * Computes explicit static textual slugs mapping target Quran references using direct positional dimensions.
 * @param {number|string} surahNumber - Position tracing numeric identifier index boundary parameter
 * @param {number|string} ayahStart - Initial baseline tracking sequence location address variable
 * @param {number|string} ayahEnd - Concluding tracking address terminal offset mapping parameter
 * @returns {string} Parsed resource path segment pointer reference string layout
 */
function buildQuranSlug(surahNumber, ayahStart, ayahEnd) {
    return `surah-${surahNumber}-ayah-${ayahStart}-${ayahEnd}`;
}

/**
 * Standardizes positional routing access path assignments pointing to structural chapter homework blocks.
 * @param {number|string} chapterNumber - Structural reference element position identification indicator
 * @returns {string} Clean relative lookup path segment pointer name mapping
 */
function buildExerciseSlug(chapterNumber) {
    return `ch${chapterNumber}-exercises`;
}

/**
 * Standardizes positional routing access path assignments pointing to structural chapter conceptual entry point blocks.
 * @param {number|string} chapterNumber - Structural reference element position identification indicator
 * @returns {string} Clean relative lookup path segment pointer name mapping
 */
function buildIntroSlug(chapterNumber) {
    return `ch${chapterNumber}-introduction`;
}

/**
 * Sets an early-stage cross-reference prefix on a slug indicator prior to structural persistence processing resolution.
 * @param {string} slug - The target relative baseline pathway pointer address parameter
 * @returns {string} Prefix tracking signature address string mapping assignment
 */
function addCrossRefPrefix(slug) {
    return `ref:${slug}`;
}

/**
 * Strips an early-stage cross-reference prefix indicator pattern returning the pure structural tracking path underneath.
 * @param {string} slugRef - Target compound metadata trace string reference tracker candidate
 * @returns {string} Stripped base routing address locator parameter structure values
 */
function stripCrossRefPrefix(slugRef) {
    if (typeof slugRef === 'string' && slugRef.startsWith('ref:')) {
        return slugRef.slice(4);
    }
    return slugRef;
}

/**
 * Verifies if an evaluation path tracking target parameter structure carries an un-resolved processing trace pattern.
 * @param {string} slugRef - Target component metadata check tracking variable parameter
 * @returns {boolean} Structural match testing logic evaluation confirmation outcome status
 */
function isCrossRef(slugRef) {
    return typeof slugRef === 'string' && slugRef.startsWith('ref:');
}

/**
 * Extracts the trailing raw unique entity alphanumeric sequence index string block isolated from unified resource paths.
 * @param {string} segment - Terminal location address branch component pathway block node structure
 * @returns {string} Parsed isolation segment element identity context tracking descriptor
 */
function extractShortIdFromUrlSegment(segment) {
    if (typeof segment !== 'string') return '';
    return segment.split('-').pop();
}

// Alias for sanitizeSlug to match common usage in the codebase
const generateSlug = sanitizeSlug;

export {
    SLUG_REGEX,
    EXERCISE_DISPLAY_ORDER,
    INTRO_DISPLAY_ORDER,
    sanitizeSlug,
    generateSlug,
    validateSlug,
    assertValidSlug,
    buildDocumentSlug,
    buildChapterSlug,
    buildTopicSlug,
    buildGlobalSlug,
    dedupeSlug,
    buildQuranSlug,
    buildExerciseSlug,
    buildIntroSlug,
    addCrossRefPrefix,
    stripCrossRefPrefix,
    isCrossRef,
    extractShortIdFromUrlSegment
};

export default {
    SLUG_REGEX,
    EXERCISE_DISPLAY_ORDER,
    INTRO_DISPLAY_ORDER,
    sanitizeSlug,
    generateSlug,
    validateSlug,
    assertValidSlug,
    buildDocumentSlug,
    buildChapterSlug,
    buildTopicSlug,
    buildGlobalSlug,
    dedupeSlug,
    buildQuranSlug,
    buildExerciseSlug,
    buildIntroSlug,
    addCrossRefPrefix,
    stripCrossRefPrefix,
    isCrossRef,
    extractShortIdFromUrlSegment
}
// slug_registry persistence + resolver job: Phase 3+, once models exist