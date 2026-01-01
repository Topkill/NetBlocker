// @ts-nocheck
(function() {
    // 1. 防止重复注入
    if (window.hasNetBlockerUI) return;
    window.hasNetBlockerUI = true;

    // 2. 配置与状态
    const STORAGE_KEY = 'net_blocker_pos_' + window.location.hostname;
    let isOffline = false;

    // 3. 创建样式表 (Inject CSS)
    const cssContent = `
        .floater {
            position: fixed;
            display: flex;
            align-items: center;
            flex-direction: row-reverse;
            gap: 8px;
            user-select: none;
            font-family: system-ui, -apple-system, sans-serif;
            z-index: 2147483647;
            transition: opacity 0.3s;
        }
        .trigger-icon {
            width: 42px;
            height: 42px;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: grab;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            color: white;
            font-size: 20px;
            transition: transform 0.2s, background 0.3s;
        }
        .trigger-icon:hover {
            transform: scale(1.05);
            background: rgba(0, 0, 0, 0.9);
        }
        .trigger-icon:active {
            cursor: grabbing;
        }
        .menu {
            display: flex;
            gap: 6px;
            background: rgba(0, 0, 0, 0.7);
            padding: 6px;
            border-radius: 24px;
            opacity: 0;
            transform: translateX(15px) scale(0.9);
            pointer-events: none;
            visibility: hidden;
            transition: all 0.25s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        /* 悬停显示菜单 */
        .floater:hover .menu {
            opacity: 1;
            transform: translateX(0) scale(1);
            pointer-events: auto;
            visibility: visible;
        }
        .action-btn {
            border: none;
            padding: 6px 14px;
            border-radius: 16px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            color: white;
            white-space: nowrap;
            transition: 0.2s;
            outline: none;
        }
        /* 断网状态样式 */
        .floater.offline .trigger-icon {
            background: #ff4d4f;
            box-shadow: 0 0 15px rgba(255, 77, 79, 0.6);
        }
    `;

    // 4. 构建 DOM 树 (不使用 innerHTML)
    function createUI() {
        // 创建宿主 (Shadow Host)
        const hostDiv = document.createElement('div');
        hostDiv.style.cssText = "position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;";
        const shadow = hostDiv.attachShadow({mode: 'open'});

        // 注入样式
        const styleTag = document.createElement('style');
        styleTag.textContent = cssContent;
        shadow.appendChild(styleTag);

        // 主容器
        const wrapper = document.createElement('div');
        wrapper.className = 'floater';

        // 位置初始化
        const savedPos = localStorage.getItem(STORAGE_KEY);
        if (savedPos) {
            try {
                const { top, left } = JSON.parse(savedPos);
                // 简单的防溢出检查
                const safeTop = Math.min(Math.max(top, 0), window.innerHeight - 50);
                const safeLeft = Math.min(Math.max(left, 0), window.innerWidth - 50);
                wrapper.style.top = safeTop + 'px';
                wrapper.style.left = safeLeft + 'px';
            } catch(e) {
                // 如果数据坏了，重置
                wrapper.style.top = '80%';
                wrapper.style.left = '90%';
            }
        } else {
            wrapper.style.top = '80%';
            wrapper.style.left = '90%';
        }

        // --- 触发器图标 (Trigger) ---
        const triggerDiv = document.createElement('div');
        triggerDiv.className = 'trigger-icon';
        triggerDiv.title = '拖拽移动 | 悬停展开';
        
        const statusSpan = document.createElement('span');
        statusSpan.textContent = '📶';
        triggerDiv.appendChild(statusSpan);

        // --- 菜单 (Menu) ---
        const menuDiv = document.createElement('div');
        menuDiv.className = 'menu';

        // 按钮生成器
        function createBtn(text, color, onClick) {
            const btn = document.createElement('button');
            btn.className = 'action-btn';
            btn.textContent = text;
            btn.style.backgroundColor = color;
            // 阻止冒泡防止触发拖拽
            btn.addEventListener('mousedown', (e) => e.stopPropagation());
            btn.onclick = onClick;
            return btn;
        }

        const btnOff = createBtn('断网', '#ff4d4f', () => sendCommand(true));
        const btnOn = createBtn('联网', '#52c41a', () => sendCommand(false));
        // 联网按钮默认半透明
        btnOn.style.opacity = '0.5';

        menuDiv.appendChild(btnOff);
        menuDiv.appendChild(btnOn);

        // 组装
        wrapper.appendChild(triggerDiv);
        wrapper.appendChild(menuDiv);
        shadow.appendChild(wrapper);

        // 挂载到页面
        (document.body || document.documentElement).appendChild(hostDiv);

        // 5. 功能逻辑引用
        const updateUI = () => {
            if (isOffline) {
                wrapper.classList.add('offline');
                statusSpan.textContent = '🚫';
                btnOff.style.opacity = '0.5';
                btnOn.style.opacity = '1';
            } else {
                wrapper.classList.remove('offline');
                statusSpan.textContent = '📶';
                btnOff.style.opacity = '1';
                btnOn.style.opacity = '0.5';
            }
        };

        const sendCommand = (offline) => {
            isOffline = offline;
            updateUI();
            chrome.runtime.sendMessage({ 
                command: offline ? "enable_offline" : "disable_offline" 
            });
        };

        // 6. 拖拽逻辑 (Drag)
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        triggerDiv.addEventListener('mousedown', (e) => {
            // 左键点击才拖拽
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
                wrapper.style.transition = 'none'; // 拖拽时去除动画延迟
                
                let newLeft = initialLeft + dx;
                let newTop = initialTop + dy;

                // 限制在屏幕内
                newLeft = Math.min(Math.max(0, newLeft), window.innerWidth - 45);
                newTop = Math.min(Math.max(0, newTop), window.innerHeight - 45);

                wrapper.style.left = newLeft + 'px';
                wrapper.style.top = newTop + 'px';
            }
        }

        function onMouseUp() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            wrapper.style.transition = 'opacity 0.3s'; // 恢复动画

            if (isDragging) {
                // 保存位置
                const rect = wrapper.getBoundingClientRect();
                localStorage.setItem(STORAGE_KEY, JSON.stringify({
                    top: rect.top,
                    left: rect.left
                }));
            }
        }

        // 监听后台同步消息
        chrome.runtime.onMessage.addListener((msg) => {
            if (msg.command === "sync_online") {
                isOffline = false;
                updateUI();
            }
        });
    }

    // 7. 启动渲染
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", createUI);
    } else {
        createUI();
    }
})();