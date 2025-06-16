/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    // ajouter d'autres variables d'env ici si besoin
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}