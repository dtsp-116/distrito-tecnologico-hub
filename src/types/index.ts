export type EditalStatus = "aberto" | "encerrado" | "em_breve";

export interface Agencia {
  id: string;
  nome: string;
  sigla: string;
  descricao: string;
}

export interface Topico {
  id: string;
  nome: string;
}

export interface Usuario {
  id: string;
  nome: string;
  papel: "admin" | "analista" | "colaborador";
  avatarUrl?: string;
}

export interface ArquivoEdital {
  id: string;
  nome: string;
  tamanho: string;
}

export interface Edital {
  id: string;
  nome: string;
  agenciaId: string;
  linkAcesso?: string;
  valorMinimo?: number;
  valorMaximo?: number;
  trlMinimo?: number;
  trlMaximo?: number;
  status: EditalStatus;
  dataPublicacao: string;
  dataLimite: string;
  resumo: string;
  descricao: string;
  topicos: string[];
  arquivos: ArquivoEdital[];
}

export interface MensagemChat {
  id: string;
  usuario: string;
  conteudo: string;
  horario: string;
}
