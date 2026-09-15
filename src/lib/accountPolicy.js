// backend/src/lib/accountPolicy.js
// Règles "compte propre" partagées : mot de passe + téléphone.

const PASSWORD_MIN_LENGTH = 8

function checkPassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Le mot de passe est obligatoire.'
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Le mot de passe doit contenir au moins une lettre et un chiffre.'
  }
  return null
}

// Normalise un numéro saisi librement en forme canonique locale :
// "+242 06 123-45-67" -> "061234567" (indicatif 242 retiré s'il est présent).
// Deux saisies du même numéro (locale ou internationale) donnent toujours
// la même forme, donc inscription et connexion se retrouvent.
function normalizePhone(raw) {
  if (raw === undefined || raw === null) return null
  const digits = String(raw).trim().replace(/\D/g, '')
  if (!digits) return null
  let canonical = digits
  if (canonical.length > 9 && canonical.startsWith('242')) {
    canonical = canonical.slice(3)
  }
  if (canonical.length < 8 || canonical.length > 15) return null
  return canonical
}

module.exports = { PASSWORD_MIN_LENGTH, checkPassword, normalizePhone }
