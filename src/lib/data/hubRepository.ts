import { Agencia, ArquivoEdital, Edital, Topico } from "@/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface HubData {
  agencias: Agencia[];
  editais: Edital[];
  topicos: Topico[];
}

export interface UploadedFilePreview {
  id: string;
  editalId: string;
  editalNome: string;
  nomeArquivo: string;
  nomeExibicao: string;
  tamanhoKb: number;
  enviadoEm: string;
}

function formatFileSize(sizeBytes: number) {
  const sizeKb = sizeBytes / 1024;
  if (sizeKb < 1024) return `${Math.max(1, Math.round(sizeKb))} KB`;
  return `${(sizeKb / 1024).toFixed(1)} MB`;
}

export async function getHubData(): Promise<HubData> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return { agencias: [], editais: [], topicos: [] };
    }

    const supabase = await createSupabaseServerClient();

    const [agenciesResult, tagsResult, noticeTagsResult, noticeFilesResult] = await Promise.all([
      supabase.from("agencies").select("id,name,acronym,description"),
      supabase.from("tags").select("id,name"),
      supabase.from("notice_tags").select("notice_id,tag_id"),
      supabase.from("notice_files").select("id,notice_id,file_name,size_bytes")
    ]);

    if (agenciesResult.error || tagsResult.error || noticeTagsResult.error || noticeFilesResult.error) {
      return { agencias: [], editais: [], topicos: [] };
    }

    // Tenta primeiro schema completo; se colunas novas ainda nao existirem, volta para schema base.
    const noticesWithRanges = await supabase
      .from("notices")
      .select(
        "id,title,agency_id,status,publish_date,deadline_date,summary,description,access_link,budget_min,budget_max,trl_min,trl_max"
      );
    const noticesFallback = !noticesWithRanges.error
      ? null
      : await supabase
          .from("notices")
          .select("id,title,agency_id,status,publish_date,deadline_date,summary,description,access_link");

    if (noticesWithRanges.error && noticesFallback?.error) {
      return { agencias: [], editais: [], topicos: [] };
    }

    const noticesData = (noticesWithRanges.data ?? noticesFallback?.data ?? []) as Array<{
      id: string;
      title: string;
      agency_id: string;
      status: "aberto" | "encerrado" | "em_breve";
      publish_date: string;
      deadline_date: string;
      summary: string;
      description: string;
      access_link: string | null;
      budget_min?: number | string | null;
      budget_max?: number | string | null;
      trl_min?: number | string | null;
      trl_max?: number | string | null;
    }>;

    const agencias: Agencia[] = (agenciesResult.data ?? []).map((agency) => ({
      id: agency.id,
      nome: agency.name,
      sigla: agency.acronym,
      descricao: agency.description
    }));

    const topicos: Topico[] = (tagsResult.data ?? []).map((tag) => ({
      id: tag.id,
      nome: tag.name
    }));

    const tagNameById = new Map<string, string>();
    (tagsResult.data ?? []).forEach((tag) => {
      tagNameById.set(tag.id, tag.name);
    });

    const tagsByNotice = new Map<string, string[]>();
    (noticeTagsResult.data ?? []).forEach((row) => {
      const existing = tagsByNotice.get(row.notice_id) ?? [];
      const tagName = tagNameById.get(row.tag_id);
      if (!tagName) return;
      tagsByNotice.set(row.notice_id, [...existing, tagName]);
    });

    const filesByNotice = new Map<string, ArquivoEdital[]>();
    (noticeFilesResult.data ?? []).forEach((file) => {
      const mappedFile: ArquivoEdital = {
        id: file.id,
        nome: file.file_name,
        tamanho: formatFileSize(file.size_bytes ?? 0)
      };
      const existing = filesByNotice.get(file.notice_id) ?? [];
      filesByNotice.set(file.notice_id, [...existing, mappedFile]);
    });

    const editais: Edital[] = noticesData.map((notice) => ({
      id: notice.id,
      nome: notice.title,
      agenciaId: notice.agency_id,
      linkAcesso: notice.access_link ?? undefined,
      valorMinimo: notice.budget_min !== null ? Number(notice.budget_min) : undefined,
      valorMaximo: notice.budget_max !== null ? Number(notice.budget_max) : undefined,
      trlMinimo: notice.trl_min !== null ? Number(notice.trl_min) : undefined,
      trlMaximo: notice.trl_max !== null ? Number(notice.trl_max) : undefined,
      status: notice.status,
      dataPublicacao: notice.publish_date,
      dataLimite: notice.deadline_date,
      resumo: notice.summary,
      descricao: notice.description,
      topicos: tagsByNotice.get(notice.id) ?? [],
      arquivos: filesByNotice.get(notice.id) ?? []
    }));

    return { agencias, editais, topicos };
  } catch {
    return { agencias: [], editais: [], topicos: [] };
  }
}

export async function getAdminUploadedFiles(): Promise<UploadedFilePreview[]> {
  try {
    const supabase = await createSupabaseServerClient();
    const [noticesResult, filesWithDisplay] = await Promise.all([
      supabase.from("notices").select("id,title"),
      supabase
        .from("notice_files")
        .select("id,notice_id,file_name,display_name,size_bytes,created_at")
        .order("created_at", {
          ascending: false
        })
    ]);

    const filesFallback =
      filesWithDisplay.error && filesWithDisplay.error.message.includes("display_name")
        ? await supabase
            .from("notice_files")
            .select("id,notice_id,file_name,size_bytes,created_at")
            .order("created_at", { ascending: false })
        : null;

    if (noticesResult.error || (filesWithDisplay.error && !filesFallback) || filesFallback?.error) return [];

    const noticeNameById = new Map<string, string>();
    (noticesResult.data ?? []).forEach((notice) => {
      noticeNameById.set(notice.id, notice.title);
    });

    const files = (filesWithDisplay.data ?? filesFallback?.data ?? []) as Array<{
      id: string;
      notice_id: string;
      file_name: string;
      display_name?: string | null;
      size_bytes: number;
      created_at: string;
    }>;

    return files.map((file) => ({
      id: file.id,
      editalId: file.notice_id,
      editalNome: noticeNameById.get(file.notice_id) ?? "Edital",
      nomeArquivo: file.file_name,
      nomeExibicao: file.display_name ?? file.file_name,
      tamanhoKb: Math.max(1, Math.round((file.size_bytes ?? 0) / 1024)),
      enviadoEm: new Date(file.created_at ?? new Date().toISOString()).toLocaleString("pt-BR")
    }));
  } catch {
    return [];
  }
}
