// Structured JSON logger. Outputs to stdout/stderr so Vercel picks it up.
// Add a Sentry/Axiom transport here when you want remote observability.

type Level = 'info' | 'warn' | 'error'
type Ctx = Record<string, unknown>

function emit(level: Level, msg: string, ctx?: Ctx) {
  const entry = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...ctx })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

export const logger = {
  info:  (msg: string, ctx?: Ctx) => emit('info',  msg, ctx),
  warn:  (msg: string, ctx?: Ctx) => emit('warn',  msg, ctx),
  error: (msg: string, ctx?: Ctx) => emit('error', msg, ctx),
}
