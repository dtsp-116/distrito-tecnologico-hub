"use client";

import { useCallback, useEffect, useState } from "react";
import { Agencia, Edital, EditalStatus, Topico } from "@/types";
import type { UploadedFilePreview } from "@/lib/data/hubRepository";

interface CreateAgencyPayload {
  nome: string;
  sigla: string;
  descricao: string;
}

interface CreateEditalPayload {
  nome: string;
  agenciaId: string;
  linkAcesso: string;
  valorMinimo?: number | null;
  valorMaximo?: number | null;
  trlMinimo?: number | null;
  trlMaximo?: number | null;
  status: EditalStatus;
  dataPublicacao: string;
  dataLimite: string;
  resumo: string;
  descricao: string;
  topicos: string[];
}

interface NoticeFileRow {
  id: string;
  noticeId: string;
  fileName: string;
  displayName: string;
  sizeKb: number;
  createdAt: string;
}

interface UploadFileInput {
  file: File;
  displayName: string;
}

export function useAdminPanel() {
  const [agencias, setAgencias] = useState<Agencia[]>([]);
  const [editais, setEditais] = useState<Edital[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/bootstrap");
      if (!response.ok) {
        throw new Error("Falha ao carregar dados administrativos.");
      }
      const data = (await response.json()) as {
        agencias: Agencia[];
        editais: Edital[];
        topicos: Topico[];
        uploadedFiles: UploadedFilePreview[];
      };
      setAgencias(data.agencias);
      setEditais(data.editais);
      setTopicos(data.topicos);
      setUploadedFiles(data.uploadedFiles);
    } catch {
      setError("Nao foi possivel carregar os dados do admin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createAgency = async (payload: CreateAgencyPayload) => {
    const response = await fetch("/api/admin/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error("Falha ao cadastrar agencia.");
    }
    await reload();
  };

  const createEdital = async (payload: CreateEditalPayload) => {
    const response = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        tags: payload.topicos
      })
    });
    if (!response.ok) {
      throw new Error("Falha ao cadastrar edital.");
    }
    await reload();
  };

  const updateEdital = async (editalId: string, payload: CreateEditalPayload) => {
    const response = await fetch(`/api/admin/notices/${editalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        tags: payload.topicos
      })
    });
    if (!response.ok) {
      throw new Error("Falha ao atualizar edital.");
    }
    await reload();
  };

  const deleteEdital = async (editalId: string) => {
    const response = await fetch(`/api/admin/notices/${editalId}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir edital.");
    }
    await reload();
  };

  const listNoticeFiles = useCallback(async (editalId: string): Promise<NoticeFileRow[]> => {
    const response = await fetch(`/api/admin/notices/${editalId}/files`);
    if (!response.ok) {
      throw new Error("Falha ao carregar arquivos do edital.");
    }
    const data = (await response.json()) as { files: NoticeFileRow[] };
    return data.files;
  }, []);

  const uploadFilesToEdital = async (editalId: string, files: UploadFileInput[]) => {
    const formData = new FormData();
    files.forEach((item) => formData.append("files", item.file));
    formData.append("displayNames", JSON.stringify(files.map((item) => item.displayName)));

    const response = await fetch(`/api/admin/notices/${editalId}/files`, {
      method: "POST",
      body: formData
    });
    if (!response.ok) {
      throw new Error("Falha ao vincular arquivos.");
    }
    await reload();
  };

  const renameNoticeFile = async (editalId: string, fileId: string, displayName: string) => {
    const response = await fetch(`/api/admin/notices/${editalId}/files/${fileId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName })
    });
    if (!response.ok) {
      throw new Error("Falha ao renomear arquivo.");
    }
  };

  const deleteNoticeFile = async (editalId: string, fileId: string) => {
    const response = await fetch(`/api/admin/notices/${editalId}/files/${fileId}`, { method: "DELETE" });
    if (!response.ok) {
      throw new Error("Falha ao excluir arquivo.");
    }
    await reload();
  };

  return {
    agencias,
    editais,
    uploadedFiles,
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
    reload
  };
}
