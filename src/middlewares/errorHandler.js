// backend/src/middlewares/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error(`[ERREUR ${req.method} ${req.url}]`, err)

  // Erreurs de validation ou uniques Prisma
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'champ'
    return res.status(409).json({
      success: false,
      message: `Un enregistrement avec cette valeur existe déjà (${target}).`,
    })
  }

  // Enregistrement Prisma introuvable
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Ressource introuvable dans la base de données.',
    })
  }

  // Erreur JSON syntax
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Corps de la requête JSON mal formé.',
    })
  }

  const statusCode = err.statusCode || 500
  const message = err.message || 'Une erreur interne est survenue sur le serveur.'

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler
