# TalentFlow - Front-end

Front-end estático em HTML, CSS e JavaScript para o desafio de gerenciamento de candidatos. O projeto não depende do back-end para demonstração: por padrão, usa dados salvos no `localStorage` do navegador.

## Funcionalidades

- Cadastro de candidato com `POST`.
- Listagem e consulta por ID com `GET`.
- Edição completa com `PUT`.
- Atualização rápida de cargo, status ou salário com `PATCH`.
- Exclusão com confirmação usando `DELETE`.
- Busca por nome ou cargo e filtro por status.
- Indicadores de total, em análise, aprovados, reprovados e contratados.
- Estados de carregamento, erro, lista vazia e validação de formulário.
- Layout responsivo para computador e celular.

## Executar sem back-end

Na pasta `frontend`, inicie qualquer servidor de arquivos estáticos. Com Python:

```bash
python -m http.server 5500
```

Abra `http://localhost:5500`. Não abra o `index.html` diretamente por `file://`, pois o projeto usa módulos JavaScript.

Os dados são persistidos no navegador. O botão **Restaurar dados de exemplo** devolve a massa inicial.

## Integração no Docker Compose

O JavaScript sempre chama URLs relativas como `/api/funcionarios`. O Nginx do contêiner encaminha essas chamadas para o Spring Boot e remove o prefixo `/api`, portanto o back-end continua expondo os endpoints pedidos pelo desafio em `/funcionarios`.

Exemplo para a pessoa responsável pelo Compose:

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    ports:
      - "8081:80"
    environment:
      APP_MODE: api
      API_BASE_URL: /api
      BACKEND_URL: http://backend:8080
    depends_on:
      - backend
```

Depois, a aplicação fica disponível em `http://localhost:8081`. Como o navegador conversa somente com o Nginx na mesma origem, essa configuração não exige CORS no fluxo do Compose.

Para continuar usando a demonstração dentro do contêiner, use `APP_MODE: mock` ou omita as variáveis, pois esse é o valor padrão.

## Contrato esperado da API

| Método | Endpoint do Spring | Corpo | Resposta esperada |
| --- | --- | --- | --- |
| `GET` | `/funcionarios` | - | `200` com um array |
| `GET` | `/funcionarios/{id}` | - | `200` com um candidato ou `404` |
| `POST` | `/funcionarios` | Candidato completo; `id` pode ser omitido | `201` ou `200` com o candidato criado |
| `PUT` | `/funcionarios/{id}` | Todos os campos, incluindo o mesmo `id` | `200` com o candidato atualizado |
| `PATCH` | `/funcionarios/{id}` | Somente `cargo`, `status` e/ou `salario` | `200` com o candidato atualizado |
| `DELETE` | `/funcionarios/{id}` | - | `204`, `200` ou `404` |

Formato de candidato:

```json
{
  "id": 1,
  "nome": "Marina Almeida",
  "email": "marina.almeida@email.com",
  "telefone": "(11) 98765-4321",
  "cargo": "Desenvolvedora Front-end",
  "departamento": "Tecnologia",
  "salario": 7200,
  "cidade": "São Paulo - SP",
  "status": "EM_ANALISE"
}
```

Valores aceitos em `status`: `EM_ANALISE`, `APROVADO`, `REPROVADO` e `CONTRATADO`.

Para mensagens de erro, o front reconhece texto simples ou JSON nos formatos abaixo:

```json
{
  "message": "Funcionário não encontrado",
  "errors": {
    "email": "E-mail inválido"
  }
}
```

Também são aceitas as chaves em português `mensagem` e `erros`.
