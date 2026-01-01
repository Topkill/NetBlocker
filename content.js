// @ts-nocheck
(function() {
    // 1. 防止重复注入
    if (window['hasNetBlockerUI']) return;
    window['hasNetBlockerUI'] = true;

    // 2. 配置与状态
    const STORAGE_KEY = 'net_blocker_pos_' + window.location.hostname;
    let isOffline = false;

    // 3. SVG 图标路径 (高颜值核心)
    const SVG_ONLINE = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M12 3C7.79 3 3.7 4.41 0.38 7.17C0.13 7.39 0.11 7.78 0.34 8.04L11.08 20.81C11.57 21.39 12.43 21.39 12.92 20.81L23.66 8.04C23.89 7.78 23.87 7.39 23.62 7.17C20.3 4.41 16.21 3 12 3Z" />
        </svg>`;

    const SVG_OFFLINE = `
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M23.62 7.17C20.3 4.41 16.21 3 12 3C10.46 3 8.95 3.19 7.5 3.54L20.84 18.39L23.66 8.04C23.89 7.78 23.87 7.39 23.62 7.17Z" opacity="0.3"/>
            <path d="M4.69 4.14L2.81 2.27C2.61 2.07 2.3 2.07 2.1 2.27L1.39 2.97C1.19 3.17 1.19 3.48 1.39 3.68L6.2 8.49L0.34 8.04C0.11 7.78 0.13 7.39 0.38 7.17C2.08 5.75 4.02 4.71 6.11 4.06L4.69 4.14Z" opacity="0.3"/>
            <path d="M9.83 12.11L11.08 20.81C11.57 21.39 12.43 21.39 12.92 20.81L16.03 17.11L9.83 12.11Z" />
        </svg>`;

    // 4. 创建样式表 (Inject CSS - iOS 风格)
    const cssContent = `
        .floater {
            position: fixed;
            display: flex;
            align-items: center;
            flex-direction: row-reverse;
            gap: 10px;
            user-select: none;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            z-index: 2147483647;
            transition: opacity 0.3s;
        }
        
        /* 核心球体样式 */
        .trigger-icon {
            width: 46px;
            height: 46px;
            /* 联网状态：深色毛玻璃 + 科技蓝微光 */
            background: rgba(30, 30, 35, 0.85);
            backdrop-filter: blur(8px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            
            /* 阴影 */
            box-shadow: 0 8px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15);
            color: #4ade80; /* 默认绿色图标 */
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        /* 悬停效果 */
        .trigger-icon:hover {
            transform: scale(1.1);
            background: rgba(40, 40, 45, 0.95);
            box-shadow: 0 12px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        
        /* 拖拽时 */
        .trigger-icon:active {
            cursor: grabbing;
            transform: scale(0.95);
        }

        /* 菜单样式 */
        .menu {
            display: flex;
            gap: 6px;
            background: rgba(20, 20, 20, 0.8);
            backdrop-filter: blur(12px);
            padding: 6px;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.08);
            box-shadow: 0 8px 24px rgba(0,0,0,0.3);
            
            opacity: 0;
            transform: translateX(10px) scale(0.95);
            pointer-events: none;
            visibility: hidden;
            transition: all 0.2s ease-out;
        }
        
        .floater:hover .menu {
            opacity: 1;
            transform: translateX(0) scale(1);
            pointer-events: auto;
            visibility: visible;
        }

        /* 按钮样式 */
        .action-btn {
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            color: white;
            white-space: nowrap;
            transition: background 0.2s, transform 0.1s;
            outline: none;
        }
        .action-btn:active { transform: scale(0.95); }

        /* --- 状态变化 --- */
        
        /* 断网状态 */
        .floater.offline .trigger-icon {
            background: rgba(239, 68, 68, 0.9); /* 鲜艳的红 */
            color: white;
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.5); /* 红色呼吸光 */
            animation: pulse-red 2s infinite;
        }
        
        @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
    `;

    // 5. 构建 DOM
    function createUI() {
        const hostDiv = document.createElement('div');
        hostDiv.style.cssText = "position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;";
        const shadow = hostDiv.attachShadow({mode: 'open'});

        const styleTag = document.createElement('style');
        styleTag.textContent = cssContent;
        shadow.appendChild(styleTag);

        const wrapper = document.createElement('div');
        wrapper.className = 'floater';

        // 位置初始化
        const savedPos = localStorage.getItem(STORAGE_KEY);
        if (savedPos) {
            try {
                const { top, left } = JSON.parse(savedPos);
                const safeTop = Math.min(Math.max(top, 0), window.innerHeight - 50);
                const safeLeft = Math.min(Math.max(left, 0), window.innerWidth - 50);
                wrapper.style.top = safeTop + 'px';
                wrapper.style.left = safeLeft + 'px';
            } catch(e) {
                wrapper.style.top = '80%';
                wrapper.style.left = '90%';
            }
        } else {
            wrapper.style.top = '80%';
            wrapper.style.left = '90%';
        }

        // Trigger (图标容器)
        const triggerDiv = document.createElement('div');
        triggerDiv.className = 'trigger-icon';
        triggerDiv.title = '拖拽移动 | 悬停展开';
        // 初始设为在线图标
        triggerDiv.innerHTML = SVG_ONLINE;

        // Menu (菜单容器)
        const menuDiv = document.createElement('div');
        menuDiv.className = 'menu';

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
        const btnOn = createBtn('联网', 'rgba(255,255,255,0.15)', '#fff', () => sendCommand(false));

        menuDiv.appendChild(btnOff);
        menuDiv.appendChild(btnOn);

        wrapper.appendChild(triggerDiv);
        wrapper.appendChild(menuDiv);
        shadow.appendChild(wrapper);
        (document.body || document.documentElement).appendChild(hostDiv);

        // 状态更新逻辑
        const updateUI = () => {
            if (isOffline) {
                wrapper.classList.add('offline');
                // 切换为断网图标 (带斜杠)
                triggerDiv.innerHTML = SVG_OFFLINE;
                
                // 按钮状态
                btnOff.style.opacity = '0.5';
                btnOff.style.cursor = 'default';
                
                btnOn.style.background = '#22c55e'; // 绿色高亮
                btnOn.style.opacity = '1';
                btnOn.style.cursor = 'pointer';
            } else {
                wrapper.classList.remove('offline');
                // 切换为联网图标
                triggerDiv.innerHTML = SVG_ONLINE;
                
                // 按钮状态
                btnOff.style.background = '#ef4444'; // 红色高亮
                btnOff.style.opacity = '1';
                btnOff.style.cursor = 'pointer';
                
                btnOn.style.background = 'rgba(255,255,255,0.15)'; // 灰色
                btnOn.style.opacity = '0.5';
                btnOn.style.cursor = 'default';
            }
        };

        const sendCommand = (offline) => {
            isOffline = offline;
            updateUI();
            chrome.runtime.sendMessage({ 
                command: offline ? "enable_offline" : "disable_offline" 
            });
        };

        // 拖拽逻辑
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        triggerDiv.addEventListener('mousedown', (e) => {
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
                wrapper.style.transition = 'none';
                let newLeft = Math.min(Math.max(0, initialLeft + dx), window.innerWidth - 50);
                let newTop = Math.min(Math.max(0, initialTop + dy), window.innerHeight - 50);
                wrapper.style.left = newLeft + 'px';
                wrapper.style.top = newTop + 'px';
            }
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            wrapper.style.transition = 'opacity 0.3s';
            if (isDragging) {
                const rect = wrapper.getBoundingClientRect();
                localStorage.setItem(STORAGE_KEY, JSON.stringify({ top: rect.top, left: rect.left }));
            }
        }

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