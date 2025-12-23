/// <reference path="./plugin.d.ts" />

function init() {
    $ui.register((ctx) => {
        ctx.newTray({
            tooltipText: "Anime News",
            iconUrl: "https://raw.githubusercontent.com/SyntaxSama/aninewsnet-seanime/refs/heads/main/animenewsnetwork.png",
            withContent: false,
        });

        function getInjectedScript() {
            return `
            (function() {
                const DIVIDER_SELECTOR = 'div[data-home-screen-item-divider="true"].h-8';
                const ANN_ICON = "https://raw.githubusercontent.com/SyntaxSama/aninewsnet-seanime/refs/heads/main/animenewsnetwork.png";
                
                const style = document.createElement('style');
                style.textContent = \`
                    @keyframes aniModalIn {
                        from { opacity: 0; transform: scale(0.95) translateY(10px); }
                        to { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes aniFadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    /* Gradient Text Animation */
                    @keyframes shimmer {
                        0% { background-position: -200% center; }
                        100% { background-position: 200% center; }
                    }
                    .loading-gradient {
                        background: linear-gradient(90deg, #495057 25%, #f8f9fa 50%, #495057 75%);
                        background-size: 200% auto;
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        animation: shimmer 2s linear infinite;
                        font-weight: 600;
                        display: inline-block;
                    }
                    .ani-modal-overlay { animation: aniFadeIn 0.2s ease-out forwards; }
                    .ani-modal-content { animation: aniModalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                    .ani-modal-overlay.closing { animation: aniFadeIn 0.2s ease-in reverse forwards; }
                    .ani-modal-content.closing { animation: aniModalIn 0.2s ease-in reverse forwards; }
                \`;
                document.head.appendChild(style);

                async function scrapeNews() {
                    const proxyUrl = (url) => \`https://corsproxy.io/?url=\${encodeURIComponent(url)}\`;
                    
                    try {
                        const res = await fetch(proxyUrl("https://www.animenewsnetwork.com/all/rss.xml"));
                        const txt = await res.text();
                        const xmlDoc = new DOMParser().parseFromString(txt, "text/xml");
                        const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 8);

                        const processedItems = [];
                        for (const item of items) {
                            const title = item.querySelector("title")?.textContent || "No Title";
                            const link = item.querySelector("link")?.textContent || "#";
                            const description = item.querySelector("description")?.textContent || "";
                            
                            let imageUrl = "";
                            try {
                                const artRes = await fetch(proxyUrl(link));
                                const artHtml = await artRes.text();
                                const imgMatch = artHtml.match(/<link rel="feed_image" href="([^"]+)"/);
                                imageUrl = imgMatch ? imgMatch[1] : "";
                            } catch(e) {}

                            processedItems.push({ title, link, description, image: imageUrl });
                        }
                        renderCards(processedItems);
                    } catch (err) {
                        const grid = document.getElementById("aninews-grid");
                        if(grid) grid.innerHTML = '<p style="color: #fa5252;">Failed to load news.</p>';
                    }
                }

                function renderCards(newsItems) {
                    const grid = document.getElementById("aninews-grid");
                    if (!grid) return;
                    grid.innerHTML = newsItems.map((item, idx) => \`
                        <div style="position: relative; overflow: hidden; background: #1a1b1e; border: 1px solid #2c2e33; border-radius: 12px; min-height: 200px; display: flex; flex-direction: column; box-shadow: 0 4px 15px rgba(0,0,0,0.3);">
                            <div style="position: absolute; inset: 0; background-image: url('\${item.image}'); background-size: cover; background-position: center; filter: blur(6px) brightness(0.35); transform: scale(1.1); z-index: 0;"></div>
                            <div style="position: relative; z-index: 1; padding: 20px; flex: 1; display: flex; flex-direction: column; background: rgba(20, 21, 23, 0.5); backdrop-filter: blur(4px);">
                                <h3 style="font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 10px 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">\${item.title}</h3>
                                <p style="font-size: 12px; color: #ced4da; margin: 0; line-height: 1.5; flex: 1; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">\${item.description.replace(/<[^>]*>/g, '')}</p>
                                <button class="read-post-btn" data-idx="\${idx}" style="margin-top: 15px; background: #339af0; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 700; width: fit-content;">Read post</button>
                            </div>
                        </div>
                    \`).join('');

                    grid.querySelectorAll('.read-post-btn').forEach(btn => {
                        btn.onclick = () => openModal(newsItems[btn.dataset.idx]);
                    });
                }

                function openModal(item) {
                    const overlay = document.createElement('div');
                    overlay.className = "ani-modal-overlay";
                    overlay.style.cssText = "position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;";
                    
                    overlay.innerHTML = \`
                        <div class="ani-modal-content" style="background: #141517; border: 1px solid #373a40; width: 100%; max-width: 650px; max-height: 90vh; border-radius: 16px; position: relative; color: #ced4da; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 20px 50px rgba(0,0,0,0.6);">
                            <div style="position: relative; width: 100%; flex-shrink: 0; background: #000;">
                                \${item.image ? \`<img src="\${item.image}" style="width: 100%; max-height: 280px; object-fit: cover; display: block;">\` : ''}
                                <div style="position: absolute; bottom: 0; left: 0; right: 0; height: 40px; background: linear-gradient(transparent, #141517);"></div>
                                <button id="close-ani-modal" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.7); border: none; color: #fff; width: 34px; height: 34px; border-radius: 50%; font-size: 22px; cursor: pointer; z-index: 11;">&times;</button>
                            </div>
                            <div style="padding: 20px 30px 30px 30px; overflow-y: auto; flex-grow: 1;">
                                <h2 style="color: #fff; margin: 0 0 15px 0; font-size: 1.5rem; line-height: 1.3; font-weight: 800;">\${item.title}</h2>
                                <div style="line-height: 1.8; font-size: 15px; color: #b8b8b8; white-space: pre-wrap;">\${item.description}</div>
                                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #2c2e33; text-align: right;">
                                    <a href="\${item.link}" target="_blank" style="display: inline-flex; align-items: center; gap: 8px; background: #339af0; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 700;">
                                        Read full article <span>→</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    \`;

                    const closeModal = () => {
                        overlay.classList.add('closing');
                        overlay.querySelector('.ani-modal-content').classList.add('closing');
                        setTimeout(() => overlay.remove(), 200);
                    };

                    document.body.appendChild(overlay);
                    overlay.querySelector('#close-ani-modal').onclick = closeModal;
                    overlay.onclick = (e) => { if(e.target === overlay) closeModal(); };
                }

                function injectUI() {
                    if (window.location.pathname !== "/" && !window.location.href.includes("43211")) return;
                    const divider = document.querySelector(DIVIDER_SELECTOR);
                    if (!divider || document.getElementById("aninews-root")) return;

                    const container = document.createElement('div');
                    container.id = "aninews-root";
                    container.style.cssText = "margin: 30px 0; padding: 0 10px; font-family: sans-serif;";
                    container.innerHTML = \`
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 20px;">
                            <img src="\${ANN_ICON}" style="width: 24px; height: 24px;">
                            <h2 style="font-size: 1.3rem; color: #fff; margin: 0; font-weight: 700;">Latest Anime News</h2>
                        </div>
                        <div id="aninews-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;">
                            <p class="loading-gradient">Fetching latest news from ANN...</p>
                        </div>
                    \`;
                    divider.insertAdjacentElement('afterend', container);
                    scrapeNews();
                }

                const observer = new MutationObserver(injectUI);
                observer.observe(document.body, { childList: true, subtree: true });
                injectUI();
            })();
            `;
        }

        async function run() {
            const body = await ctx.dom.queryOne("body");
            if (body) {
                const script = await ctx.dom.createElement("script");
                script.setText(getInjectedScript());
                body.append(script);
            }
        }
        run();
    });
}
