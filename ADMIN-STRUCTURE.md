# Organização definitiva do Admin

## Fonte única do Admin

A pasta **`src 2/`** é a base oficial do painel admin (layout, páginas e estrutura).

## Publicação

- O caminho público do admin permanece em **`/admin/index.html`**.
- O arquivo **`/admin/index.html`** funciona apenas como bootstrap/entrypoint.
- Não há reaproveitamento de código legado dentro de `admin/`.

## Estado atual da pasta `/admin`

- Mantido apenas: `admin/index.html`.
- Todo o conteúdo antigo de `admin/assets/` foi removido.

## Próximos encaixes (estrutura preparada)

Com esta organização, a evolução deve acontecer sobre `src 2/`, incluindo depois:

- Supabase
- Calendário Airbnb
- Alteração de valores/diárias
- Pagamentos com cartão

Sem misturar `admin-app/` com `src 2/` e mantendo `legacy-admin/` arquivado.
