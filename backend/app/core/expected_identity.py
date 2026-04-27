from typing import Any


EXPECTED_IDENTITY_CONFIG_FIELDS: dict[str, str] = {
    "expected_project_code": "numero_projeto",
    "expected_address": "endereco",
    "expected_client": "orgao_cliente",
    "expected_bairro": "bairro",
    "expected_municipality": "municipio",
    "expected_work_name": "nome_obra",
}

EXPECTED_IDENTITY_CONFIG_KEYS = frozenset(EXPECTED_IDENTITY_CONFIG_FIELDS)


def extract_expected_identity(config: dict[str, Any] | None) -> dict[str, str]:
    if not config:
        return {}

    expected_identity: dict[str, str] = {}
    for config_key, field_name in EXPECTED_IDENTITY_CONFIG_FIELDS.items():
        value = config.get(config_key)
        if not isinstance(value, str):
            continue
        value = value.strip()
        if value:
            expected_identity[field_name] = value
    return expected_identity
