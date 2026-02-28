"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DistrictLogo } from "@/components/DistrictLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (signInError) {
        setError("Nao foi possivel entrar. Verifique e-mail e senha.");
        return;
      }

      const profileResponse = await fetch("/api/auth/profile");
      if (!profileResponse.ok) {
        setError("Login realizado, mas nao foi possivel carregar perfil.");
        return;
      }

      const profile = (await profileResponse.json()) as { role?: string };
      router.push(profile.role === "admin" ? "/admin" : "/hub");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-6 dark:bg-gray-950">
      <section className="w-full max-w-md rounded-mdx border border-district-border bg-white p-6 shadow-card dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        <div className="mb-6 flex justify-center">
          <DistrictLogo href="/login" />
        </div>
        <h1 className="text-center text-xl font-bold text-gray-900 dark:text-gray-100">Entrar no sistema</h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Acesse o hub para consultar, filtrar e acompanhar editais.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">E-mail</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              className="h-11 rounded-md border border-district-border px-3 text-sm outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              className="h-11 rounded-md border border-district-border px-3 text-sm outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Ainda nao tem conta?{" "}
            <Link href="/cadastro" className="font-semibold text-district-red hover:underline">
              Cadastrar
            </Link>
          </p>
          {error && (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
