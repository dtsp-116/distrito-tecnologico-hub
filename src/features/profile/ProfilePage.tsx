"use client";

import { FormEvent, useEffect, useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CardBase } from "@/components/ui/CardBase";
import { ButtonBase } from "@/components/ui/ButtonBase";
import { Agencia } from "@/types";

interface ProfilePageProps {
  agencias: Agencia[];
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt?: string | null;
}

export function ProfilePage({ agencias }: ProfilePageProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [adminFeedback, setAdminFeedback] = useState("");
  const [adminError, setAdminError] = useState("");
  const [createUserName, setCreateUserName] = useState("");
  const [createUserEmail, setCreateUserEmail] = useState("");
  const [createUserRole, setCreateUserRole] = useState<"admin" | "user">("user");
  const [createUserPassword, setCreateUserPassword] = useState("");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserRole, setEditUserRole] = useState<"admin" | "user">("user");
  const [isSavingUserEdit, setIsSavingUserEdit] = useState(false);

  const isAdmin = role === "admin";

  const loadUsers = async () => {
    if (!isAdmin) return;
    setIsLoadingUsers(true);
    setAdminError("");
    try {
      const response = await fetch("/api/admin/users");
      if (!response.ok) throw new Error();
      const data = (await response.json()) as { users: AdminUserRow[] };
      setUsers(data.users ?? []);
    } catch {
      setAdminError("Nao foi possivel carregar usuarios.");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/auth/profile");
        if (!response.ok) return;
        const data = (await response.json()) as { name?: string; email?: string; role?: "admin" | "user" };
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setRole(data.role ?? null);
      } catch {
        // Silencioso: tela continua funcional para edicao.
      }
    };
    void loadProfile();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void loadUsers();
  }, [isAdmin]);

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

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAdminError("");
    setAdminFeedback("");
    setIsCreatingUser(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createUserName.trim(),
          email: createUserEmail.trim(),
          role: createUserRole,
          password: createUserPassword.trim() || undefined
        })
      });
      const data = (await response.json()) as { error?: string; defaultPassword?: string | null };
      if (!response.ok) {
        setAdminError(data.error ?? "Nao foi possivel criar usuario.");
        return;
      }
      setCreateUserName("");
      setCreateUserEmail("");
      setCreateUserRole("user");
      setCreateUserPassword("");
      setAdminFeedback(
        data.defaultPassword
          ? `Usuario criado com sucesso. Senha inicial padrao: ${data.defaultPassword}`
          : "Usuario criado com sucesso."
      );
      await loadUsers();
    } catch {
      setAdminError("Nao foi possivel criar usuario.");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const startEditingUser = (user: AdminUserRow) => {
    setEditingUserId(user.id);
    setEditUserName(user.name);
    setEditUserEmail(user.email);
    setEditUserRole(user.role);
  };

  const handleSaveUserEdit = async (userId: string) => {
    setAdminError("");
    setAdminFeedback("");
    setIsSavingUserEdit(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editUserName.trim(),
          email: editUserEmail.trim(),
          role: editUserRole
        })
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setAdminError(data.error ?? "Nao foi possivel atualizar usuario.");
        return;
      }
      setAdminFeedback("Usuario atualizado com sucesso.");
      setEditingUserId(null);
      await loadUsers();
    } catch {
      setAdminError("Nao foi possivel atualizar usuario.");
    } finally {
      setIsSavingUserEdit(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`Excluir o usuario "${userName}"?`)) return;
    setAdminError("");
    setAdminFeedback("");
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setAdminError(data.error ?? "Nao foi possivel excluir usuario.");
        return;
      }
      setAdminFeedback("Usuario excluido com sucesso.");
      await loadUsers();
    } catch {
      setAdminError("Nao foi possivel excluir usuario.");
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!window.confirm(`Resetar senha de "${userName}" para 12345678?`)) return;
    setAdminError("");
    setAdminFeedback("");
    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, { method: "POST" });
      const data = (await response.json()) as { error?: string; temporaryPassword?: string };
      if (!response.ok) {
        setAdminError(data.error ?? "Nao foi possivel resetar a senha.");
        return;
      }
      setAdminFeedback(`Senha resetada com sucesso para: ${data.temporaryPassword ?? "12345678"}`);
    } catch {
      setAdminError("Nao foi possivel resetar a senha.");
    }
  };

  return (
    <MainLayout agencias={agencias}>
      <div className="mx-auto max-w-4xl space-y-5">
        <CardBase className="p-5 md:p-6">
          <div className="mb-3 flex justify-end">
            <ThemeToggle />
          </div>
          <h1 className="text-lg font-bold text-[color:var(--text-primary)]">Meu perfil</h1>
          <p className="text-subtle mt-1 text-sm">
            Atualize seu nome de exibicao e senha de acesso.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nome</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="input-base"
                placeholder="Seu nome"
                required
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">E-mail</span>
              <input
                value={email}
                readOnly
                className="input-base bg-[var(--bg-subtle)] text-subtle"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Nova senha</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="input-base"
                placeholder="Deixe em branco para nao alterar"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Confirmar nova senha</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="input-base"
                placeholder="Repita a nova senha"
              />
            </label>

            <ButtonBase
              type="submit"
              variant="primary"
              disabled={isSaving}
              className="h-11 px-4 disabled:opacity-60"
            >
              {isSaving ? "Salvando..." : "Salvar alteracoes"}
            </ButtonBase>

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
        </CardBase>

        {isAdmin && (
          <CardBase className="p-5 md:p-6">
            <h2 className="text-lg font-bold text-[color:var(--text-primary)]">Gestao de usuarios</h2>
            <p className="text-subtle mt-1 text-sm">
              Crie, edite, exclua usuarios e resete senha para 12345678 quando necessario.
            </p>

            <form onSubmit={handleCreateUser} className="mt-4 grid gap-2 md:grid-cols-[1fr_1fr_140px_1fr_auto]">
              <input
                value={createUserName}
                onChange={(event) => setCreateUserName(event.target.value)}
                placeholder="Nome"
                className="h-10 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                required
              />
              <input
                type="email"
                value={createUserEmail}
                onChange={(event) => setCreateUserEmail(event.target.value)}
                placeholder="E-mail"
                className="h-10 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                required
              />
              <select
                value={createUserRole}
                onChange={(event) => setCreateUserRole(event.target.value as "admin" | "user")}
                className="h-10 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <input
                type="password"
                value={createUserPassword}
                onChange={(event) => setCreateUserPassword(event.target.value)}
                placeholder="Senha inicial (opcional)"
                className="h-10 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
              />
              <button
                type="submit"
                disabled={isCreatingUser}
                className="btn-base btn-primary h-10 px-4 disabled:opacity-60"
              >
                {isCreatingUser ? "Criando..." : "Criar"}
              </button>
            </form>

            {adminError && (
              <p className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                {adminError}
              </p>
            )}
            {adminFeedback && (
              <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
                {adminFeedback}
              </p>
            )}

            <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border-color)]">
              <table className="min-w-full text-sm">
                <thead className="bg-[var(--bg-subtle)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--text-primary)]">Nome</th>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--text-primary)]">E-mail</th>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--text-primary)]">Papel</th>
                    <th className="px-3 py-2 text-left font-semibold text-[color:var(--text-primary)]">Acoes</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingUsers ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-gray-500 dark:text-gray-400">
                        Carregando usuarios...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-gray-500 dark:text-gray-400">
                        Nenhum usuario encontrado.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isEditing = editingUserId === user.id;
                      return (
                        <tr key={user.id} className="border-t border-[var(--border-color)]">
                          <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                            {isEditing ? (
                              <input
                                value={editUserName}
                                onChange={(event) => setEditUserName(event.target.value)}
                                className="h-9 w-full rounded-md border border-district-border bg-white px-2 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                              />
                            ) : (
                              user.name
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {isEditing ? (
                              <input
                                type="email"
                                value={editUserEmail}
                                onChange={(event) => setEditUserEmail(event.target.value)}
                                className="h-9 w-full rounded-md border border-district-border bg-white px-2 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                              />
                            ) : (
                              user.email
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {isEditing ? (
                              <select
                                value={editUserRole}
                                onChange={(event) => setEditUserRole(event.target.value as "admin" | "user")}
                                className="h-9 rounded-md border border-district-border bg-white px-2 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            ) : (
                              user.role
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-2">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => void handleSaveUserEdit(user.id)}
                                    disabled={isSavingUserEdit}
                                    className="btn-base btn-secondary h-7 rounded-md px-2 py-1 text-xs"
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingUserId(null)}
                                    className="btn-base btn-ghost h-7 rounded-md px-2 py-1 text-xs"
                                  >
                                    Cancelar
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => startEditingUser(user)}
                                    className="btn-base btn-secondary h-7 rounded-md px-2 py-1 text-xs"
                                  >
                                    Editar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleResetPassword(user.id, user.name)}
                                    className="btn-base btn-secondary h-7 rounded-md px-2 py-1 text-xs"
                                  >
                                    Reset senha
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteUser(user.id, user.name)}
                                    className="btn-base btn-danger h-7 rounded-md px-2 py-1 text-xs"
                                  >
                                    Excluir
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardBase>
        )}
      </div>
    </MainLayout>
  );
}
