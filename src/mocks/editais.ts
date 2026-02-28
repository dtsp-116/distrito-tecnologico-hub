import { Agencia, Edital, Topico, Usuario } from "@/types";

// Fonte de dados local para simular respostas de API sem backend.
export const agencias: Agencia[] = [
  {
    id: "finep",
    nome: "Financiadora de Estudos e Projetos",
    sigla: "FINEP",
    descricao: "Linhas de fomento para inovação tecnológica e pesquisa aplicada."
  },
  {
    id: "embrapii",
    nome: "Empresa Brasileira de Pesquisa e Inovação Industrial",
    sigla: "EMBRAPII",
    descricao: "Apoio a projetos de inovação com foco industrial e produtividade."
  },
  {
    id: "fundep",
    nome: "Fundação de Desenvolvimento da Pesquisa",
    sigla: "FUNDEP",
    descricao: "Conexão entre universidades, setor produtivo e projetos estratégicos."
  }
];

export const topicos: Topico[] = [
  { id: "ia", nome: "Inteligencia Artificial" },
  { id: "iot", nome: "IoT" },
  { id: "manufatura", nome: "Manufatura Avancada" },
  { id: "energia", nome: "Energia Limpa" },
  { id: "saude", nome: "Saude Digital" },
  { id: "educacao", nome: "EdTech" }
];

export const usuarios: Usuario[] = [
  { id: "u1", nome: "Ana Martins", papel: "analista" },
  { id: "u2", nome: "Carlos Lima", papel: "colaborador" }
];

export const editais: Edital[] = [
  {
    id: "ed-001",
    nome: "Programa de IA para Industria 4.0",
    agenciaId: "finep",
    status: "aberto",
    dataPublicacao: "2026-01-15",
    dataLimite: "2026-04-10",
    resumo: "Fomento para projetos de IA aplicados a linhas produtivas.",
    descricao:
      "Edital voltado a consorcios entre industria e ICTs para desenvolver modelos de IA com ganhos de eficiencia e qualidade.",
    topicos: ["ia", "manufatura"],
    arquivos: [
      { id: "a1", nome: "regulamento-ia-industria.pdf", tamanho: "1.2 MB" },
      { id: "a2", nome: "anexo-criterios.xlsx", tamanho: "420 KB" }
    ]
  },
  {
    id: "ed-002",
    nome: "IoT para Cidades Inteligentes",
    agenciaId: "embrapii",
    status: "em_breve",
    dataPublicacao: "2026-03-01",
    dataLimite: "2026-06-20",
    resumo: "Chamada para solucoes de monitoramento urbano com sensores conectados.",
    descricao:
      "Apoia projetos de IoT para mobilidade, iluminacao e seguranca urbana com parceiros industriais.",
    topicos: ["iot", "energia"],
    arquivos: [{ id: "a3", nome: "termo-referencia-cidades.pdf", tamanho: "950 KB" }]
  },
  {
    id: "ed-003",
    nome: "Saude Digital e Diagnostico Assistido",
    agenciaId: "fundep",
    status: "aberto",
    dataPublicacao: "2026-02-05",
    dataLimite: "2026-05-15",
    resumo: "Projetos de P&D para ferramentas digitais de apoio ao diagnostico.",
    descricao:
      "Financiamento de iniciativas de saude digital com foco em interoperabilidade, seguranca e assistencia remota.",
    topicos: ["saude", "ia"],
    arquivos: [
      { id: "a4", nome: "manual-submissao.pdf", tamanho: "780 KB" },
      { id: "a5", nome: "modelo-plano-trabalho.docx", tamanho: "110 KB" }
    ]
  },
  {
    id: "ed-004",
    nome: "Transicao Energetica em Ambientes Industriais",
    agenciaId: "finep",
    status: "encerrado",
    dataPublicacao: "2025-08-10",
    dataLimite: "2025-11-30",
    resumo: "Projetos para eficiencia energetica e descarbonizacao.",
    descricao:
      "Linha destinada a pilotos de eficiencia energetica, eletrificacao e rastreio de emissao de carbono.",
    topicos: ["energia", "manufatura"],
    arquivos: [{ id: "a6", nome: "resultado-preliminar.pdf", tamanho: "300 KB" }]
  },
  {
    id: "ed-005",
    nome: "Plataformas Educacionais para Formacao Tecnica",
    agenciaId: "fundep",
    status: "aberto",
    dataPublicacao: "2026-01-28",
    dataLimite: "2026-05-30",
    resumo: "Incentivo para tecnologias educacionais aplicadas a formacao profissional.",
    descricao:
      "Apoio para desenvolvimento de plataformas e conteudos imersivos focados em competencias industriais.",
    topicos: ["educacao", "ia"],
    arquivos: [{ id: "a7", nome: "guia-proponente.pdf", tamanho: "640 KB" }]
  },
  {
    id: "ed-006",
    nome: "Automacao Colaborativa para PMEs",
    agenciaId: "embrapii",
    status: "encerrado",
    dataPublicacao: "2025-09-14",
    dataLimite: "2025-12-14",
    resumo: "Chamada para automacao de processos com robotica colaborativa.",
    descricao:
      "Busca ampliar competitividade de pequenas e medias industrias por meio de celulas robotizadas e analise de dados.",
    topicos: ["manufatura", "iot"],
    arquivos: [{ id: "a8", nome: "faq-automacao.pdf", tamanho: "210 KB" }]
  }
];
