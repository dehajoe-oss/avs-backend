// backend/src/middlewares/validate.js
// Wrapper Zod générique : 400 { success:false, message, errors:[{field,message}] }
// + body nettoyé (données validées) transmis aux contrôleurs.
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {})
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }))
      return res.status(400).json({
        success: false,
        message: errors[0]?.message || 'Données invalides.',
        errors,
      })
    }
    req.body = result.data
    next()
  }
}

module.exports = { validate }
