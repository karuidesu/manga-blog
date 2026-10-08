const API_BASE = 'http://127.0.0.1:8000/api';
const postsContainer = document.getElementById('postsContainer');
const navLinks = document.querySelectorAll('#navLinks a');

document.addEventListener('DOMContentLoaded', () => {
    checkAuthUI();
    fetchPosts();
    setupCreatePost();
});

function checkAuthUI() {
    const token = localStorage.getItem('auth_token');
    const loginBtnNav = document.getElementById('loginBtnNav');
    const logoutBtn = document.getElementById('logoutBtn');

    if (token) {
        if (loginBtnNav) loginBtnNav.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    }
}

function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
}

async function fetchPosts() {
    try {
        const response = await fetch(`${API_BASE}/posts/`);
        if (!response.ok) throw new Error("API error");
        const data = await response.json();
        renderPosts(data);
    } catch (error) {
        setTimeout(() => renderPosts(getMockPosts()), 300);
    }
}

function renderPosts(posts) {
    if (!postsContainer) return;
    postsContainer.innerHTML = '';

    if (posts.length === 0) {
        postsContainer.innerHTML = '<div style="text-align:center; padding: 3rem; color: var(--text-muted);">Aucun post trouvé...</div>';
        return;
    }

    posts.forEach((post) => {
        const date = new Date(post.created_at).toLocaleDateString('fr-FR', {
            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        const authorName = post.author ? post.author.username : 'OtakuDu93';
        const likes = post.likes_count || 0;
        const flames = post.flames_count || 0;

        const postEl = document.createElement('div');
        postEl.className = 'post card';

        postEl.innerHTML = `
            <div class="post-header">
                <div class="avatar-small"><i class="fa-solid fa-user"></i></div>
                <div>
                    <div class="post-author">${authorName}</div>
                    <div class="post-date">${date}</div>
                </div>
            </div>
            <div class="post-content">
                ${post.title ? `<h4>${post.title}</h4>` : ''}
                <p>${post.content}</p>
                ${post.image ? `
                    <div class="post-image-container">
                        <img src="${post.image}" alt="Post image">
                    </div>
                ` : ''}
            </div>
            <div class="post-footer">
                <button class="reaction-btn like-btn" onclick="toggleReaction(this, 'like', ${post.id})">
                    <i class="fa-solid fa-heart"></i> <span>${likes}</span>
                </button>
                <button class="reaction-btn flame-btn" onclick="toggleReaction(this, 'flame', ${post.id})">
                    <i class="fa-solid fa-fire"></i> <span>${flames}</span>
                </button>
                <button class="reaction-btn comment-btn" onclick="toggleComments(${post.id})">
                    <i class="fa-solid fa-comment"></i> <span>${post.comments ? post.comments.length : 0}</span>
                </button>
            </div>
            <div class="comments-section" id="comments-${post.id}" style="display: none; padding: 1rem; border-top: 1px solid var(--border-color); background: var(--bg-hover);">
                <div class="comments-list" style="margin-bottom: 1rem; max-height: 200px; overflow-y: auto;">
                    ${post.comments && post.comments.length > 0 ? post.comments.map(c => `
                        <div style="margin-bottom: 0.5rem; font-size: 0.9rem;">
                            <strong>${c.author.username}</strong>: ${c.content}
                        </div>
                    `).join('') : '<div style="color:var(--text-muted); font-size: 0.9rem;">Aucun commentaire. Soyez le premier !</div>'}
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" id="comment-input-${post.id}" style="flex:1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; outline:none;" placeholder="Écrire un commentaire...">
                    <button class="btn btn-primary" style="padding: 0.5rem 1rem;" onclick="addComment(${post.id}, this)">Envoyer</button>
                </div>
            </div>
        `;

        postsContainer.appendChild(postEl);
    });
}

function toggleComments(postId) {
    const el = document.getElementById(`comments-${postId}`);
    if (el.style.display === 'none') {
        el.style.display = 'block';
    } else {
        el.style.display = 'none';
    }
}

async function addComment(postId, btn) {
    const input = document.getElementById(`comment-input-${postId}`);
    if (!input.value.trim()) return;

    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast("Tu dois être connecté pour commenter.", 'default', 'fa-lock');
        return;
    }

    btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/posts/${postId}/comment/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ content: input.value })
        });

        if (res.ok) {
            showToast("Commentaire ajouté !", 'success', 'fa-check');
            fetchPosts(); // On recharge pour voir le commentaire
        } else {
            showToast("Erreur lors de l'ajout.", 'default', 'fa-times');
            btn.disabled = false;
        }
    } catch (err) {
        showToast("Serveur injoignable.", 'default', 'fa-times');
        btn.disabled = false;
    }
}

async function toggleReaction(btn, type, postId) {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        showToast("Tu dois être connecté pour réagir.", 'default', 'fa-lock');
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/posts/${postId}/react/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
            },
            body: JSON.stringify({ reaction_type: type })
        });

        if (res.ok) {
            fetchPosts(); // Recharge silencieusement pour update les compteurs
        }
    } catch (err) {
        console.error(err);
    }
}

function setupCreatePost() {
    const btn = document.getElementById('submitPostBtn');
    const input = document.getElementById('postInput');
    if (!btn || !input) return;
    const imageInput = document.getElementById('postImageInput');
    const imagePreview = document.getElementById('imagePreview');

    if (imageInput && imagePreview) {
        imageInput.addEventListener('change', () => {
            if (imageInput.files.length > 0) {
                imagePreview.textContent = `Image sélectionnée : ${imageInput.files[0].name}`;
                imagePreview.style.display = 'block';
            } else {
                imagePreview.style.display = 'none';
            }
        });
    }

    btn.addEventListener('click', async () => {
        if (input.value.trim() === '') {
            showToast("Tu n'as rien écrit...", 'default', 'fa-exclamation-circle text-secondary');
            return;
        }

        const token = localStorage.getItem('auth_token');
        if (!token) {
            showToast("Tu dois être connecté pour poster.", 'default', 'fa-lock');
            setTimeout(() => window.location.href = 'login.html', 1500);
            return;
        }

        const originalContent = btn.innerHTML;
        btn.innerHTML = 'Envoi...';
        btn.disabled = true;

        try {
            let formData = new FormData();
            formData.append('title', "");
            formData.append('content', input.value);
            
            if (imageInput && imageInput.files.length > 0) {
                formData.append('image', imageInput.files[0]);
            }

            const res = await fetch(`${API_BASE}/posts/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${token}`
                },
                body: formData
            });

            if (res.ok) {
                input.value = '';
                if (imageInput) imageInput.value = '';
                if (imagePreview) imagePreview.style.display = 'none';
                showToast("Posté avec succès !", 'success', 'fa-check');
                fetchPosts(); // Refresh list
            } else {
                showToast("Erreur lors de la publication.", 'default', 'fa-triangle-exclamation');
            }
        } catch (err) {
            showToast("Serveur injoignable.", 'default', 'fa-triangle-exclamation');
        }

        btn.innerHTML = originalContent;
        btn.disabled = false;
    });
}

function showToast(message, type = 'default', iconClass = 'fa-info-circle text-secondary') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');

    toast.className = `toast ${type === 'flame' ? 'toast-flame' : type === 'success' ? 'toast-success' : ''}`;
    toast.innerHTML = `
        <i class="fa-solid ${iconClass}"></i>
        <div>${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (container.contains(toast)) container.removeChild(toast);
        }, 300);
    }, 2500);
}

function getMockPosts() {
    return [
        {
            id: 1,
            title: "La fin de Jujutsu Kaisen, on en parle ? (2024)",
            content: "Gege Akutami a enfin terminé l'oeuvre avec le chapitre 271. Le combat contre Sukuna dans Shinjuku était interminable mais bordel, la conclusion de Yuji est parfaite. Vous en avez pensé quoi de la fin ?",
            author: { username: "Ryomen_Fan" },
            image: "assets/jjk_placeholder.jpg",
            created_at: new Date().toISOString(),
            likes_count: 512,
            flames_count: 89,
            comments: [1, 2, 3, 4, 5, 6, 7]
        },
        {
            id: 2,
            title: "Boruto Two Blue Vortex est une masterclass inattendue.",
            content: "Le design de Boruto ado, le Rasengan Uzuhiko, et maintenant les clones de Shinju (Jura et compagnie)... Kishimoto a vraiment repris les choses en main. C'est 100x mieux que la première partie !",
            author: { username: "Uzumaki_Goat" },
            image: "assets/boruto.jpeg",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            likes_count: 245,
            flames_count: 156,
            comments: [1, 2, 3, 4]
        },
        {
            id: 3,
            content: "One Piece sur l'île d'Elbaf enfin !!! Après l'arc Egghead et le message fou de Vegapunk sur le monde qui coule, voir les Mugiwaras chez les géants en 2024 c'est un rêve de 25 ans qui se réalise.",
            author: { username: "JoyBoy2024" },
            image: "assets/one_piece_2023.jpg",
            created_at: new Date(Date.now() - 7200000).toISOString(),
            likes_count: 890,
            flames_count: 320,
            comments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        {
            id: 4,
            title: "L'arc final de Black Clover est dingue",
            content: "Asta vs Lucius Zogratis, les combats s'enchaînent de fou furieux. Dommage que les sorties soient devenues trimestrielles dans le Jump GIGA, l'attente est longue 😩",
            author: { username: "Asta_WizardKing" },
            image: "assets/black_clover.jpeg",
            created_at: new Date(Date.now() - 86400000).toISOString(),
            likes_count: 134,
            flames_count: 45,
            comments: [1, 2, 3]
        },
        {
            id: 5,
            title: "Saison finale de Dr. Stone annoncée !",
            content: "La saison 4 'Science Future' arrive. J'ai trop hâte de voir Senku construire la fusée pour aller sur la lune. Et le spin-off 4D Science était super cool aussi pour fêter l'anniversaire.",
            author: { username: "Senku_10BillionPercent" },
            image: "assets/dr_stone.png",
            created_at: new Date(Date.now() - 172800000).toISOString(),
            likes_count: 420,
            flames_count: 69,
            comments: [1, 2]
        }
    ];
}
