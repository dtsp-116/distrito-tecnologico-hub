"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { DistrictLogo } from "@/components/DistrictLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RegisterPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!nome.trim() || !email.trim() || !senha.trim()) return;

    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: senha.trim(),
        options: {
          data: { name: nome.trim() }
        }
      });

      if (signUpError) {
        setError("Nao foi possivel cadastrar. Verifique os dados informados.");
        return;
      }

      // Se houver sessao imediata, garante perfil e segue para o sistema.
      if (data.session) {
        await fetch("/api/auth/profile");
        router.push("/hub");
        router.refresh();
        return;
      }

      setSuccess("Cadastro realizado. Verifique seu e-mail para confirmar a conta.");
      setNome("");
      setEmail("");
      setSenha("");
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
          <DistrictLogo href="/cadastro" />
        </div>
        <h1 className="text-center text-xl font-bold text-gray-900 dark:text-gray-100">Criar conta</h1>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
          Cadastre-se para acessar o hub de editais com seu perfil de usuario.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nome</span>
            <input
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Seu nome"
              className="h-11 rounded-md border border-district-border px-3 text-sm outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              required
            />
          </label>

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
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Crie uma senha"
              className="h-11 rounded-md border border-district-border px-3 text-sm outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              required
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="h-11 w-full rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar"}
          </button>

          <p className="text-center text-sm text-gray-600 dark:text-gray-300">
            Ja tem conta?{" "}
            <Link href="/login" className="font-semibold text-district-red hover:underline">
              Entrar
            </Link>
          </p>

          {error && (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </p>
          )}
          {success && (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
              {success}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}
