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

const modeDefinitions: AnalysisModeDefinition[] = [
  {
    configFields: [],
    description: "Executa o fluxo completo atual com extracao, regras e issues.",
    group: "Auditoria completa",
    helper: "Mantem o comportamento atual do sistema.",
    label: "Analise completa",
    value: "full_check",
  },
  {
    configFields: [],
    description: "Recorta a avaliacao para documentos classificados como memorial.",
    group: "Recorte por documento",
    helper: "Usa o tipo do documento para focar o processamento no memorial.",
    label: "So memorial",
    lockedTipo: "memorial",
    value: "memorial_only",
  },
  {
    configFields: [],
    description: "Recorta a avaliacao para pranchas e plantas.",
    group: "Recorte por documento",
    helper: "Ideal para cargas concentradas em pranchas.",
    label: "So pranchas",
    lockedTipo: "prancha",
    value: "sheets_only",
  },
  {
    configFields: [],
    description: "Recorta a avaliacao para arquivos classificados como LD.",
    group: "Recorte por documento",
    helper: "Mantem o pipeline focado apenas em LD.",
    label: "So LD",
    lockedTipo: "ld",
    value: "ld_only",
  },
  {
    configFields: [
      {
        description: "Texto literal que deve ser encontrado no PDF.",
        key: "query",
        label: "Texto a buscar",
        placeholder: "Ex.: concreto",
      },
    ],
    description: "Prepara a analise para localizar um texto especifico na base enviada.",
    group: "Busca textual",
    helper: "Armazena a consulta no contrato da analise.",
    label: "Buscar texto",
    value: "find_text",
  },
  {
    configFields: [
      {
        description: "Texto original a localizar.",
        key: "find",
        label: "Buscar",
        placeholder: "Ex.: Rua antiga",
      },
      {
        description: "Texto de substituicao pretendido.",
        key: "replace",
        label: "Substituir por",
        placeholder: "Ex.: Avenida nova",
      },
    ],
    description: "Configura uma verificacao dirigida de busca e substituicao.",
    group: "Busca textual",
    helper: "Mantem a dupla buscar/substituir registrada na analise.",
    label: "Buscar e substituir",
    value: "find_replace",
  },
  {
    configFields: [
      {
        description: "Endereco esperado para comparacoes futuras.",
        key: "expected",
        label: "Endereco esperado",
        placeholder: "Ex.: Rua das Flores, 120",
      },
    ],
    description: "Configura uma verificacao pontual do endereco.",
    group: "Verificacao pontual",
    helper: "Preserva o valor esperado na configuracao da analise.",
    label: "Checar endereco",
    value: "check_address",
  },
  {
    configFields: [
      {
        description: "Numero de projeto esperado para comparacoes futuras.",
        key: "expected",
        label: "Numero esperado",
        placeholder: "Ex.: 24-1087",
      },
    ],
    description: "Configura uma verificacao pontual do numero do projeto.",
    group: "Verificacao pontual",
    helper: "Preserva o numero esperado na configuracao da analise.",
    label: "Checar numero do projeto",
    value: "check_project_number",
  },
  {
    configFields: [
      {
        description: "Nome da obra esperado para comparacoes futuras.",
        key: "expected",
        label: "Nome esperado",
        placeholder: "Ex.: Estacao Central",
      },
    ],
    description: "Configura uma verificacao pontual do nome da obra.",
    group: "Verificacao pontual",
    helper: "Preserva o nome esperado na configuracao da analise.",
    label: "Checar nome da obra",
    value: "check_work_name",
  },
];

export const ANALYSIS_MODE_GROUPS: AnalysisModeGroup[] = buildGroups(modeDefinitions);

const modeDefinitionMap = Object.fromEntries(
  modeDefinitions.map((definition) => [definition.value, definition]),
) as Record<AnalysisMode, AnalysisModeDefinition>;

export function getAnalysisModeDefinition(mode: AnalysisMode) {
  return modeDefinitionMap[mode];
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
    "Auditoria completa": "Fluxo atual completo do produto.",
    "Busca textual": "Modos guiados por texto configurado na analise.",
    "Recorte por documento": "Foco em um subconjunto de documentos da carga.",
    "Verificacao pontual": "Analises com um valor esperado explicito.",
  };

  return descriptions[group] ?? "Grupo tecnico de configuracao da analise.";
}
