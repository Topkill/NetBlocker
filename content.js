(function() {
    // 防止重复注入
    if (window.hasNetBlockerUI) return;
    window.hasNetBlockerUI = true;

    let isOffline = false;
    let btnOff, btnOn;

    // 接收来自后台的同步消息（处理意外断开）
    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.command === "sync_online") {
            isOffline = false;
            updateUI();
        }
    });

    function sendCommand(offline) {
        isOffline = offline;
        updateUI();
        // 发送给 background.js
        chrome.runtime.sendMessage({ 
            command: offline ? "enable_offline" : "disable_offline" 
        });
    }

    function updateUI() {
        if (!btnOff || !btnOn) return;
        if (isOffline) {
            btnOff.innerText = "已断网";
            btnOff.style.opacity = "0.5";
            btnOn.innerText = "恢复联网";
            btnOn.style.opacity = "1";
        } else {
            btnOff.innerText = "🔴 断网";
            btnOff.style.opacity = "1";
            btnOn.innerText = "🟢 联网";
            btnOn.style.opacity = "0.5";
        }
    }

    function renderUI() {
        // 排除 iframe
        if (window.top !== window.self) return;

        const div = document.createElement('div');
        // Shadow DOM 隔离，防止被网页 CSS 破坏
        const shadow = div.attachShadow({mode: 'open'});
        
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            z-index: 2147483647;
            display: flex;
            gap: 10px;
            background: rgba(0,0,0,0.7);
            padding: 8px;
            border-radius: 8px;
            font-family: sans-serif;
            pointer-events: auto;
        `;

        const btnStyle = `
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            color: white;
            font-size: 14px;
        `;

        btnOff = document.createElement('button');
        btnOff.innerText = "🔴 断网";
        btnOff.style.cssText = btnStyle + "background: #e74c3c;";
        btnOff.onclick = () => sendCommand(true);

        btnOn = document.createElement('button');
        btnOn.innerText = "🟢 联网";
        btnOn.style.cssText = btnStyle + "background: #2ecc71; opacity: 0.5;";
        btnOn.onclick = () => sendCommand(false);

        wrapper.appendChild(btnOff);
        wrapper.appendChild(btnOn);
        shadow.appendChild(wrapper);

        document.body.appendChild(div);
    }

    // 页面加载完成后渲染
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", renderUI);
    } else {
        renderUI();
    }
})();