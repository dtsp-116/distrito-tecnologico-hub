"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import { EditalStatus } from "@/types";
import { useAdminPanel } from "@/features/admin/useAdminPanel";

const statusOptions: { value: EditalStatus; label: string }[] = [
  { value: "aberto", label: "Aberto" },
  { value: "encerrado", label: "Encerrado" },
  { value: "em_breve", label: "Em breve" }
];

interface UploadFileInput {
  file: File;
  displayName: string;
}

interface NoticeFileRow {
  id: string;
  noticeId: string;
  fileName: string;
  displayName: string;
  sizeKb: number;
  createdAt: string;
}

const FILES_PAGE_SIZE = 8;

function getEmptyNoticeForm() {
  return {
    nome: "",
    agenciaId: "",
    linkAcesso: "",
    valorMinimo: "",
    valorMaximo: "",
    trlMinimo: "",
    trlMaximo: "",
    status: "aberto" as EditalStatus,
    dataPublicacao: "",
    dataLimite: "",
    resumo: "",
    descricao: "",
    topicos: [] as string[]
  };
}

export function AdminPage() {
  const {
    agencias,
    editais,
    topicos,
    isLoading,
    error,
    createAgency,
    createEdital,
    updateEdital,
    deleteEdital,
    listNoticeFiles,
    uploadFilesToEdital,
    renameNoticeFile,
    deleteNoticeFile,
    ragSettings,
    updateRagSettings
  } = useAdminPanel();

  const [activeTab, setActiveTab] = useState<"editais" | "agencias">("editais");
  const [noticeSearch, setNoticeSearch] = useState("");
  const [noticeFilterAgencyId, setNoticeFilterAgencyId] = useState("");
  const [noticeFilterStatus, setNoticeFilterStatus] = useState<EditalStatus | "">("");
  const [selectedNoticeId, setSelectedNoticeId] = useState<string | null>(null);
  const [isCreatingNewNotice, setIsCreatingNewNotice] = useState(false);
  const [agencyForm, setAgencyForm] = useState({ nome: "", sigla: "", descricao: "" });
  const [editalForm, setEditalForm] = useState(getEmptyNoticeForm());
  const [tagInput, setTagInput] = useState("");
  const [pendingFiles, setPendingFiles] = useState<UploadFileInput[]>([]);
  const [noticeFiles, setNoticeFiles] = useState<NoticeFileRow[]>([]);
  const [noticeFileSearch, setNoticeFileSearch] = useState("");
  const [filesPage, setFilesPage] = useState(1);
  const [isFilesLoading, setIsFilesLoading] = useState(false);
  const [isSavingNotice, setIsSavingNotice] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [isSavingRagSettings, setIsSavingRagSettings] = useState(false);
  const [localRagLevel, setLocalRagLevel] = useState<"baixo" | "medio" | "alto">("medio");
  const [localLegacyFallback, setLocalLegacyFallback] = useState(true);

  const agencyOptions = useMemo(
    () => agencias.map((agencia) => ({ value: agencia.id, label: `${agencia.sigla} - ${agencia.nome}` })),
    [agencias]
  );

  const topicoNomePorId = useMemo(() => {
    const map = new Map<string, string>();
    topicos.forEach((topico) => {
      map.set(topico.id, topico.nome);
    });
    return map;
  }, [topicos]);

  const filteredNotices = useMemo(() => {
    const query = noticeSearch.trim().toLowerCase();
    return editais.filter((edital) => {
      const matchesQuery =
        !query ||
        edital.nome.toLowerCase().includes(query) ||
        edital.resumo.toLowerCase().includes(query) ||
        edital.status.toLowerCase().includes(query);
      const matchesAgency = !noticeFilterAgencyId || edital.agenciaId === noticeFilterAgencyId;
      const matchesStatus = !noticeFilterStatus || edital.status === noticeFilterStatus;
      return matchesQuery && matchesAgency && matchesStatus;
    });
  }, [editais, noticeSearch, noticeFilterAgencyId, noticeFilterStatus]);

  const selectedNotice = useMemo(
    () => editais.find((item) => item.id === selectedNoticeId) ?? null,
    [editais, selectedNoticeId]
  );

  const filteredNoticeFiles = useMemo(() => {
    const query = noticeFileSearch.trim().toLowerCase();
    if (!query) return noticeFiles;
    return noticeFiles.filter((file) => file.displayName.toLowerCase().includes(query) || file.fileName.toLowerCase().includes(query));
  }, [noticeFiles, noticeFileSearch]);

  const totalFilesPages = Math.max(1, Math.ceil(filteredNoticeFiles.length / FILES_PAGE_SIZE));
  const paginatedFiles = useMemo(() => {
    const start = (filesPage - 1) * FILES_PAGE_SIZE;
    return filteredNoticeFiles.slice(start, start + FILES_PAGE_SIZE);
  }, [filteredNoticeFiles, filesPage]);

  useEffect(() => {
    setLocalRagLevel(ragSettings.searchLevel);
    setLocalLegacyFallback(ragSettings.useLegacyFallback);
  }, [ragSettings]);

  useEffect(() => {
    if (!selectedNoticeId && !isCreatingNewNotice && editais.length > 0) setSelectedNoticeId(editais[0].id);
  }, [editais, selectedNoticeId, isCreatingNewNotice]);

  useEffect(() => {
    if (!selectedNotice) return;
    setEditalForm({
      nome: selectedNotice.nome,
      agenciaId: selectedNotice.agenciaId,
      linkAcesso: selectedNotice.linkAcesso ?? "",
      valorMinimo: selectedNotice.valorMinimo !== undefined ? String(selectedNotice.valorMinimo) : "",
      valorMaximo: selectedNotice.valorMaximo !== undefined ? String(selectedNotice.valorMaximo) : "",
      trlMinimo: selectedNotice.trlMinimo !== undefined ? String(selectedNotice.trlMinimo) : "",
      trlMaximo: selectedNotice.trlMaximo !== undefined ? String(selectedNotice.trlMaximo) : "",
      status: selectedNotice.status,
      dataPublicacao: selectedNotice.dataPublicacao,
      dataLimite: selectedNotice.dataLimite,
      resumo: selectedNotice.resumo,
      descricao: selectedNotice.descricao,
      topicos: selectedNotice.topicos.map((topico) => topicoNomePorId.get(topico) ?? topico)
    });
  }, [selectedNotice, topicoNomePorId]);

  useEffect(() => {
    if (!selectedNoticeId) return;
    const loadFiles = async () => {
      setIsFilesLoading(true);
      try {
        const files = await listNoticeFiles(selectedNoticeId);
        setNoticeFiles(files);
      } catch {
        setNoticeFiles([]);
        setFeedback("Nao foi possivel carregar os arquivos deste edital.");
      } finally {
        setIsFilesLoading(false);
      }
    };
    void loadFiles();
  }, [selectedNoticeId, listNoticeFiles]);

  useEffect(() => {
    if (selectedNoticeId) return;
    setNoticeFiles([]);
    setPendingFiles([]);
  }, [selectedNoticeId]);

  const handleAgencySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!agencyForm.nome.trim() || !agencyForm.sigla.trim() || !agencyForm.descricao.trim()) return;
    try {
      await createAgency(agencyForm);
      setAgencyForm({ nome: "", sigla: "", descricao: "" });
      setFeedback("Agencia cadastrada com sucesso.");
    } catch {
      setFeedback("Erro ao cadastrar agencia.");
    }
  };

  const handleEditalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editalForm.nome.trim() || !editalForm.agenciaId || !editalForm.dataPublicacao || !editalForm.dataLimite || !editalForm.resumo.trim() || !editalForm.descricao.trim()) {
      return;
    }
    setIsSavingNotice(true);
    const payload = {
      ...editalForm,
      valorMinimo: editalForm.valorMinimo ? Number(editalForm.valorMinimo) : null,
      valorMaximo: editalForm.valorMaximo ? Number(editalForm.valorMaximo) : null,
      trlMinimo: editalForm.trlMinimo ? Number(editalForm.trlMinimo) : null,
      trlMaximo: editalForm.trlMaximo ? Number(editalForm.trlMaximo) : null
    };
    try {
      if (selectedNoticeId) {
        await updateEdital(selectedNoticeId, payload);
        setFeedback("Edital atualizado com sucesso.");
      } else {
        await createEdital(payload);
        setIsCreatingNewNotice(false);
        setFeedback("Edital cadastrado com sucesso.");
      }
    } catch {
      setFeedback("Erro ao salvar edital.");
    } finally {
      setIsSavingNotice(false);
    }
  };

  const handleAutofillFromLink = async () => {
    if (!editalForm.linkAcesso.trim()) return setFeedback("Informe o link do edital para usar o autopreenchimento.");
    setIsAutofilling(true);
    try {
      const response = await fetch("/api/admin/notices/autofill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: editalForm.linkAcesso.trim() })
      });
      if (!response.ok) throw new Error();
      const data = (await response.json()) as {
        nome: string; resumo: string; descricao: string; status: EditalStatus; dataPublicacao: string; dataLimite: string;
        tags: string[]; valorMinimo: number | null; valorMaximo: number | null; trlMinimo: number | null; trlMaximo: number | null;
      };
      setEditalForm((prev) => ({
        ...prev,
        nome: data.nome || prev.nome,
        resumo: data.resumo || prev.resumo,
        descricao: data.descricao || prev.descricao,
        status: data.status || prev.status,
        dataPublicacao: data.dataPublicacao || prev.dataPublicacao,
        dataLimite: data.dataLimite || prev.dataLimite,
        valorMinimo: data.valorMinimo !== null ? String(data.valorMinimo) : prev.valorMinimo,
        valorMaximo: data.valorMaximo !== null ? String(data.valorMaximo) : prev.valorMaximo,
        trlMinimo: data.trlMinimo !== null ? String(data.trlMinimo) : prev.trlMinimo,
        trlMaximo: data.trlMaximo !== null ? String(data.trlMaximo) : prev.trlMaximo,
        topicos: data.tags?.length ? Array.from(new Set(data.tags.map((tag) => tag.trim()).filter(Boolean))) : prev.topicos
      }));
      setFeedback("Campos sugeridos pela IA preenchidos. Revise antes de salvar.");
    } catch {
      setFeedback("Nao foi possivel extrair informacoes do link com IA.");
    } finally {
      setIsAutofilling(false);
    }
  };

  const handleUploadFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).map((file) => ({ file, displayName: file.name.replace(/\.[^/.]+$/, "") }));
    setPendingFiles(files);
  };

  const handleUploadSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedNoticeId || pendingFiles.length === 0) return;
    setIsUploadingFiles(true);
    try {
      await uploadFilesToEdital(selectedNoticeId, pendingFiles);
      setPendingFiles([]);
      setNoticeFiles(await listNoticeFiles(selectedNoticeId));
      setFeedback("Arquivos vinculados ao edital com sucesso.");
    } catch {
      setFeedback("Erro ao vincular arquivos.");
    } finally {
      setIsUploadingFiles(false);
    }
  };

  const handleSaveRagSettings = async () => {
    setIsSavingRagSettings(true);
    try {
      await updateRagSettings({
        searchLevel: localRagLevel,
        useLegacyFallback: localLegacyFallback
      });
      setFeedback("Configuracoes de busca do RAG salvas.");
    } catch {
      setFeedback("Erro ao salvar configuracoes de busca do RAG.");
    } finally {
      setIsSavingRagSettings(false);
    }
  };

  return (
    <MainLayout agencias={agencias} isAdminRoute>
      <div className="space-y-5">
        <section className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900 md:p-5">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Painel do administrador</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Fluxo otimizado para criar, editar e excluir editais com arquivos e RAG.</p>
          <div className="mt-4 grid gap-3 rounded-md border border-district-border p-3 dark:border-gray-700">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Nivel da busca RAG
              </label>
              <div className="inline-flex rounded-md border border-district-border bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800/80">
                {(["baixo", "medio", "alto"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setLocalRagLevel(level)}
                    aria-pressed={localRagLevel === level}
                    className={`h-8 rounded px-3 text-xs font-semibold uppercase tracking-wide transition ${
                      localRagLevel === level
                        ? "bg-district-red text-white shadow-sm"
                        : "text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                {localRagLevel === "baixo"
                  ? "Busca mais estrita e focada."
                  : localRagLevel === "medio"
                    ? "Equilibrio entre precisao e abrangencia."
                    : "Busca mais ampla para maior cobertura."}
              </p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <input
                type="checkbox"
                checked={localLegacyFallback}
                onChange={(event) => setLocalLegacyFallback(event.target.checked)}
                className="peer sr-only"
              />
              <span className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-300 transition peer-checked:bg-district-red dark:bg-gray-700">
                <span className="h-4 w-4 translate-x-0.5 rounded-full bg-white shadow-sm transition peer-checked:translate-x-4" />
              </span>
              Fallback lexical/simples
            </label>
            <button
              type="button"
              onClick={handleSaveRagSettings}
              disabled={isSavingRagSettings}
              className="h-10 rounded-md border border-district-border px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
            >
              {isSavingRagSettings ? "Salvando..." : "Salvar RAG"}
            </button>
          </div>
          {isLoading && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando dados...</p>}
          {error && <p className="mt-3 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">{error}</p>}
          {feedback && <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">{feedback}</p>}
        </section>

        <div className="flex gap-2">
          <button type="button" onClick={() => setActiveTab("editais")} className={`h-10 rounded-md px-4 text-sm font-semibold ${activeTab === "editais" ? "bg-district-red text-white" : "border border-district-border text-gray-700 dark:border-gray-700 dark:text-gray-200"}`}>Gestao de editais</button>
          <button type="button" onClick={() => setActiveTab("agencias")} className={`h-10 rounded-md px-4 text-sm font-semibold ${activeTab === "agencias" ? "bg-district-red text-white" : "border border-district-border text-gray-700 dark:border-gray-700 dark:text-gray-200"}`}>Gestao de agencias</button>
        </div>

        {activeTab === "agencias" ? (
          <section className="grid gap-5 xl:grid-cols-2">
            <form onSubmit={handleAgencySubmit} className="space-y-3 rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900 md:p-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Cadastrar agencia</h2>
              <input value={agencyForm.nome} onChange={(event) => setAgencyForm((prev) => ({ ...prev, nome: event.target.value }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Nome da agencia" required />
              <input value={agencyForm.sigla} onChange={(event) => setAgencyForm((prev) => ({ ...prev, sigla: event.target.value }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Sigla" required />
              <textarea value={agencyForm.descricao} onChange={(event) => setAgencyForm((prev) => ({ ...prev, descricao: event.target.value }))} className="min-h-28 w-full rounded-md border border-district-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Descricao" required />
              <button type="submit" className="h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white">Salvar agencia</button>
            </form>

            <section className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900 md:p-5">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Agencias cadastradas</h2>
              <ul className="mt-3 space-y-2">{agencias.map((agencia) => <li key={agencia.id} className="rounded-md border border-district-border px-3 py-2 text-sm dark:border-gray-700"><p className="font-medium text-gray-900 dark:text-gray-100">{agencia.sigla}</p><p className="text-gray-600 dark:text-gray-300">{agencia.nome}</p></li>)}</ul>
            </section>
          </section>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900">
              <div className="mb-3 flex gap-2">
                <input value={noticeSearch} onChange={(event) => setNoticeSearch(event.target.value)} placeholder="Buscar edital..." className="h-10 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" />
                <button type="button" onClick={() => { setIsCreatingNewNotice(true); setSelectedNoticeId(null); setEditalForm(getEmptyNoticeForm()); setTagInput(""); setNoticeFileSearch(""); }} className="h-10 rounded-md border border-district-border px-3 text-sm font-semibold">Novo</button>
              </div>
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                <select
                  value={noticeFilterAgencyId}
                  onChange={(event) => setNoticeFilterAgencyId(event.target.value)}
                  className="h-10 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                >
                  <option value="">Todas as agencias</option>
                  {agencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={noticeFilterStatus}
                  onChange={(event) => setNoticeFilterStatus(event.target.value as EditalStatus | "")}
                  className="h-10 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                >
                  <option value="">Todos os status</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {(noticeSearch || noticeFilterAgencyId || noticeFilterStatus) && (
                <button
                  type="button"
                  onClick={() => {
                    setNoticeSearch("");
                    setNoticeFilterAgencyId("");
                    setNoticeFilterStatus("");
                  }}
                  className="mb-3 h-9 rounded-md border border-district-border px-3 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200"
                >
                  Limpar filtros
                </button>
              )}
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">{filteredNotices.length} edital(is) encontrado(s)</p>
              <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {filteredNotices.map((edital) => (
                  <button key={edital.id} type="button" onClick={() => { setIsCreatingNewNotice(false); setSelectedNoticeId(edital.id); }} className={`w-full rounded-md border px-3 py-2 text-left ${selectedNoticeId === edital.id ? "border-district-red bg-red-50 dark:bg-red-950/20" : "border-district-border hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"}`}>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{edital.nome}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{edital.status}</p>
                  </button>
                ))}
              </div>
            </aside>

            <div className="space-y-5">
              <form onSubmit={handleEditalSubmit} className="space-y-3 rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{selectedNoticeId ? "Editar edital" : "Novo edital"}</h2>
                  <div className="flex gap-2">
                    {selectedNoticeId && <button type="button" onClick={async () => { if (window.confirm("Excluir este edital?")) { await deleteEdital(selectedNoticeId); setIsCreatingNewNotice(true); setSelectedNoticeId(null); setEditalForm(getEmptyNoticeForm()); setFeedback("Edital excluido com sucesso."); } }} className="h-9 rounded-md border border-red-300 px-3 text-sm font-semibold text-red-700 dark:border-red-800 dark:text-red-300">Excluir</button>}
                    <button type="submit" disabled={isSavingNotice} className="h-9 rounded-md bg-district-red px-4 text-sm font-semibold text-white disabled:opacity-60">{isSavingNotice ? "Salvando..." : "Salvar"}</button>
                  </div>
                </div>

                <input value={editalForm.nome} onChange={(event) => setEditalForm((prev) => ({ ...prev, nome: event.target.value }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Nome do edital" required />
                <div className="flex items-center gap-2">
                  <input type="url" value={editalForm.linkAcesso} onChange={(event) => setEditalForm((prev) => ({ ...prev, linkAcesso: event.target.value }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Link de acesso do edital (https://...)" />
                  <button
                    type="button"
                    onClick={handleAutofillFromLink}
                    disabled={isAutofilling}
                    aria-label={isAutofilling ? "Lendo link com IA" : "Preencher a partir do link com IA"}
                    title={isAutofilling ? "Lendo link com IA" : "Preencher a partir do link com IA"}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-district-border text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800"
                  >
                    {isAutofilling ? (
                      <span className="text-[10px] font-medium">...</span>
                    ) : (
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 3l1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4L12 3z" />
                        <path d="M5 14l.9 2.1L8 17l-2.1.9L5 20l-.9-2.1L2 17l2.1-.9L5 14z" />
                        <path d="M18 13l.9 2.1L21 16l-2.1.9L18 19l-.9-2.1L15 16l2.1-.9L18 13z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <select value={editalForm.agenciaId} onChange={(event) => setEditalForm((prev) => ({ ...prev, agenciaId: event.target.value }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" required>
                    <option value="">Selecione a agencia</option>{agencyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <select value={editalForm.status} onChange={(event) => setEditalForm((prev) => ({ ...prev, status: event.target.value as EditalStatus }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100">
                    {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input type="date" value={editalForm.dataPublicacao} onChange={(event) => setEditalForm((prev) => ({ ...prev, dataPublicacao: event.target.value }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" required />
                  <input type="date" value={editalForm.dataLimite} onChange={(event) => setEditalForm((prev) => ({ ...prev, dataLimite: event.target.value }))} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" required />
                </div>

                <textarea value={editalForm.resumo} onChange={(event) => setEditalForm((prev) => ({ ...prev, resumo: event.target.value }))} className="min-h-20 w-full rounded-md border border-district-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Resumo curto" required />
                <textarea value={editalForm.descricao} onChange={(event) => setEditalForm((prev) => ({ ...prev, descricao: event.target.value }))} className="min-h-28 w-full rounded-md border border-district-border bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Descricao completa" required />

                <div>
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-200">Tags</p>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={(event) => setTagInput(event.target.value)} className="h-11 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Ex.: IA aplicada, ESG, Bioeconomia" />
                    <button type="button" onClick={() => { const t = tagInput.trim(); if (!t) return; if (!editalForm.topicos.some((item) => item.toLowerCase() === t.toLowerCase())) setEditalForm((prev) => ({ ...prev, topicos: [...prev.topicos, t] })); setTagInput(""); }} className="h-11 rounded-md border border-district-border px-4 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-100">Adicionar</button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">{editalForm.topicos.map((tag) => <button key={tag} type="button" onClick={() => setEditalForm((prev) => ({ ...prev, topicos: prev.topicos.filter((t) => t !== tag) }))} className="inline-flex items-center rounded-full border border-district-border bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">{tag} ✕</button>)}</div>
                </div>
              </form>

              {selectedNoticeId ? (
                <section className="space-y-3 rounded-mdx border border-district-border bg-white p-4 shadow-card dark:border-gray-700 dark:bg-gray-900 md:p-5">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Arquivos do edital</h3>
                  <form onSubmit={handleUploadSubmit} className="space-y-3">
                    <input type="file" multiple onChange={handleUploadFileInput} className="block w-full rounded-md border border-district-border bg-white px-3 py-2 text-sm text-gray-800 file:mr-3 file:rounded-md file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-district-red dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:file:bg-red-900/30 dark:file:text-red-200" />
                    {pendingFiles.map((item, index) => (
                      <div key={`${item.file.name}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_1fr]">
                        <p className="truncate rounded-md border border-district-border px-3 py-2 text-sm dark:border-gray-700">{item.file.name}</p>
                        <input value={item.displayName} onChange={(event) => setPendingFiles((prev) => prev.map((entry, i) => i === index ? { ...entry, displayName: event.target.value } : entry))} className="h-10 rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" placeholder="Nome de exibicao" />
                      </div>
                    ))}
                    <button type="submit" disabled={isUploadingFiles || pendingFiles.length === 0} className="h-10 rounded-md bg-district-red px-4 text-sm font-semibold text-white disabled:opacity-60">{isUploadingFiles ? "Enviando..." : "Adicionar arquivos"}</button>
                  </form>

                  <div className="flex items-center justify-between gap-2">
                    <input value={noticeFileSearch} onChange={(event) => { setNoticeFileSearch(event.target.value); setFilesPage(1); }} placeholder="Buscar arquivo..." className="h-10 w-full rounded-md border border-district-border bg-white px-3 text-sm text-gray-900 outline-none focus:border-district-red focus:ring-2 focus:ring-red-200 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 sm:max-w-xs" />
                    <p className="text-xs text-gray-500 dark:text-gray-400">{filteredNoticeFiles.length} arquivo(s)</p>
                  </div>

                  <div className="overflow-x-auto rounded-md border border-district-border dark:border-gray-700">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr><th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Nome</th><th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Tamanho</th><th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200">Acoes</th></tr>
                      </thead>
                      <tbody>
                        {isFilesLoading ? (
                          <tr><td colSpan={3} className="px-3 py-3 text-gray-500 dark:text-gray-400">Carregando arquivos...</td></tr>
                        ) : paginatedFiles.length === 0 ? (
                          <tr><td colSpan={3} className="px-3 py-3 text-gray-500 dark:text-gray-400">Nenhum arquivo encontrado.</td></tr>
                        ) : (
                          paginatedFiles.map((file) => (
                            <tr key={file.id} className="border-t border-district-border dark:border-gray-700">
                              <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{file.displayName}</td>
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{file.sizeKb} KB</td>
                              <td className="px-3 py-2">
                                <div className="flex gap-2">
                                  <button type="button" onClick={async () => { const next = window.prompt("Novo nome de exibicao:", file.displayName); if (!next) return; await renameNoticeFile(selectedNoticeId, file.id, next); setNoticeFiles(await listNoticeFiles(selectedNoticeId)); }} className="rounded-md border border-district-border px-2 py-1 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">Renomear</button>
                                  <button type="button" onClick={async () => { if (!window.confirm(`Excluir ${file.displayName}?`)) return; await deleteNoticeFile(selectedNoticeId, file.id); setNoticeFiles(await listNoticeFiles(selectedNoticeId)); }} className="rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:text-red-300">Excluir</button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {totalFilesPages > 1 && (
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" disabled={filesPage <= 1} onClick={() => setFilesPage((prev) => Math.max(1, prev - 1))} className="rounded-md border border-district-border px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200">Anterior</button>
                      <span className="text-xs text-gray-500 dark:text-gray-400">Pagina {filesPage} de {totalFilesPages}</span>
                      <button type="button" disabled={filesPage >= totalFilesPages} onClick={() => setFilesPage((prev) => Math.min(totalFilesPages, prev + 1))} className="rounded-md border border-district-border px-3 py-1 text-xs font-semibold text-gray-700 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200">Proxima</button>
                    </div>
                  )}
                </section>
              ) : (
                <section className="rounded-mdx border border-dashed border-district-border bg-white p-5 text-sm text-gray-600 shadow-card dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                  Salve o edital para habilitar a gestao de arquivos diretamente dentro dele.
                </section>
              )}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
}
