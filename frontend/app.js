document.addEventListener('DOMContentLoaded', () => {
    
    const appContainer = document.getElementById('app-container');
    const viewerContainer = document.getElementById('viewer-container');
    const libraryView = document.getElementById('library-view');
    const mangaDetailView = document.getElementById('manga-detail-view');
    const backButton = document.getElementById('back-button');
    const currentViewTitle = document.getElementById('current-view-title');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const filtersContainer = document.getElementById('filters-container');
    const favoritesBtn = document.getElementById('favorites-btn');
    const homeLink = document.getElementById('home-link');
    const viewerTitle = document.getElementById('viewer-title');
    const viewerContent = document.getElementById('viewer-content');
    const viewerNav = document.getElementById('viewer-nav');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const pageIndicator = document.getElementById('page-indicator');
    const closeViewerBtn = document.getElementById('close-viewer');
    const paginatedNav = document.getElementById('paginated-nav');
    const uploadModal = document.getElementById('upload-modal');
    const openUploadModalBtn = document.getElementById('open-upload-modal-btn');
    const closeUploadModalBtn = document.getElementById('close-upload-modal-btn');
    const uploadForm = document.getElementById('upload-form');
    const formTitle = document.getElementById('form-title');
    const chapterFieldset = document.getElementById('chapter-fieldset');
    const capituloFilesInput = document.getElementById('capituloFiles');
    const capitulosDinamicosContainer = document.getElementById('capitulos-dinamicos-container');
    const prevChapterBtn = document.getElementById('prev-chapter-btn');
    const nextChapterBtn = document.getElementById('next-chapter-btn');

    const contentGrid = document.getElementById('content-grid');
    const favoritesSection = document.getElementById('favorites-section');
    const favoritesGrid = document.getElementById('favorites-grid');
    const librarySection = document.getElementById('library-section');

    const state = {
        currentView: 'library',
        mangaId: null,
        mangaTitle: null,
        chapterList: [], 
        activeFilters: {},
        reader: {
            capitulo: null,
            type: null,
            content: [],
            rendition: null
        },
    };

    const API_URL = 'http://localhost:3000';

    async function renderLibraryView() {
        state.currentView = 'library';
        currentViewTitle.textContent = 'Biblioteca';
        favoritesSection.classList.add('hidden');
        librarySection.classList.add('hidden');
        
        const params = new URLSearchParams(state.activeFilters);
        const response = await fetch(`${API_URL}/mangas?${params.toString()}`);
        const mangas = await response.json();

        contentGrid.innerHTML = '';
        favoritesGrid.innerHTML = '';

        const favorites = mangas.filter(m => m.favorito === 1);
        const libraryMangas = mangas;

        if (favorites.length > 0 && Object.keys(state.activeFilters).length === 0) {
            favoritesSection.classList.remove('hidden');
            favorites.forEach(manga => {
                const item = createGridItem(manga);
                favoritesGrid.appendChild(item);
            });
        }
        
        if (libraryMangas.length > 0) {
            librarySection.classList.remove('hidden');
            libraryMangas.forEach(manga => {
                const item = createGridItem(manga);
                contentGrid.appendChild(item);
            });
        }

        if (mangas.length === 0) {
            librarySection.classList.remove('hidden');
            contentGrid.innerHTML = '<p>Nenhum mangá encontrado.</p>';
        }
    }

    function createGridItem(manga) {
        const item = document.createElement('div');
        item.className = 'manga-item';
        
        const coverContainer = document.createElement('div');
        coverContainer.className = 'manga-item-cover-container';

        const coverImg = document.createElement('img');
        coverImg.className = 'manga-item-cover';
        coverImg.src = manga.caminho_capa ? `${API_URL}/${manga.caminho_capa.replace(/\\/g, '/')}` : '';
        coverImg.onerror = () => { 
            const placeholder = document.createElement('div');
            placeholder.className = 'manga-item-cover';
            placeholder.textContent = manga.titulo;
            placeholder.style.display = 'flex';
            placeholder.style.alignItems = 'center';
            placeholder.style.justifyContent = 'center';
            placeholder.style.padding = '10px';
            coverContainer.replaceChild(placeholder, coverImg);
        };
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'manga-item-title';
        titleSpan.textContent = manga.titulo;
        
        const favoriteBtn = document.createElement('button');
        favoriteBtn.type = 'button';
        favoriteBtn.className = 'favorite-btn icon-btn';
        favoriteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>';
        favoriteBtn.classList.toggle('active', manga.favorito === 1);

        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavoriteStatus(manga.id, favoriteBtn);
        });
        
        coverContainer.appendChild(coverImg);
        coverContainer.appendChild(favoriteBtn);
        
        item.appendChild(coverContainer);
        item.appendChild(titleSpan);

        item.addEventListener('click', () => {
            state.currentView = 'mangaDetail';
            state.mangaId = manga.id;
            render();
        });
        
        return item;
    }

    function renderDynamicChapterInputs() {
        capitulosDinamicosContainer.innerHTML = ''; 
        const files = capituloFilesInput.files;
        if (files.length > 0) {
            const list = document.createElement('ul');
            Array.from(files).forEach((file, index) => {
                const item = document.createElement('li');
                item.innerHTML = `<p><strong>${file.name}</strong></p><div class="form-grid"><div><label for="numeroVolume_${index}">Volume*</label><input type="number" id="numeroVolume_${index}" name="numeroVolume" required></div><div><label for="numeroCapitulo_${index}">Capítulo*</label><input type="number" step="0.1" id="numeroCapitulo_${index}" name="numeroCapitulo" required></div></div><div><label for="tituloCapitulo_${index}">Título do Capítulo</label><input type="text" id="tituloCapitulo_${index}" name="tituloCapitulo"></div>`;
                list.appendChild(item);
            });
            capitulosDinamicosContainer.appendChild(list);
        }
    }
    if(capituloFilesInput) { capituloFilesInput.addEventListener('change', renderDynamicChapterInputs); }

    function render() {
        libraryView.classList.add('hidden');
        mangaDetailView.classList.add('hidden');
        backButton.classList.add('hidden');

        switch (state.currentView) {
            case 'mangaDetail':
                libraryView.classList.add('hidden');
                mangaDetailView.classList.remove('hidden');
                backButton.classList.remove('hidden');
                renderMangaDetailView(state.mangaId);
                break;
            case 'library':
            default:
                mangaDetailView.classList.add('hidden');
                libraryView.classList.remove('hidden');
                renderLibraryView();
                break;
        }
    }

    async function renderMangaDetailView(mangaId) {
        try {
            const response = await fetch(`${API_URL}/mangas/${mangaId}`);
            if (!response.ok) throw new Error('Mangá não encontrado');
            const data = await response.json();
            const manga = data.manga;
            const capitulos = data.capitulos;

            state.mangaTitle = manga.titulo;
            state.chapterList = capitulos;
            currentViewTitle.textContent = manga.titulo;
            
            const genresHTML = manga.genero ? manga.genero.split(',').map(g => `<span class="genre-tag">${g.trim()}</span>`).join('') : 'N/A';

            mangaDetailView.innerHTML = `
                <div class="detail-header">
                    <img class="detail-cover" src="${API_URL}/${manga.caminho_capa?.replace(/\\/g, '/')}" onerror="this.style.display='none'">
                    <div class="detail-info">
                        <h2>${manga.titulo}</h2>
                        <p><strong>Autor:</strong> ${manga.autor || 'Desconhecido'}</p>
                        <p><strong>Status:</strong> ${manga.status || 'N/A'}</p>
                        <p><strong>Ano:</strong> ${manga.ano_lancamento || 'N/A'}</p>
                        <div class="genre-tags">${genresHTML}</div>
                        <div class="detail-actions">
                            <button type="button" id="edit-manga-btn">Editar</button>
                            <button type="button" id="delete-manga-btn" class="delete-btn">Excluir</button>
                        </div>
                    </div>
                </div>
                <div class="detail-section">
                    <h3>SINOPSE</h3>
                    <p>${manga.sinopse || 'Nenhuma sinopse disponível.'}</p>
                </div>
                <div class="detail-section">
                    <h3>CAPÍTULOS</h3>
                    <div id="chapter-list"></div>
                </div>`;

            mangaDetailView.querySelector('#edit-manga-btn').addEventListener('click', () => openEditModal(manga));
            mangaDetailView.querySelector('#delete-manga-btn').addEventListener('click', () => deleteManga(manga.id, manga.titulo));
            
            const chapterListContainer = mangaDetailView.querySelector('#chapter-list');
            if (capitulos.length === 0) {
                chapterListContainer.innerHTML = '<p>Nenhum capítulo encontrado.</p>';
            } else {
                const chaptersByVolume = capitulos.reduce((acc, chap) => {
                    const vol = chap.volume_numero;
                    if (!acc[vol]) { acc[vol] = []; }
                    acc[vol].push(chap);
                    return acc;
                }, {});

                const sortedVolumes = Object.keys(chaptersByVolume).sort((a, b) => b - a);
                
                sortedVolumes.forEach(volumeNumber => {
                    const volumeHeader = document.createElement('h4');
                    volumeHeader.className = 'volume-header';
                    volumeHeader.textContent = `Volume ${volumeNumber}`;
                    chapterListContainer.appendChild(volumeHeader);
                    
                    const chaptersGrid = document.createElement('div');
                    chaptersGrid.className = 'chapters-grid';
                    
                    chaptersByVolume[volumeNumber].forEach(capitulo => {
                        const item = document.createElement('div');
                        item.className = 'chapter-item';
                        item.classList.toggle('read', capitulo.lido === 1);
                        const titleText = capitulo.titulo_capitulo ? `Cap. ${capitulo.numero} - ${capitulo.titulo_capitulo}` : `Capítulo ${capitulo.numero}`;
                        const randomDate = new Date(Date.now() - Math.random() * 1e10).toLocaleDateString('pt-BR');
                        item.innerHTML = `<span>${titleText}</span><span class="chapter-date">${randomDate}</span>`;
                        item.addEventListener('click', () => openReader(capitulo));
                        chaptersGrid.appendChild(item);
                    });
                    chapterListContainer.appendChild(chaptersGrid);
                });
            }
        } catch(error) {
            mangaDetailView.innerHTML = `<p>Erro ao carregar detalhes do mangá: ${error.message}</p>`;
            console.error(error);
        }
    }

    async function loadAndRenderFilters() {
        try {
            const response = await fetch(`${API_URL}/filters`);
            const filters = await response.json();
            filtersContainer.innerHTML = '';

            const clearButton = document.createElement('button');
            clearButton.type = 'button';
            clearButton.className = 'filter-button';
            clearButton.textContent = 'Limpar Filtros';
            clearButton.onclick = () => {
                state.activeFilters = {};
                searchInput.value = '';
                loadAndRenderFilters();
                renderLibraryView();
            };
            filtersContainer.appendChild(clearButton);

            filters.genres.forEach(genre => filtersContainer.appendChild(createFilterButton('genre', genre)));
            filters.statuses.forEach(status => filtersContainer.appendChild(createFilterButton('status', status)));
        } catch(error) {
            console.error("Erro ao carregar filtros", error);
        }
    }

    function createFilterButton(type, value) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'filter-button';
        button.textContent = value;
        button.dataset.filterType = type;
        button.dataset.filterValue = value;
        if (state.activeFilters[type] === value) button.classList.add('active');
        button.addEventListener('click', handleFilterClick);
        return button;
    }

    function handleFilterClick(event) {
        const { filterType, filterValue } = event.target.dataset;
        if (state.activeFilters[filterType] === filterValue) {
            delete state.activeFilters[filterType];
        } else {
            state.activeFilters[filterType] = filterValue;
        }
        loadAndRenderFilters();
        renderLibraryView();
    }

    async function openReader(capitulo) {
        state.reader.capitulo = capitulo;
        const capituloTitle = capitulo.titulo_capitulo ? `Cap. ${capitulo.numero} - ${capitulo.titulo_capitulo}` : `Capítulo ${capitulo.numero}`;
        try {
            const response = await fetch(`${API_URL}/capitulos/${capitulo.id}/content`);
            if (!response.ok) throw new Error('Conteúdo do capítulo não encontrado.');
            
            const data = await response.json();
            state.reader.type = data.tipo;
            state.reader.content = data.pages || data.url;
            
            viewerTitle.textContent = capituloTitle;
            viewerContent.innerHTML = '';
            
            if (state.reader.type === 'cbz') {
                viewerNav.classList.add('hidden');
                renderCbzContentAsWebtoon();
            } else if (state.reader.type === 'epub') {
                viewerNav.classList.remove('hidden');
                renderEpubContent();
            } else {
                viewerNav.classList.add('hidden');
                renderOtherContent();
            }
            appContainer.classList.add('hidden');
            viewerContainer.classList.remove('hidden');
            addViewerListeners();
            updateChapterNavButtons();
        } catch(error) {
            console.error('Erro ao abrir o leitor:', error);
            alert(`Não foi possível abrir o capítulo: ${error.message}`);
        }
    }

    function renderCbzContentAsWebtoon() {
        state.reader.content.forEach(pageUrl => {
            const img = document.createElement('img');
            img.className = 'webtoon-image';
            img.src = `${API_URL}${pageUrl}`;
            viewerContent.appendChild(img);
        });
    }

    function renderEpubContent() {
        paginatedNav.style.display = 'flex';
        const book = ePub(`${API_URL}${state.reader.content}`);
        const rendition = book.renderTo(viewerContent, { width: "100%", height: "100%" });
        state.reader.rendition = rendition;
        rendition.display();
        book.ready.then(() => {
            return book.locations.generate(1600);
        }).then(locations => {
            rendition.on("relocated", (location) => {
                try {
                    const current = book.locations.locationFromCfi(location.start.cfi);
                    const total = locations.length;
                    pageIndicator.textContent = `Localização ${current} de ${total}`;
                    prevPageBtn.disabled = current <= 1;
                    nextPageBtn.disabled = current >= total;
                } catch(e) {
                    pageIndicator.textContent = '';
                }
            });
        });
    }

    function renderOtherContent() {
        if (state.reader.type === 'pdf') {
            const pdfEmbed = document.createElement('iframe');
            pdfEmbed.src = `${API_URL}${state.reader.content}`;
            pdfEmbed.style.width = '100%';
            pdfEmbed.style.height = '100vh';
            viewerContent.appendChild(pdfEmbed);
        } else {
            viewerContent.innerHTML = `<div style="text-align:center; padding: 40px;"><p>Leitor para .${state.reader.type} não disponível.</p><a href="${API_URL}${state.reader.content}" target="_blank" download><button type="button">Baixar Arquivo</button></a></div>`;
        }
    }

    function closeReader() {
        viewerContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        state.reader.capitulo = null;
        removeViewerListeners();
    }
    
    async function toggleFavoriteStatus(mangaId, buttonElement) {
        try {
            const response = await fetch(`${API_URL}/mangas/${mangaId}/toggle-favorite`, { method: 'POST' });
            const data = await response.json();
            buttonElement.classList.toggle('active', data.favorito === 1);
        } catch (error) {
            console.error("Erro ao alterar favorito:", error);
        }
    }
    
    function updateChapterNavButtons() {
        const currentChapterId = state.reader.capitulo.id;
        const currentIndex = state.chapterList.findIndex(c => c.id === currentChapterId);
        prevChapterBtn.disabled = currentIndex <= 0;
        nextChapterBtn.disabled = currentIndex >= state.chapterList.length - 1;
    }

    function goToNextChapter() {
        const currentChapterId = state.reader.capitulo.id;
        const currentIndex = state.chapterList.findIndex(c => c.id === currentChapterId);
        const nextIndex = currentIndex + 1;
        if (nextIndex < state.chapterList.length) {
            const nextChapter = state.chapterList[nextIndex];
            openReader(nextChapter);
        }
    }

    function goToPreviousChapter() {
        const currentChapterId = state.reader.capitulo.id;
        const currentIndex = state.chapterList.findIndex(c => c.id === currentChapterId);
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
            const prevChapter = state.chapterList[prevIndex];
            openReader(prevChapter);
        }
    }

    async function deleteManga(mangaId, mangaTitle) {
        const confirmation = confirm(`Tem certeza que deseja excluir "${mangaTitle}"?\n\nEsta ação não pode ser desfeita e apagará permanentemente o mangá, a capa e todos os seus arquivos de capítulos.`);
        if (confirmation) {
            try {
                const response = await fetch(`${API_URL}/mangas/${mangaId}`, { method: 'DELETE' });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Ocorreu um erro no servidor.');
                }
                alert('Mangá excluído com sucesso!');
                goToHome(); 
            } catch (error) {
                alert(`Falha ao excluir o mangá: ${error.message}`);
                console.error('Falha ao excluir:', error);
            }
        }
    }

    function openEditModal(manga) {
        uploadForm.dataset.mode = 'edit';
        uploadForm.dataset.mangaId = manga.id;
        formTitle.textContent = 'Editar Informações do Mangá';
        uploadForm.querySelector('#tituloManga').value = manga.titulo;
        uploadForm.querySelector('#autor').value = manga.autor || '';
        uploadForm.querySelector('#genero').value = manga.genero || '';
        uploadForm.querySelector('#status').value = manga.status || 'Em andamento';
        uploadForm.querySelector('#ano_lancamento').value = manga.ano_lancamento || '';
        uploadForm.querySelector('#sinopse').value = manga.sinopse || '';
        uploadForm.querySelector('#caminho_capa_existente').value = manga.caminho_capa || '';
        chapterFieldset.classList.add('hidden');
        uploadForm.querySelector('#capituloFiles').required = false;
        uploadModal.classList.remove('hidden');
    }

    function openUploadModal() {
        uploadForm.dataset.mode = 'create';
        uploadForm.reset();
        capitulosDinamicosContainer.innerHTML = ''; 
        formTitle.textContent = 'Adicionar Novo Capítulo';
        chapterFieldset.classList.remove('hidden');
        uploadForm.querySelector('#capituloFiles').required = true;
        uploadModal.classList.remove('hidden');
    }

    function performSearch() {
        state.activeFilters.search = searchInput.value.trim();
        delete state.activeFilters.favorito;
        renderLibraryView();
    }

    const viewerActions = {
        next: () => { if(state.reader.rendition) { state.reader.rendition.next(); } },
        prev: () => { if(state.reader.rendition) { state.reader.rendition.prev(); } }
    };

    function addViewerListeners() {
        nextPageBtn.addEventListener('click', viewerActions.next);
        prevPageBtn.addEventListener('click', viewerActions.prev);
        closeViewerBtn.addEventListener('click', closeReader);
    }
    
    function removeViewerListeners() {
        nextPageBtn.removeEventListener('click', viewerActions.next);
        prevPageBtn.removeEventListener('click', viewerActions.prev);
        closeViewerBtn.removeEventListener('click', closeReader);
        if(state.reader.rendition) {
            state.reader.rendition.destroy();
            state.reader.rendition = null;
        }
    }

    function goToHome(event) {
        if (event) event.preventDefault();
        state.activeFilters = {};
        searchInput.value = '';
        state.currentView = 'library';
        render();
    }

    backButton.addEventListener('click', goToHome);
    homeLink.addEventListener('click', goToHome);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
            performSearch();
        }
    });
    favoritesBtn.addEventListener('click', () => {
        state.activeFilters = { favorito: 'true' };
        searchInput.value = '';
        state.currentView = 'library';
        render();
    });

    uploadForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submitButton = uploadForm.querySelector('button[type="submit"]');
        const mode = uploadForm.dataset.mode || 'create';
        const formData = new FormData();
        
        formData.append('tituloManga', document.getElementById('tituloManga').value);
        formData.append('autor', document.getElementById('autor').value);
        formData.append('genero', document.getElementById('genero').value);
        formData.append('status', document.getElementById('status').value);
        formData.append('ano_lancamento', document.getElementById('ano_lancamento').value);
        formData.append('sinopse', document.getElementById('sinopse').value);

        const capaInput = document.getElementById('capa');
        if (capaInput.files[0]) {
            formData.append('capa', capaInput.files[0]);
        }
        
        let url;
        let method;

        if (mode === 'edit') {
            const mangaId = uploadForm.dataset.mangaId;
            url = `${API_URL}/mangas/${mangaId}`;
            method = 'PUT';
            formData.append('caminho_capa_existente', document.getElementById('caminho_capa_existente').value);
        } else {
            url = `${API_URL}/upload`;
            method = 'POST';
            const files = capituloFilesInput.files;
            for (const file of files) {
                formData.append('capituloFiles', file);
            }
            document.querySelectorAll('[name="numeroVolume"]').forEach(input => formData.append('numeroVolume', input.value));
            document.querySelectorAll('[name="numeroCapitulo"]').forEach(input => formData.append('numeroCapitulo', input.value));
            document.querySelectorAll('[name="tituloCapitulo"]').forEach(input => formData.append('tituloCapitulo', input.value));
        }
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';
            const response = await fetch(url, { method: method, body: formData });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro desconhecido.');
            }
            alert('Operação realizada com sucesso!');
            uploadForm.reset();
            capitulosDinamicosContainer.innerHTML = '';
            uploadModal.classList.add('hidden');
            loadAndRenderFilters();
            if(state.currentView === 'mangaDetail') {
                renderMangaDetailView(state.mangaId);
            } else {
                renderLibraryView();
            }
        } catch(error) {
            alert(`Falha: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Enviar';
        }
    });

    openUploadModalBtn.addEventListener('click', openUploadModal);
    closeUploadModalBtn.addEventListener('click', () => uploadModal.classList.add('hidden'));
    uploadModal.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            uploadModal.classList.add('hidden');
        }
    });

    prevChapterBtn.addEventListener('click', goToPreviousChapter);
    nextChapterBtn.addEventListener('click', goToNextChapter);

    loadAndRenderFilters();
    render();
});