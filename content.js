// @ts-nocheck
(function() {
    // 1. 防止重复注入
    if (window['hasNetBlockerUI']) return;
    window['hasNetBlockerUI'] = true;

    const STORAGE_KEY = 'net_blocker_pos_' + window.location.hostname;
    // 状态缓存，防止重复刷新
    let currentOfflineState = false;

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

    // 4. 样式表 (交互优化版)
    const cssContent = `
        /* 主容器 */
        .floater {
            position: fixed;
            width: 48px; 
            height: 48px;
            z-index: 2147483647;
            user-select: none;
            font-family: system-ui, -apple-system, sans-serif;
        }

        /* 核心球体 */
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
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            z-index: 2; /* 确保在菜单之上 */
        }

        .trigger-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        }
        
        .trigger-icon:active {
            cursor: grabbing;
            transform: scale(0.95);
        }

        /* 菜单 (交互修复核心) */
        .menu {
            position: absolute;
            top: 0;
            display: flex;
            gap: 6px;
            background: rgba(20, 20, 20, 0.9);
            backdrop-filter: blur(10px);
            padding: 6px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
            cursor: grab;
            height: 36px;
            align-items: center;

            /* 默认状态：隐藏 */
            opacity: 0;
            visibility: hidden;
            
            /* 🔥 关键修复：关闭菜单时延迟 0.3秒 */
            /* 这给了你充足的时间跨越图标和菜单之间的缝隙 */
            transition: opacity 0.2s ease 0.3s, transform 0.2s ease 0.3s, visibility 0s linear 0.3s;
        }
        
        /* 菜单弹出方向 */
        .menu.pop-left {
            right: 55px; left: auto;
            transform: translateX(10px) scale(0.95);
        }
        .menu.pop-right {
            left: 55px; right: auto;
            transform: translateX(-10px) scale(0.95);
        }

        /* 悬停状态 (包括悬停球体 OR 悬停菜单本身) */
        .floater:hover .menu,
        .menu:hover {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
            transform: translateX(0) scale(1);
            
            /* 🔥 关键修复：打开菜单时无延迟 (0s) */
            transition: opacity 0.2s ease 0s, transform 0.2s ease 0s, visibility 0s linear 0s;
        }

        .action-btn {
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            color: white;
            white-space: nowrap;
            transition: opacity 0.2s; 
        }

        /* 断网样式 */
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
        menuDiv.className = 'menu pop-left'; // 默认左弹

        // 动态调整菜单弹出方向
        function updateMenuDirection(currentLeft) {
            if (currentLeft < window.innerWidth / 2) {
                // 靠左 -> 向右弹
                menuDiv.classList.replace('pop-left', 'pop-right');
            } else {
                // 靠右 -> 向左弹
                menuDiv.classList.replace('pop-right', 'pop-left');
            }
        }

        // 初始化位置
        const savedPos = localStorage.getItem(STORAGE_KEY);
        if (savedPos) {
            try {
                const { top, left } = JSON.parse(savedPos);
                wrapper.style.top = top + 'px';
                wrapper.style.left = left + 'px';
                updateMenuDirection(left);
            } catch(e) {
                wrapper.style.top = '80%'; wrapper.style.left = '90%';
            }
        } else {
            wrapper.style.top = '80%'; wrapper.style.left = '90%';
        }

        function createBtn(text, bgColor, textColor, onClick) {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = text;
            btn.style.background = bgColor;
            btn.style.color = textColor;
            btn.addEventListener('mousedown', (e) => e.stopPropagation());
            btn.onclick = onClick;
            return btn;
        }

        const btnOff = createBtn('断网', '#ef4444', '#fff', () => sendCommand(true));
        const btnOn = createBtn('联网', 'rgba(255,255,255,0.1)', '#fff', () => sendCommand(false));

        menuDiv.appendChild(btnOff);
        menuDiv.appendChild(btnOn);
        wrapper.appendChild(triggerDiv);
        wrapper.appendChild(menuDiv);
        shadow.appendChild(wrapper);
        (document.body || document.documentElement).appendChild(hostDiv);

        const updateUI = (offline) => {
            if (offline) {
                wrapper.classList.add('offline');
                triggerDiv.innerHTML = SVG_OFFLINE;
                btnOff.style.opacity = '0.5'; btnOff.style.cursor = 'default';
                btnOn.style.background = '#22c55e'; btnOn.style.opacity = '1'; btnOn.style.cursor = 'pointer';
            } else {
                wrapper.classList.remove('offline');
                triggerDiv.innerHTML = SVG_ONLINE;
                btnOff.style.background = '#ef4444'; btnOff.style.opacity = '1'; btnOff.style.cursor = 'pointer';
                btnOn.style.background = 'rgba(255,255,255,0.1)'; btnOn.style.opacity = '0.5'; btnOn.style.cursor = 'default';
            }
        };

        const sendCommand = (offline) => {
            if (currentOfflineState === offline) return;
            chrome.runtime.sendMessage({ command: offline ? "enable_offline" : "disable_offline" });
            currentOfflineState = offline;
            isOffline = offline;
            updateUI(offline);
        };

        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.command === "sync_online") {
                if (currentOfflineState === false) return;
                currentOfflineState = false;
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
                    const maxLeft = window.innerWidth - 48; 
                    const maxTop = window.innerHeight - 48;
                    let newLeft = Math.min(Math.max(0, initialLeft + dx), maxLeft);
                    let newTop = Math.min(Math.max(0, initialTop + dy), maxTop);
                    
                    wrapper.style.left = newLeft + 'px';
                    wrapper.style.top = newTop + 'px';
                    updateMenuDirection(newLeft);
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