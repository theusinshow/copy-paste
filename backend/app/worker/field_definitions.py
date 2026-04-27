from dataclasses import dataclass


@dataclass(frozen=True)
class FieldDefinition:
    field_name: str
    aliases: tuple[str, ...]


FIELD_DEFINITIONS: tuple[FieldDefinition, ...] = (
    FieldDefinition(
        field_name="nome_obra",
        aliases=("NOME DA OBRA", "NOME OBRA", "EMPREENDIMENTO"),
    ),
    FieldDefinition(
        field_name="numero_projeto",
        aliases=(
            "NUMERO DO PROJETO",
            "NUMERO PROJETO",
            "N DO PROJETO",
            "N PROJETO",
            "NO DO PROJETO",
            "NO PROJETO",
        ),
    ),
    FieldDefinition(
        field_name="endereco",
        aliases=("ENDERECO", "ENDERECO DA OBRA"),
    ),
    FieldDefinition(
        field_name="bairro",
        aliases=("BAIRRO", "NO BAIRRO"),
    ),
    FieldDefinition(
        field_name="municipio",
        aliases=("MUNICIPIO",),
    ),
    FieldDefinition(
        field_name="orgao_cliente",
        aliases=("ORGAO CLIENTE", "CLIENTE"),
    ),
    FieldDefinition(
        field_name="folha",
        aliases=("FOLHA", "FLH"),
    ),
    FieldDefinition(
        field_name="data_emissao",
        aliases=("DATA DE EMISSAO", "DATA EMISSAO", "EMISSAO", "DATA"),
    ),
)
