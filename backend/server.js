const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const AdmZip = require('adm-zip');
const db = require('./database.js');
const { promisify } = require('util'); 

const unlinkAsync = promisify(fs.unlink);

function dbGet(query, params) {
    return new Promise((resolve, reject) => db.get(query, params, (err, row) => err ? reject(err) : resolve(row)));
}
function dbRun(query, params) {
    return new Promise((resolve, reject) => db.run(query, params, function(err) { err ? reject(err) : resolve(this); }));
}
function dbAll(query, params) {
    return new Promise((resolve, reject) => db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows)));
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const coversDir = './uploads/covers/';
        const chaptersDir = './uploads/chapters/';
        if (!fs.existsSync(coversDir)) fs.mkdirSync(coversDir, { recursive: true });
        if (!fs.existsSync(chaptersDir)) fs.mkdirSync(chaptersDir, { recursive: true });
        
        if (file.fieldname === 'capa') {
            cb(null, coversDir);
        } else if (file.fieldname === 'capituloFiles') {
            cb(null, chaptersDir);
        }
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('API da Biblioteca Hako está funcionando!');
});

app.post('/upload', upload.fields([
    { name: 'capa', maxCount: 1 },
    { name: 'capituloFiles' }
]), async (req, res) => {
    
    if (!req.body || !req.files || !req.files.capituloFiles || req.files.capituloFiles.length === 0) {
        return res.status(400).json({ error: 'Falha no upload. Pelo menos um arquivo de capítulo é obrigatório.' });
    }
    
    let { 
        tituloManga, autor, genero, status, ano_lancamento, sinopse,
        numeroVolume, numeroCapitulo, tituloCapitulo 
    } = req.body;
    
    const capituloFiles = req.files.capituloFiles;

    if (!Array.isArray(numeroVolume)) numeroVolume = [numeroVolume];
    if (!Array.isArray(numeroCapitulo)) numeroCapitulo = [numeroCapitulo];
    if (!Array.isArray(tituloCapitulo)) tituloCapitulo = [tituloCapitulo];
    
    if (capituloFiles.length !== numeroVolume.length || capituloFiles.length !== numeroCapitulo.length) {
         return res.status(400).json({ error: 'Inconsistência de dados. O número de arquivos não corresponde ao número de detalhes de capítulos.' });
    }

    const capaFile = req.files.capa ? req.files.capa[0] : null;
    const caminhoCapa = capaFile ? capaFile.path : null;

    try {
        let manga = await dbGet('SELECT * FROM mangas WHERE titulo = ?', [tituloManga]);
        let mangaId;

        const generoFormatado = genero ? genero.split(',').map(g => g.trim()).join(',') : null;

        if (!manga) {
            const result = await dbRun(
                'INSERT INTO mangas (titulo, autor, genero, status, caminho_capa, ano_lancamento, sinopse) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [tituloManga, autor, generoFormatado, status, caminhoCapa, ano_lancamento, sinopse]
            );
            mangaId = result.lastID;
        } else {
            mangaId = manga.id;
            await dbRun(
                'UPDATE mangas SET autor = ?, genero = ?, status = ?, ano_lancamento = ?, sinopse = ? WHERE id = ?',
                [autor, generoFormatado, status, ano_lancamento, sinopse, mangaId]
            );
            if (caminhoCapa) {
                await dbRun('UPDATE mangas SET caminho_capa = ? WHERE id = ?', [caminhoCapa, mangaId]);
            }
        }

        for (let i = 0; i < capituloFiles.length; i++) {
            const file = capituloFiles[i];
            const volNum = numeroVolume[i];
            const chapNum = numeroCapitulo[i];
            const chapTitle = tituloCapitulo[i];

            if (!volNum || !chapNum) continue;

            let volume = await dbGet('SELECT id FROM volumes WHERE manga_id = ? AND numero = ?', [mangaId, volNum]);
            let volumeId;
            if (!volume) {
                const result = await dbRun('INSERT INTO volumes (manga_id, numero) VALUES (?, ?)', [mangaId, volNum]);
                volumeId = result.lastID;
            } else {
                volumeId = volume.id;
            }
            
            const capituloPath = file.path;
            const tipoArquivo = path.extname(file.originalname).substring(1);
            await dbRun(
                'INSERT INTO capitulos (volume_id, numero, titulo_capitulo, arquivo_path, tipo_arquivo) VALUES (?, ?, ?, ?, ?)',
                [volumeId, chapNum, chapTitle, capituloPath, tipoArquivo]
            );
        }
        
        res.status(201).json({ message: 'Upload de múltiplos capítulos realizado com sucesso!' });
    } catch (error) {
        console.error('ERRO NO PROCESSO DE UPLOAD:', error);
        res.status(500).json({ error: 'Falha no servidor durante o upload.' });
    }
});


app.put('/mangas/:mangaId', upload.single('capa'), async (req, res) => {
    try {
        const { mangaId } = req.params;
        const { titulo, autor, genero, status, ano_lancamento, sinopse } = req.body;
        
        let caminhoCapa = req.body.caminho_capa_existente || null;
        if (req.file) {
            caminhoCapa = req.file.path;
        }

        const generoFormatado = genero ? genero.split(',').map(g => g.trim()).join(',') : null;

        await dbRun(
            'UPDATE mangas SET titulo = ?, autor = ?, genero = ?, status = ?, ano_lancamento = ?, sinopse = ?, caminho_capa = ? WHERE id = ?',
            [titulo, autor, generoFormatado, status, ano_lancamento, sinopse, caminhoCapa, mangaId]
        );
        
        res.status(200).json({ message: 'Mangá atualizado com sucesso!' });
    } catch (error) {
        console.error('ERRO AO ATUALIZAR MANGÁ:', error);
        res.status(500).json({ error: 'Erro ao atualizar o mangá.' });
    }
});

app.get('/filters', async (req, res) => {
    try {
        const statusesResult = await dbAll("SELECT DISTINCT status FROM mangas WHERE status IS NOT NULL AND status != '' ORDER BY status ASC", []);
        const statuses = statusesResult.map(item => item.status);

        const genresResult = await dbAll("SELECT genero FROM mangas WHERE genero IS NOT NULL AND genero != ''", []);
        const uniqueGenres = new Set();
        genresResult.forEach(item => {
            const genres = item.genero.split(',');
            genres.forEach(g => uniqueGenres.add(g.trim()));
        });

        const genres = Array.from(uniqueGenres).sort();

        res.json({ genres, statuses });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar filtros.' });
    }
});

app.get('/mangas', async (req, res) => {
    try {
        const { search, genre, status, favorito } = req.query;
        let query = `SELECT id, titulo, autor, genero, status, caminho_capa, favorito FROM mangas WHERE 1 = 1`;
        const params = [];
        if (search) {
            query += ` AND (titulo LIKE ? OR autor LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }
        if (genre) {
            query += ` AND genero LIKE ?`;
            params.push(`%${genre}%`);
        }
        if (status) {
            query += ` AND status = ?`;
            params.push(status);
        }
        if (favorito === 'true') {
            query += ` AND favorito = 1`;
        }
        query += ` ORDER BY titulo ASC`;
        const mangas = await dbAll(query, params);
        res.json(mangas);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar mangás.' });
    }
});

app.post('/mangas/:id/toggle-favorite', async (req, res) => {
    try {
        const { id } = req.params;
        const manga = await dbGet('SELECT favorito FROM mangas WHERE id = ?', [id]);
        if (!manga) return res.status(404).json({ error: 'Mangá não encontrado.' });
        const novoEstado = manga.favorito === 1 ? 0 : 1;
        await dbRun('UPDATE mangas SET favorito = ? WHERE id = ?', [novoEstado, id]);
        res.json({ message: 'Status de favorito alterado!', favorito: novoEstado });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar status de favorito.' });
    }
});

app.get('/mangas/:mangaId', async (req, res) => {
    try {
        const { mangaId } = req.params;
        const manga = await dbGet('SELECT * FROM mangas WHERE id = ?', [mangaId]);
        if (!manga) return res.status(404).json({ error: 'Mangá não encontrado.' });
        const capitulosQuery = `
            SELECT v.numero as volume_numero, c.* FROM capitulos c
            JOIN volumes v ON c.volume_id = v.id
            WHERE v.manga_id = ?
            ORDER BY v.numero, c.numero
        `;
        const capitulos = await dbAll(capitulosQuery, [mangaId]);
        res.json({ manga, capitulos });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar detalhes do mangá.' });
    }
});

app.post('/capitulos/:id/toggle-read', async (req, res) => {
    try {
        const { id } = req.params;
        const capitulo = await dbGet('SELECT lido FROM capitulos WHERE id = ?', [id]);
        if (!capitulo) return res.status(404).json({ error: 'Capítulo não encontrado.' });
        const novoEstado = capitulo.lido === 1 ? 0 : 1;
        await dbRun('UPDATE capitulos SET lido = ? WHERE id = ?', [novoEstado, id]);
        res.json({ message: 'Status alterado com sucesso!', lido: novoEstado });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao alterar status de leitura.' });
    }
});

app.post('/capitulos/:id/progresso', async (req, res) => {
    try {
        const { id } = req.params;
        const { pagina } = req.body;
        if (pagina === undefined) return res.status(400).json({ error: 'Número da página é obrigatório.' });
        const query = `INSERT INTO progresso (capitulo_id, pagina_atual) VALUES (?, ?) ON CONFLICT(capitulo_id) DO UPDATE SET pagina_atual = excluded.pagina_atual;`;
        await dbRun(query, [id, pagina]);
        res.status(200).json({ message: 'Progresso salvo com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar progresso.' });
    }
});

app.get('/capitulos/:id/content', async (req, res) => {
    try {
        const capitulo = await dbGet('SELECT arquivo_path, tipo_arquivo FROM capitulos WHERE id = ?', [req.params.id]);
        if (!capitulo || !fs.existsSync(capitulo.arquivo_path)) {
            return res.status(404).json({ error: 'Recurso do capítulo não encontrado.' });
        }
        if (capitulo.tipo_arquivo === 'cbz') {
            const zip = new AdmZip(capitulo.arquivo_path);
            const zipEntries = zip.getEntries();
            const pageNames = zipEntries.filter(e => !e.isDirectory && /\.(jpg|jpeg|png|webp)$/i.test(e.entryName)).map(e => e.entryName).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            const pageUrls = pageNames.map(name => `/capitulos/${req.params.id}/image/${encodeURIComponent(name)}`);
            res.json({ tipo: 'cbz', pages: pageUrls });
        } else if (['pdf', 'epub', 'mobi'].includes(capitulo.tipo_arquivo)) {
            res.json({ tipo: capitulo.tipo_arquivo, url: `/capitulos/${req.params.id}/download` });
        } else {
            res.status(400).json({ error: 'Tipo de arquivo não suportado.' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar o conteúdo.' });
    }
});

app.get('/capitulos/:id/image/:imageName', async (req, res) => {
    try {
        const capitulo = await dbGet('SELECT arquivo_path FROM capitulos WHERE id = ?', [req.params.id]);
        if (!capitulo || !fs.existsSync(capitulo.arquivo_path)) return res.status(404).send('Recurso não encontrado.');
        const zip = new AdmZip(capitulo.arquivo_path);
        const requestedEntry = zip.getEntry(decodeURIComponent(req.params.imageName));
        if (requestedEntry) {
            const extension = path.extname(requestedEntry.entryName).toLowerCase();
            let contentType = 'image/jpeg';
            if (extension === '.png') contentType = 'image/png';
            if (extension === '.webp') contentType = 'image/webp';
            res.setHeader('Content-Type', contentType);
            res.end(requestedEntry.getData());
        } else {
            res.status(404).send('Página não encontrada no arquivo.');
        }
    } catch (error) {
        console.error("ERRO CRÍTICO AO SERVIR IMAGEM:", error);
        res.status(500).send('Erro ao ler o arquivo.');
    }
});

app.get('/capitulos/:id/download', async (req, res) => {
    try {
        const capitulo = await dbGet('SELECT arquivo_path FROM capitulos WHERE id = ?', [req.params.id]);
        if (!capitulo || !fs.existsSync(capitulo.arquivo_path)) return res.status(404).send('Recurso não encontrado.');
        res.sendFile(path.resolve(capitulo.arquivo_path));
    } catch (error) {
        res.status(500).send('Erro ao servir o arquivo.');
    }
});

app.delete('/mangas/:mangaId', async (req, res) => {
    const { mangaId } = req.params;
    try {
        const manga = await dbGet('SELECT caminho_capa FROM mangas WHERE id = ?', [mangaId]);
        const capitulos = await dbAll(`
            SELECT c.arquivo_path FROM capitulos c
            JOIN volumes v ON c.volume_id = v.id
            WHERE v.manga_id = ?
        `, [mangaId]);

        const pathsToDelete = [];
        if (manga && manga.caminho_capa) {
            pathsToDelete.push(manga.caminho_capa);
        }
        capitulos.forEach(c => {
            if (c.arquivo_path) {
                pathsToDelete.push(c.arquivo_path);
            }
        });

        const result = await dbRun('DELETE FROM mangas WHERE id = ?', [mangaId]);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Mangá não encontrado.' });
        }

        const deletePromises = pathsToDelete.map(filePath => {
            return new Promise((resolve) => {
                if (fs.existsSync(filePath)) {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error(`Erro ao deletar o arquivo ${filePath}:`, err);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        });

        await Promise.all(deletePromises);

        res.status(200).json({ message: 'Mangá e todos os seus capítulos foram excluídos com sucesso.' });
    } catch (error) {
        console.error('ERRO AO EXCLUIR MANGÁ:', error);
        res.status(500).json({ error: 'Falha no servidor ao excluir o mangá.' });
    }
});

app.listen(PORT, () => {
  console.log(`Servidor Hako rodando em http://localhost:${PORT}`);
});