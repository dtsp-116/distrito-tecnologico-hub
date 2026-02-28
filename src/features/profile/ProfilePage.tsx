"use client";

import { FormEvent, useEffect, useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Agencia } from "@/types";

interface ProfilePageProps {
  agencias: Agencia[];
}

export function ProfilePage({ agencias }: ProfilePageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        if (!response.ok) return;
        const data = (await response.json()) as { name?: string; email?: string };
        setName(data.name ?? "");
        setEmail(data.email ?? "");
      } catch {
        // Silencioso: tela continua funcional para edicao.
      }
    };
    void loadProfile();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFeedback("");

    if (password && password !== confirmPassword) {
      setError("A confirmacao da senha nao confere.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password: password.trim() || undefined
        })
      });
      if (!response.ok) {
        throw new Error();
      }
      setPassword("");
      setConfirmPassword("");
      setFeedback("Perfil atualizado com sucesso.");
    } catch {
      setError("Nao foi possivel atualizar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout agencias={agencias}>
      <section className="mx-auto max-w-2xl rounded-mdx border border-district-border bg-white p-5 shadow-card dark:border-gray-700 dark:bg-gray-900 md:p-6">
        <div className="mb-3 flex justify-end">
          <ThemeToggle />
        </div>
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Meu perfil</h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
          Atualize seu nome de exibicao e senha de acesso.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nome</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              placeholder="Seu nome"
              required
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">E-mail</span>
            <input
              value={email}
              readOnly
              className="h-11 rounded-md border border-district-border bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nova senha</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              placeholder="Deixe em branco para nao alterar"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Confirmar nova senha</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-11 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              placeholder="Repita a nova senha"
            />
          </label>

          <button
            type="submit"
            disabled={isSaving}
            className="h-11 rounded-md bg-district-red px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isSaving ? "Salvando..." : "Salvar alteracoes"}
          </button>

          {error && (
            <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
              {error}
            </p>
          )}
          {feedback && (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
              {feedback}
            </p>
          )}
        </form>
      </section>
    </MainLayout>
  );
}
