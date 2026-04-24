export function formatAnalysisDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data indisponivel";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatHash(hash: string) {
  if (hash.length <= 20) {
    return hash;
  }

  return `${hash.slice(0, 12)}...${hash.slice(-8)}`;
}
