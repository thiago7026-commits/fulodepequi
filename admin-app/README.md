# Admin App (React + Vite + TypeScript)

Este diretório contém o **código-fonte** do novo painel administrativo.

## Rodar localmente

```bash
cd admin-app
npm install
npm run dev
```

## Gerar build para `/admin`

```bash
cd admin-app
npm run build
```

O build é gerado automaticamente em `../admin` com `base` configurada para `/admin/`.

## Publicar no GitHub Pages

1. Garanta que os arquivos do site público continuem na raiz do repositório.
2. Gere o build com `npm run build` dentro de `admin-app`.
3. Faça commit incluindo `admin/` (build) e `admin-app/` (fonte).
4. Publique a branch no GitHub Pages mantendo a pasta raiz como origem.
