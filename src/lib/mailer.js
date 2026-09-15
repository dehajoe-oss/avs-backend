// backend/src/lib/mailer.js
// Envoi d'emails transactionnels via Resend (HTTP, sans dépendance).
// Sans RESEND_API_KEY : mode dev — le lien est loggé et renvoyé à l'appelant
// (jamais en production). Ajoutez RESEND_API_KEY + FRONTEND_URL en prod.
const { NODE_ENV } = require('../config/env')

const RESEND_API_KEY = process.env.RESEND_API_KEY || null
const RESEND_FROM = process.env.RESEND_FROM || 'Agro Véto Services <noreply@agrovetoservices.cg>'

async function sendMail({ to, subject, html }) {
  if (!RESEND_API_KEY) return { sent: false, reason: 'no-mailer' }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: RESEND_FROM, to, subject, html }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.message || `Envoi email impossible (${res.status})`)
  }
  return { sent: true, id: data?.id }
}

function resetPasswordMail({ name, resetUrl }) {
  return {
    subject: 'Réinitialisation de votre mot de passe — Agro Véto Services',
    html: `<p>Bonjour ${name || ''},</p>
<p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous (valable 1 heure) :</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message.</p>
<p>— L'équipe Agro Véto Services Congo</p>`,
  }
}

module.exports = { sendMail, resetPasswordMail, hasMailer: () => Boolean(RESEND_API_KEY), isProd: () => NODE_ENV === 'production' }
