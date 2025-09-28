const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./hako.db', (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        
        db.run('PRAGMA foreign_keys = ON;', (err) => {
            if (err) console.error("Erro ao ativar chaves estrangeiras:", err);
        });

        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS mangas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    titulo TEXT NOT NULL UNIQUE,
                    autor TEXT,
                    genero TEXT,
                    status TEXT DEFAULT 'Em andamento',
                    caminho_capa TEXT,
                    favorito INTEGER NOT NULL DEFAULT 0,
                    ano_lancamento INTEGER,
                    sinopse TEXT
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS volumes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    manga_id INTEGER NOT NULL,
                    numero INTEGER NOT NULL,
                    ano INTEGER,
                    FOREIGN KEY(manga_id) REFERENCES mangas(id) ON DELETE CASCADE
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS capitulos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    volume_id INTEGER NOT NULL,
                    numero REAL NOT NULL,
                    titulo_capitulo TEXT,
                    arquivo_path TEXT NOT NULL UNIQUE,
                    tipo_arquivo TEXT NOT NULL,
                    lido INTEGER NOT NULL DEFAULT 0,
                    FOREIGN KEY(volume_id) REFERENCES volumes(id) ON DELETE CASCADE
                )
            `);

            db.run(`
                CREATE TABLE IF NOT EXISTS progresso (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    capitulo_id INTEGER NOT NULL UNIQUE,
                    pagina_atual INTEGER NOT NULL,
                    FOREIGN KEY(capitulo_id) REFERENCES capitulos(id) ON DELETE CASCADE
                )
            `);
        });
    }
});

module.exports = db;