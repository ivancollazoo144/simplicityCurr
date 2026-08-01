import Image from "next/image";
import { loginAction } from "./actions";

export const metadata = { title: "Iniciar sesión · simplicityCurr" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const hasError = sp.error === "1";
  const isRateLimited = sp.error === "rate";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Image
            src="/logo.png"
            alt="Simplicity Learning Center"
            width={200}
            height={80}
            className="h-20 w-auto object-contain"
            priority
          />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-center text-xl font-semibold text-zinc-900">Bienvenido</h1>
          <p className="mb-6 text-center text-sm text-zinc-500">
            Simplicity Learning Center · Currículo K-12
          </p>

          <form action={loginAction} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Correo electrónico
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="maestro@simplicity.edu"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                Contraseña
              </label>
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            {hasError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                Correo o contraseña incorrectos. Intenta de nuevo.
              </p>
            )}
            {isRateLimited && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Demasiados intentos fallidos. Espera 15 minutos e intenta de nuevo.
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand/90"
            >
              Iniciar sesión
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          ¿Problemas para acceder? Contacta al administrador.
        </p>
      </div>
    </div>
  );
}
