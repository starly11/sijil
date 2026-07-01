import idService from '../services/id.service.js';

console.log('=== VERIFYING ID ALPHABET ===\n');

const validChars = /^[a-z0-9]+$/;
const allValid = Object.keys(idService.ID_PREFIXES).every((type) => {
    const id = idService.generateId(type);
    const [prefix, randomPart] = id.split('_');
    const isValid = validChars.test(randomPart);
    console.log(`[${type.padEnd(9)}] ${id} -> Random part "${randomPart}" valid? ${isValid}`);
    return isValid;
});

console.log(`\n✅ All random parts contain only lowercase alphanumerics: ${allValid}`);
