from dataclasses import dataclass


@dataclass(frozen=True)
class FieldDefinition:
    field_name: str
    aliases: tuple[str, ...]


FIELD_DEFINITIONS: tuple[FieldDefinition, ...] = (
    FieldDefinition(
        field_name="nome_obra",
        aliases=("NOME DA OBRA", "OBRA"),
    ),
    FieldDefinition(
        field_name="numero_projeto",
        aliases=("NUMERO DO PROJETO", "NUMERO PROJETO", "N PROJETO"),
    ),
    FieldDefinition(
        field_name="endereco",
        aliases=("ENDERECO",),
    ),
    FieldDefinition(
        field_name="bairro",
        aliases=("BAIRRO",),
    ),
    FieldDefinition(
        field_name="municipio",
        aliases=("MUNICIPIO",),
    ),
    FieldDefinition(
        field_name="orgao_cliente",
        aliases=("ORGAO CLIENTE", "CLIENTE"),
    ),
)
