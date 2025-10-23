# Hako - Biblioteca de Mangás Pessoal

   

Hako é uma aplicação web full-stack de código aberto para gerenciar e ler sua biblioteca pessoal de mangás digitais. É uma solução auto-hospedada (self-hosted) que roda localmente, garantindo que sua coleção permaneça privada e sob seu controle.

## Funcionalidades

  - **Visualização da Biblioteca:** Navegue por toda a sua coleção com capas e títulos.
  - **Destaques:** Marque seus mangás como favoritos para acesso rápido em uma seção dedicada.
  - **Busca e Filtragem:** Encontre mangás rapidamente pesquisando por título/autor ou filtrando por gênero e status (Em andamento, Finalizado).
  - **Página de Detalhes:** Veja informações completas de cada mangá, incluindo capa, sinopse, autor, e uma lista de capítulos organizada por volume.
  - **Leitor Integrado:**
      - Suporte para arquivos `.cbz` com visualização em estilo webtoon (rolagem vertical).
      - Suporte para visualização de `.pdf`.
  - **Upload Simplificado:** Adicione novos mangás e múltiplos capítulos de uma só vez. O sistema organiza os arquivos e associa as informações automaticamente.
  - **Gerenciamento Completo:** Edite todas as informações de um mangá ou exclua-o permanentemente (removendo também todos os arquivos associados do servidor).
  - **Design Moderno e Responsivo:** A interface se adapta a diferentes tamanhos de tela, do desktop ao celular.

## Tecnologias Utilizadas

  - **Frontend:**

      - HTML5
      - CSS3 (Flexbox, Grid Layout)
      - JavaScript (Vanilla JS, ES6+)
      - [EPUB.js](https://github.com/futurepress/epub.js/) para renderização de e-books.

  - **Backend:**

      - [Node.js](https://nodejs.org/)
      - [Express.js](https://expressjs.com/) para o servidor e API REST.
      - [Multer](https://github.com/expressjs/multer) para upload de arquivos.
      - [Adm-Zip](https://github.com/cthackers/adm-zip) para manipulação de arquivos `.cbz`.
      - [CORS](https://github.com/expressjs/cors) para gerenciamento de permissões de origem.

  - **Banco de Dados:**

      - [SQLite3](https://www.sqlite.org/index.html) para um armazenamento de dados leve e local.

## Instalação e Uso

Para rodar este projeto localmente, siga os passos abaixo.

### Pré-requisitos

  - [Node.js](https://nodejs.org/en/) (versão 18.x ou superior)
  - npm (geralmente instalado junto com o Node.js)

### Passos

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/Nayana-Oliveira/Hako.git
    ```

2.  **Navegue até o diretório do projeto:**

    ```bash
    cd hako
    ```

3.  **Instale as dependências do servidor:**

    ```bash
    npm install
    ```

4.  **Inicie o servidor de desenvolvimento:**

    ```bash
    npm run dev
    ```

    O servidor estará rodando em `http://localhost:3000`.

5.  **Acesse a aplicação:**
    Abra o arquivo `index.html` diretamente no seu navegador. A interface se comunicará com o servidor local.

## Estrutura do Projeto

```
/
├── uploads/              # Diretório para capas e capítulos (criado automaticamente)
│   ├── covers/
│   └── chapters/
├── app.js                # Lógica do frontend
├── database.js           # Configuração e inicialização do banco de dados
├── hako.db               # Arquivo do banco de dados SQLite
├── index.html            # Estrutura principal da aplicação
├── package-lock.json
├── package.json          # Dependências e scripts do Node.js
├── README.md             # Este arquivo
├── server.js             # Lógica do backend (servidor e API)
└── style.css             # Estilização do frontend
```

## Endpoints da API

  - `GET /mangas`: Retorna a lista de mangás, com suporte a queries de busca e filtros.
  - `GET /mangas/:mangaId`: Retorna os detalhes de um mangá específico e sua lista de capítulos.
  - `PUT /mangas/:mangaId`: Atualiza as informações de um mangá.
  - `DELETE /mangas/:mangaId`: Exclui um mangá e seus arquivos.
  - `POST /upload`: Realiza o upload de um novo mangá e/ou capítulos.
  - `POST /mangas/:id/toggle-favorite`: Alterna o status de favorito de um mangá.
  - `GET /filters`: Retorna as listas de gêneros e status disponíveis para filtragem.
  - `GET /capitulos/:id/content`: Fornece as URLs das páginas de um capítulo (`.cbz`) ou o link para download (`.epub`, `.pdf`).

## Possíveis Melhorias Futuras

  - [ ] Sistema de Contas de Usuário (multi-usuário).
  - [ ] Rastreamento de progresso de leitura por capítulo.
  - [ ] Opção para baixar capítulos diretamente da interface.
  - [ ] Temas claro e escuro customizáveis.
  - [ ] Importação de metadados de fontes externas.
  - [ ] Sistema de tags/categorias customizáveis.

-----
