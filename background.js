// 监听来自页面的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 确保有 tabId
    if (!sender.tab) return;
    
    const tabId = sender.tab.id;
    const debuggeeId = { tabId: tabId };

    if (request.command === "enable_offline") {
        // 1. 挂载调试器
        chrome.debugger.attach(debuggeeId, "1.3", () => {
            if (chrome.runtime.lastError) {
                // 如果已经挂载了，忽略错误继续执行
                console.log("Attach info:", chrome.runtime.lastError.message);
            }
            // 2. 发送断网命令 (物理切断)
            chrome.debugger.sendCommand(debuggeeId, "Network.enable", {}, () => {
                chrome.debugger.sendCommand(debuggeeId, "Network.emulateNetworkConditions", {
                    offline: true,
                    latency: 0,
                    downloadThroughput: 0,
                    uploadThroughput: 0
                });
            });
        });
    } else if (request.command === "disable_offline") {
        // 恢复联网：直接卸载调试器即可，浏览器会自动恢复
        chrome.debugger.detach(debuggeeId, () => {
            if (chrome.runtime.lastError) {
                console.log("Detach info:", chrome.runtime.lastError.message);
            }
        });
    }
});

// 监听调试器被意外关闭（比如用户点了顶部的"取消"条）
chrome.debugger.onDetach.addListener((source, reason) => {
    // 通知前台页面更新 UI 状态为“在线”
    chrome.tabs.sendMessage(source.tabId, { command: "sync_online" });
});