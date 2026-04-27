export const ANALYSIS_MODES = [
  "full_check",
  "memorial_only",
  "sheets_only",
  "ld_only",
  "find_text",
  "find_replace",
  "check_address",
  "check_project_number",
  "check_work_name",
] as const;

export type AnalysisMode = (typeof ANALYSIS_MODES)[number];
export const ANALYSIS_MODE_DEFAULT: AnalysisMode = "full_check";

export type AnalysisModeConfigField = {
  description: string;
  key: string;
  label: string;
  placeholder: string;
};

export type AnalysisModeDefinition = {
  configFields: AnalysisModeConfigField[];
  description: string;
  group: string;
  helper: string;
  label: string;
  lockedTipo?: string;
  value: AnalysisMode;
};

export type AnalysisModeGroup = {
  description: string;
  modes: AnalysisModeDefinition[];
  title: string;
};

export type AnalysisModeConfigValues = Record<string, string>;

export const ANALYSIS_MODE_DEFINITIONS: AnalysisModeDefinition[] = [
  {
    configFields: [],
    description: "Confere capa, separatrizes, listas de documentos e pranchas do volume.",
    group: "Fluxo principal",
    helper: "Use para revisar o volume tecnico do projeto antes de liberar o pacote.",
    label: "Volume de projeto",
    value: "full_check",
  },
  {
    configFields: [],
    description: "Confere identidade, endereco, municipio, cliente e sinais textuais do memorial.",
    group: "Fluxo principal",
    helper: "Use quando o envio for apenas memorial ou documento textual equivalente.",
    label: "Memorial",
    lockedTipo: "memorial",
    value: "memorial_only",
  },
  {
    configFields: [],
    description: "Foca a leitura apenas em pranchas e plantas.",
    group: "Recorte por documento",
    helper: "Use quando o material principal do pacote estiver nas pranchas.",
    label: "Analise de pranchas",
    lockedTipo: "prancha",
    value: "sheets_only",
  },
  {
    configFields: [],
    description: "Foca a leitura na lista de documentos enviada.",
    group: "Recorte por documento",
    helper: "Use quando o foco principal estiver na lista de documentos.",
    label: "Lista de documentos (LD)",
    lockedTipo: "ld",
    value: "ld_only",
  },
  {
    configFields: [
      {
        description: "Texto exato que voce quer localizar nos arquivos enviados.",
        key: "query",
        label: "Texto a buscar",
        placeholder: "Ex.: concreto",
      },
    ],
    description: "Procura um texto especifico nos PDFs enviados.",
    group: "Busca textual",
    helper: "Use quando voce quer localizar uma palavra, frase ou termo tecnico.",
    label: "Buscar texto",
    value: "find_text",
  },
  {
    configFields: [
      {
        description: "Texto original que deve ser localizado.",
        key: "find",
        label: "Buscar",
        placeholder: "Ex.: Rua antiga",
      },
      {
        description: "Texto que voce gostaria de colocar no lugar.",
        key: "replace",
        label: "Substituir por",
        placeholder: "Ex.: Avenida nova",
      },
    ],
    description: "Lista onde um texto aparece e mostra a substituicao desejada sem alterar o PDF.",
    group: "Busca textual",
    helper: "Bom para revisar trocas de endereco, nomes ou termos repetidos.",
    label: "Buscar e substituir",
    value: "find_replace",
  },
  {
    configFields: [
      {
        description: "Valor esperado para comparar com o que for lido nos arquivos.",
        key: "expected",
        label: "Endereco esperado",
        placeholder: "Ex.: Rua das Flores, 120",
      },
    ],
    description: "Compara o endereco encontrado com o endereco informado por voce.",
    group: "Verificacao pontual",
    helper: "Use quando voce quer checar um endereco especifico.",
    label: "Checar endereco",
    value: "check_address",
  },
  {
    configFields: [
      {
        description: "Valor esperado para comparar com o que for lido nos arquivos.",
        key: "expected",
        label: "Numero esperado",
        placeholder: "Ex.: 24-1087",
      },
    ],
    description: "Compara o numero do projeto encontrado com o numero informado por voce.",
    group: "Verificacao pontual",
    helper: "Use quando voce quer validar um numero de projeto especifico.",
    label: "Checar numero do projeto",
    value: "check_project_number",
  },
  {
    configFields: [
      {
        description: "Valor esperado para comparar com o que for lido nos arquivos.",
        key: "expected",
        label: "Nome esperado",
        placeholder: "Ex.: Estacao Central",
      },
    ],
    description: "Compara o nome da obra encontrado com o nome informado por voce.",
    group: "Verificacao pontual",
    helper: "Use quando voce quer validar o nome oficial da obra.",
    label: "Checar nome da obra",
    value: "check_work_name",
  },
];

export const ANALYSIS_MODE_GROUPS: AnalysisModeGroup[] = buildGroups(
  ANALYSIS_MODE_DEFINITIONS,
);

const modeDefinitionMap = Object.fromEntries(
  ANALYSIS_MODE_DEFINITIONS.map((definition) => [definition.value, definition]),
) as Record<AnalysisMode, AnalysisModeDefinition>;

export function getAnalysisModeDefinition(mode: AnalysisMode) {
  return modeDefinitionMap[mode];
}

export function getAnalysisModeDefinitions(modes: AnalysisMode[]) {
  return modes.map((mode) => getAnalysisModeDefinition(mode));
}

export function getAnalysisModeLabel(mode: AnalysisMode | string) {
  const definition = modeDefinitionMap[mode as AnalysisMode];
  return definition?.label ?? mode;
}

export function getLockedTipoForMode(mode: AnalysisMode) {
  return getAnalysisModeDefinition(mode).lockedTipo ?? null;
}

export function getInitialConfigValues(mode: AnalysisMode): AnalysisModeConfigValues {
  return Object.fromEntries(
    getAnalysisModeDefinition(mode).configFields.map((field) => [field.key, ""]),
  );
}

export function buildAnalysisModeConfig(
  mode: AnalysisMode,
  configValues: AnalysisModeConfigValues,
): {
  config: Record<string, string>;
  error?: string;
} {
  if (mode === "find_text") {
    const query = (configValues.query ?? "").trim();
    if (!query) {
      return {
        config: {},
        error: "Informe o texto que deve ser buscado nesta analise.",
      };
    }
    return { config: { query } };
  }

  if (mode === "find_replace") {
    const find = (configValues.find ?? "").trim();
    const replace = configValues.replace ?? "";
    if (!find) {
      return {
        config: {},
        error: "Informe o texto que deve ser localizado.",
      };
    }
    return { config: { find, replace } };
  }

  if (
    mode === "check_address" ||
    mode === "check_project_number" ||
    mode === "check_work_name"
  ) {
    const expected = (configValues.expected ?? "").trim();
    if (!expected) {
      return {
        config: {},
        error: "Informe o valor esperado para esta verificacao.",
      };
    }
    return { config: { expected } };
  }

  return { config: {} };
}

function buildGroups(definitions: AnalysisModeDefinition[]) {
  const groups = new Map<string, AnalysisModeGroup>();

  for (const definition of definitions) {
    const existingGroup = groups.get(definition.group);

    if (existingGroup) {
      existingGroup.modes.push(definition);
      continue;
    }

    groups.set(definition.group, {
      description: getGroupDescription(definition.group),
      modes: [definition],
      title: definition.group,
    });
  }

  return Array.from(groups.values());
}

function getGroupDescription(group: string) {
  const descriptions: Record<string, string> = {
    "Auditoria completa": "Fluxo geral para revisar o pacote como um todo.",
    "Busca textual": "Opcoes para localizar texto ou revisar uma troca de texto.",
    "Fluxo principal": "Fluxos visiveis para a revisao cotidiana do pacote.",
    "Recorte por documento": "Opcoes para focar a leitura em um tipo especifico de arquivo.",
    "Verificacao pontual": "Opcoes para comparar um valor esperado com o que for encontrado.",
  };

  return descriptions[group] ?? "Grupo tecnico de configuracao da analise.";
}
