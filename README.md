# CifraMel

## Adicionando louvores

O catalogo fica em `louvores.json`. Para adicionar um louvor, acrescente um novo objeto dentro da lista:

```json
{
  "title": "Nome do louvor",
  "artist": "Ministerio ou autor",
  "key": "C",
  "category": "Adoracao",
  "tags": ["calmos"],
  "melody": [
    ["C  D  E", "Primeira frase da letra"],
    ["E  D  C", "Segunda frase da letra"]
  ]
}
```

- `title`: titulo exibido e identificador do favorito.
- `artist`: autor, grupo ou ministerio.
- `key`: tonalidade original. Use `C`, `D`, `E`, `F`, `G`, `A` ou `B`.
- `category`: categoria exibida no catalogo.
- `tags`: use `recentes`, `calmos` e/ou `celebracao` para os filtros existentes.
- `melody`: lista de pares `[notas, letra]`. Separe as notas com dois espacos, por exemplo `C  D  E`.

Depois de editar o JSON, recarregue a pagina. O navegador precisa abrir o projeto por um servidor local para que `louvores.json` seja carregado. No terminal, dentro desta pasta, execute:

```powershell
py -m http.server 8080 --bind 127.0.0.1
```

Acesse `http://127.0.0.1:8080`.
