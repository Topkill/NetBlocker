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

    // SVG 图标
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

    // 4. 样式表 (绝对定位修复版)
    const cssContent = `
        /* 主容器永远保持球体大小，不随菜单变大，确保拖拽边界计算准确 */
        .floater {
            position: fixed;
            width: 48px; 
            height: 48px;
            z-index: 2147483647;
            user-select: none;
            font-family: system-ui, -apple-system, sans-serif;
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
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            position: relative;
            z-index: 2; /* 确保图标在菜单之上 */
        }

        .trigger-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 8px 25px rgba(0,0,0,0.4);
        }
        
        .trigger-icon:active {
            cursor: grabbing;
            transform: scale(0.95);
        }

        /* 菜单改为绝对定位，不占用文档流空间 */
        .menu {
            position: absolute;
            top: 0;
            display: flex;
            gap: 6px;
            background: rgba(20, 20, 20, 0.85);
            backdrop-filter: blur(10px);
            padding: 6px;
            border-radius: 12px;
            opacity: 0;
            pointer-events: none;
            visibility: hidden;
            transition: all 0.2s ease-out;
            border: 1px solid rgba(255,255,255,0.05);
            /* 允许按住菜单背景拖拽 */
            cursor: grab;
            height: 36px; /* 固定高度与按钮适配 */
            align-items: center;
        }
        
        /* 默认：菜单在左侧弹出 (Right Side 模式) */
        .menu.pop-left {
            right: 55px; /* 48px图标 + 间距 */
            left: auto;
            transform: translateX(10px) scale(0.95);
        }

        /* 菜单在右侧弹出 (Left Side 模式) */
        .menu.pop-right {
            left: 55px;
            right: auto;
            transform: translateX(-10px) scale(0.95);
        }

        .menu:active {
            cursor: grabbing;
        }
        
        .floater:hover .menu {
            opacity: 1;
            pointer-events: auto;
            visibility: visible;
            transform: translateX(0) scale(1);
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
            transition: all 0.2s;
            outline: none;
        }
        .action-btn:active { transform: scale(0.95); }

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

        // 辅助：更新菜单方向
        function updateMenuDirection(currentLeft) {
            const screenWidth = window.innerWidth;
            if (currentLeft < screenWidth / 2) {
                // 靠左，菜单向右弹
                menuDiv.classList.remove('pop-left');
                menuDiv.classList.add('pop-right');
            } else {
                // 靠右，菜单向左弹
                menuDiv.classList.remove('pop-right');
                menuDiv.classList.add('pop-left');
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
                wrapper.style.top = '80%';
                wrapper.style.left = '90%';
            }
        } else {
            wrapper.style.top = '80%';
            wrapper.style.left = '90%';
        }

        function createBtn(text, bgColor, textColor, onClick) {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = text;
            btn.style.background = bgColor;
            btn.style.color = textColor;
            // 阻止冒泡，避免拖拽
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

        const updateUI = () => {
            if (isOffline) {
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
            isOffline = offline;
            updateUI();
            chrome.runtime.sendMessage({ command: offline ? "enable_offline" : "disable_offline" });
        };

        // --- 拖拽逻辑 ---
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        // 监听 wrapper (包含图标和菜单)
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
                
                // 1. 计算新坐标
                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;
                
                // 2. 边界限制 (修复溢出问题的核心)
                // 容器宽度固定为48px，计算非常简单
                const maxLeft = window.innerWidth - 48; 
                const maxTop = window.innerHeight - 48;
                
                newLeft = Math.min(Math.max(0, newLeft), maxLeft);
                newTop = Math.min(Math.max(0, newTop), maxTop);
                
                wrapper.style.left = newLeft + 'px';
                wrapper.style.top = newTop + 'px';

                // 3. 实时更新菜单方向
                updateMenuDirection(newLeft);
            }
        }

        // 保存位置的核心逻辑
        function savePosition() {
            if (!wrapper) return;
            const rect = wrapper.getBoundingClientRect();
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ top: rect.top, left: rect.left }));
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            if (isDragging) {
                savePosition();
            }
        }

        // 修复：窗口失焦/切屏时强制保存 (防止位置重置)
        window.addEventListener('blur', () => {
            if (isDragging) {
                // 强制停止拖拽并保存
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
                savePosition();
                isDragging = false;
            }
        });

        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.command === "sync_online") {
                isOffline = false;
                updateUI();
            }
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createUI);
    } else {
        createUI();
    }
})();