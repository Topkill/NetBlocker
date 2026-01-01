// @ts-nocheck
(function() {
    // 1. 防止重复注入
    if (window['hasNetBlockerUI']) return;
    window['hasNetBlockerUI'] = true;

    const STORAGE_KEY = 'net_blocker_pos_' + window.location.hostname;
    let isOffline = false;

    const CONFIG = {
        iconSize: '24px',        
        onlineColor: '#4ade80',  
        onlineBg: 'rgba(30, 30, 35, 0.9)', 
        offlineColor: '#ffffff', 
        offlineBg: '#ef4444'     
    };

    const SVG_ONLINE = `
        <svg viewBox="0 0 1024 1024" width="${CONFIG.iconSize}" height="${CONFIG.iconSize}" fill="currentColor" style="display:block;">
            <path d="M0 352.832l93.12 98.752c231.296-245.44 606.464-245.44 837.76 0L1024 352.832C741.44 53.056 283.008 53.056 0 352.832z m372.352 395.008L512 896l139.648-148.16c-76.8-81.92-202.048-81.92-279.296 0zM186.24 550.4l93.12 98.752c128.448-136.32 336.96-136.32 465.408 0L837.824 550.4c-179.648-190.592-471.488-190.592-651.648 0z"></path>
        </svg>`;

    const SVG_OFFLINE = `
        <svg viewBox="0 0 1339 1024" width="${CONFIG.iconSize}" style="height: auto; display:block;" fill="currentColor">
            <g stroke="currentColor" stroke-width="60" stroke-linejoin="round"> 
                <path d="M660.61538469 632c-66.01846125 0-126.01846125 24-171.02769281 62.99076938a45.63692344 45.63692344 0 0 1-60.00000001 0c-21.04615406-17.98153875-18.01846125-50.99076937 2.95384688-69.00923063 42.05538469-35.96307656 93.04615406-59.96307656 150.05538469-74.95384687l78.01846125 80.97230812zM393.55076938 365.00923062A614.76923062 614.76923062 0 0 0 246.52307656 466.95384594a47.07692344 47.07692344 0 0 0 0 66.01846218c18.01846125 14.99076938 45.04615406 14.99076938 60.03692344 0a515.92615406 515.92615406 0 0 1 153.00923063-99.02769281L393.55076938 365.04615406zM195.56923062 166.99076938C141.51384594 200 90.52307656 241.98153875 45.51384594 286.99076937a47.07692344 47.07692344 0 0 0 0 66.01846125c17.98153875 14.99076938 45.00923063 14.99076938 60 0 45.00923063-45.00923063 96-86.99076937 153.04615406-120L195.53230812 166.99076938z m1077.19384594 119.99999999C1116.68923063 128 900.65230812 32 660.61538469 32c-90.01846125 0-180.03692344 14.99076938-261.04615406 38.99076937l71.99999999 72.00000001a776.78769187 776.78769187 0 0 1 189.04615407-24 777.74769187 777.74769187 0 0 1 552.11076937 227.99999999c18.01846125 18.01846125 45.00923063 18.01846125 60 1e-8 18.01846125-12 21.04615406-41.98153875 0-60z m-612.11076843 15.02769188h-30.01846219l93.04615406 92.97230812a526.30153875 526.30153875 0 0 1 288.03692344 135.02769188 45.63692344 45.63692344 0 0 0 60 0c21.04615406-18.01846125 21.04615406-48 0-66.01846125-108-98.99076937-252.03692344-161.98153875-411.06461531-161.98153875z m0 509.98153875c-50.99076937 0-90.01846125 38.99076937-90.01846219 90.01846125 0 50.95384594 39.02769187 89.98153875 90.01846219 89.98153875 51.02769188 0 90.01846125-38.99076937 90.01846125-90.01846125 0-50.95384594-42.01846125-89.98153875-90.01846125-89.98153875z m246.05538375-146.99076938l-84.0369225-84-189.04615407-189.00923062L552.61538469 310.99076938l-147.02769282-146.99076938-69.04615312-69.00923063L285.55076937 44a49.73538469 49.73538469 0 0 0-63.02769281 0 47.07692344 47.07692344 0 0 0 0 65.98153875l27.02769281 27.02769187L315.56923063 202.95384594l180.03692343 180 29.98153782 30.01846219 357.04615406 356.97230718a43.53230813 43.53230813 0 0 0 63.02769281 0 43.49538469 43.49538469 0 0 0 0-62.99076937l-38.99076937-41.98153781z"></path>
            </g>
        </svg>`;

    const cssContent = `
        .floater {
            position: fixed;
            width: 48px; 
            height: 48px;
            z-index: 2147483647;
            user-select: none;
            font-family: system-ui, -apple-system, sans-serif;
            /* 移除 left/top 的 transition，防止拖拽和 resize 时有延迟感，让跟随更紧手 */
        }

        .trigger-icon {
            width: 48px;
            height: 48px;
            background: ${CONFIG.onlineBg};
            color: ${CONFIG.onlineColor};
            backdrop-filter: blur(5px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            z-index: 2;
        }

        .trigger-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        }
        .trigger-icon:active {
            cursor: grabbing;
            transform: scale(0.95);
        }

        .menu {
            position: absolute;
            top: 6px; 
            display: flex;
            align-items: center;
            background: rgba(20, 20, 20, 0.9);
            backdrop-filter: blur(10px);
            padding: 4px 12px;
            border-radius: 20px;
            border: 1px solid rgba(255,255,255,0.05);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            
            opacity: 0;
            pointer-events: none;
            visibility: hidden;
            transition: opacity 0.2s ease 0.5s, transform 0.2s ease 0.5s, visibility 0s linear 0.5s;
            cursor: grab;
            height: 36px;
            white-space: nowrap;
        }
        
        .menu.pop-left {
            right: 52px; left: auto;
            transform: translateX(10px) scale(0.95);
        }
        .menu.pop-right {
            left: 52px; right: auto;
            transform: translateX(-10px) scale(0.95);
        }

        .floater:hover .menu,
        .menu:hover {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
            transform: translateX(0) scale(1);
            transition: opacity 0.2s ease 0s, transform 0.2s ease 0s, visibility 0s linear 0s;
        }

        .action-btn {
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            color: white;
            background: #ef4444;
            white-space: nowrap;
        }
        
        .status-text {
            font-size: 12px;
            color: #ccc;
            font-weight: 500;
            pointer-events: none;
            user-select: none;
        }

        .floater.offline .trigger-icon {
            background: ${CONFIG.offlineBg};
            color: ${CONFIG.offlineColor};
            box-shadow: 0 0 10px rgba(239, 68, 68, 0.5); 
        }
    `;

    function createUI() {
        const hostDiv = document.createElement('div');
        hostDiv.style.cssText = "position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;";
        const shadow = hostDiv.attachShadow({mode: 'open'});
        const styleTag = document.createElement('style');
        styleTag.textContent = cssContent;
        shadow.appendChild(styleTag);

        const wrapper = document.createElement('div');
        wrapper.className = 'floater';

        const triggerDiv = document.createElement('div');
        triggerDiv.className = 'trigger-icon';
        triggerDiv.innerHTML = SVG_ONLINE;

        const menuDiv = document.createElement('div');
        menuDiv.className = 'menu pop-left';

        function updateMenuDirection(currentLeft) {
            if (currentLeft < window.innerWidth / 2) {
                menuDiv.classList.replace('pop-left', 'pop-right');
            } else {
                menuDiv.classList.replace('pop-right', 'pop-left');
            }
        }

        // === 核心函数：强制归位 ===
        // 无论初始化还是窗口调整，都调用这个函数确保不越界
        function clampPosition(top, left) {
            const maxLeft = window.innerWidth - 48; // 48是球体宽度
            const maxTop = window.innerHeight - 48;
            
            // 限制在屏幕内
            let safeLeft = Math.min(Math.max(0, left), maxLeft);
            let safeTop = Math.min(Math.max(0, top), maxTop);
            
            wrapper.style.left = safeLeft + 'px';
            wrapper.style.top = safeTop + 'px';
            updateMenuDirection(safeLeft);
        }

        // 初始化
        const savedPos = localStorage.getItem(STORAGE_KEY);
        let initLeft = window.innerWidth - 60;
        let initTop = window.innerHeight * 0.8;

        if (savedPos) {
            try {
                const { top, left } = JSON.parse(savedPos);
                initLeft = left;
                initTop = top;
            } catch(e) {}
        }
        clampPosition(initTop, initLeft);

        // === 🚀 新增：窗口缩放监听 (Resize Listener) ===
        // 当浏览器窗口大小改变时，自动把球推回屏幕内
        let resizeTimeout;
        window.addEventListener('resize', () => {
            // 节流处理，避免频繁计算
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                const rect = wrapper.getBoundingClientRect();
                clampPosition(rect.top, rect.left);
            }, 50); // 50ms 延迟足够流畅
        });

        // 渲染菜单
        function renderMenu(isOff) {
            menuDiv.innerHTML = '';
            if (!isOff) {
                const btn = document.createElement('button');
                btn.className = 'action-btn';
                btn.textContent = '断网';
                btn.addEventListener('mousedown', (e) => e.stopPropagation());
                btn.onclick = () => sendCommand(true);
                menuDiv.appendChild(btn);
            } else {
                const text = document.createElement('span');
                text.className = 'status-text';
                text.textContent = '点击顶部 "取消" 恢复';
                menuDiv.appendChild(text);
            }
        }
        renderMenu(false);

        menuDiv.appendChild(document.createTextNode('')); 
        wrapper.appendChild(triggerDiv);
        wrapper.appendChild(menuDiv);
        shadow.appendChild(wrapper);
        (document.body || document.documentElement).appendChild(hostDiv);

        const updateUI = (offline) => {
            if (offline) {
                wrapper.classList.add('offline');
                triggerDiv.innerHTML = SVG_OFFLINE;
                renderMenu(true);
            } else {
                wrapper.classList.remove('offline');
                triggerDiv.innerHTML = SVG_ONLINE;
                renderMenu(false);
            }
        };

        const sendCommand = (offline) => {
            if (isOffline === offline) return;
            chrome.runtime.sendMessage({ command: offline ? "enable_offline" : "disable_offline" });
            isOffline = offline;
            updateUI(offline);
        };

        // 监听断开
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.command === "sync_online") {
                if (!isOffline) return;
                isOffline = false;
                updateUI(false);
            }
        });

        // 拖拽逻辑
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        wrapper.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            isDragging = false;
            startX = e.clientX;
            startY = e.clientY;
            const rect = wrapper.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        });

        function onMouseMove(e) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                isDragging = true;
                requestAnimationFrame(() => {
                    const newLeft = initialLeft + dx;
                    const newTop = initialTop + dy;
                    // 拖拽时直接调用 clampPosition 实时限制
                    clampPosition(newTop, newLeft);
                });
            }
        }

        function savePosition() {
            if (!wrapper) return;
            const rect = wrapper.getBoundingClientRect();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ top: rect.top, left: rect.left }));
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (isDragging) savePosition();
        }

        window.addEventListener('blur', () => {
            if (isDragging) {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                savePosition();
                isDragging = false;
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createUI);
    } else {
        createUI();
    }
})();