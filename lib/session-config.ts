// Opciones de sesión compartidas entre lib/session.ts y proxy.ts.
// Este archivo NO importa de next/headers para que sea seguro en middleware.

export const SESSION_OPTIONS = {
  password: process.env.SESSION_SECRET ?? "",
  cookieName: "slc_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};
