"use client";

import { useMemo } from "react";
import { Agencia, Edital, EditalStatus, Topico } from "@/types";

interface FilterState {
  termoBusca: string;
  agenciaId: string;
  status: EditalStatus | "";
  topicoId: string;
}

interface UseEditaisFiltroArgs {
  editais: Edital[];
  agencias: Agencia[];
  topicos: Topico[];
  filtros: FilterState;
}

export function useEditaisFiltro({ editais, agencias, topicos, filtros }: UseEditaisFiltroArgs) {
  const filtered = useMemo(() => {
    return editais.filter((item) => {
      const agencia = agencias.find((ag) => ag.id === item.agenciaId);
      const selectedTopicName = topicos.find((tp) => tp.id === filtros.topicoId)?.nome.toLowerCase();
      const editalTopicos = topicos.filter(
        (tp) =>
          item.topicos.includes(tp.id) ||
          item.topicos.some((topico) => topico.toLowerCase() === tp.nome.toLowerCase())
      );

      const matchesSearch =
        filtros.termoBusca.length === 0 ||
        item.nome.toLowerCase().includes(filtros.termoBusca.toLowerCase()) ||
        item.resumo.toLowerCase().includes(filtros.termoBusca.toLowerCase()) ||
        agencia?.sigla.toLowerCase().includes(filtros.termoBusca.toLowerCase()) ||
        editalTopicos.some((tp) => tp.nome.toLowerCase().includes(filtros.termoBusca.toLowerCase())) ||
        item.topicos.some((topico) => topico.toLowerCase().includes(filtros.termoBusca.toLowerCase()));

      const matchesAgency = filtros.agenciaId.length === 0 || item.agenciaId === filtros.agenciaId;
      const matchesStatus = filtros.status.length === 0 || item.status === filtros.status;
      const matchesTopic =
        filtros.topicoId.length === 0 ||
        item.topicos.includes(filtros.topicoId) ||
        (selectedTopicName ? item.topicos.some((topico) => topico.toLowerCase() === selectedTopicName) : false);

      return matchesSearch && matchesAgency && matchesStatus && matchesTopic;
    });
  }, [agencias, editais, filtros, topicos]);

  return filtered;
}
