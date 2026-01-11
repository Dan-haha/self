// 用户界面系统
class GameUI {
    constructor() {
        // UI元素引用
        this.elements = {
            homeScore: document.getElementById('home-score'),
            awayScore: document.getElementById('away-score'),
            gameClock: document.getElementById('game-clock'),
            shotClock: document.getElementById('shot-clock'),
            quarter: document.getElementById('quarter'),
            possessionIndicator: document.getElementById('possession-indicator'),
            gameEvents: document.getElementById('game-events'),
            playerName: document.getElementById('current-player'),
            playerSpeed: document.getElementById('attr-speed'),
            playerShooting: document.getElementById('attr-shooting'),
            playerDribbling: document.getElementById('attr-dribbling'),
            playerDefense: document.getElementById('attr-defense'),
            staminaBar: document.querySelector('.stamina'),
            shootingBar: document.querySelector('.shooting'),
            dribblingBar: document.querySelector('.dribbling'),
            shotMeter: document.getElementById('shot-meter'),
            shotPower: document.getElementById('shot-power'),
            shotTiming: document.getElementById('shot-timing'),
            gameMessages: document.getElementById('game-messages')
        };
        
        // UI状态
        this.state = {
            messages: [],
            events: [],
            lastUpdate: 0,
            notificationQueue: [],
            activeNotifications: [],
            statsVisible: true
        };
        
        // 动画
        this.animations = {
            scoreFlash: null,
            clockPulse: null,
            messageFade: null
        };
        
        // 配置
        this.config = {
            maxMessages: 5,
            maxEvents: 20,
            messageDuration: 5000, // 5秒
            notificationDuration: 3000 // 3秒
        };
        
        this.init();
    }
    
    init() {
        console.log('UI系统初始化');
        this.setupEventListeners();
        this.hideShotMeter();
    }
    
    setupEventListeners() {
        // 添加UI交互事件监听器
        document.addEventListener('keydown', (e) => {
            if (e.key === 'h' || e.key === 'H') {
                this.toggleStats();
            }
        });
    }
    
    update(gameState) {
        const currentTime = Date.now();
        
        // 限制更新频率（每100毫秒）
        if (currentTime - this.state.lastUpdate < 100) {
            return;
        }
        
        this.state.lastUpdate = currentTime;
        
        // 更新分数
        this.updateScore(gameState);
        
        // 更新时钟
        this.updateClock(gameState);
        
        // 更新球员信息
        if (gameState.controlledPlayer) {
            this.updatePlayerInfo(gameState.controlledPlayer);
        }
        
        // 更新球权指示器
        this.updatePossessionIndicator(gameState.possession);
        
        // 处理通知队列
        this.processNotificationQueue();
        
        // 清理过期消息
        this.cleanupMessages();
    }
    
    updateScore(gameState) {
        if (!this.elements.homeScore || !this.elements.awayScore) return;
        
        const oldHomeScore = parseInt(this.elements.homeScore.textContent) || 0;
        const oldAwayScore = parseInt(this.elements.awayScore.textContent) || 0;
        
        // 更新分数显示
        this.elements.homeScore.textContent = gameState.score.home;
        this.elements.awayScore.textContent = gameState.score.away;
        
        // 分数变化动画
        if (gameState.score.home > oldHomeScore) {
            this.flashElement(this.elements.homeScore, 'green');
        }
        if (gameState.score.away > oldAwayScore) {
            this.flashElement(this.elements.awayScore, 'red');
        }
    }
    
    updateClock(gameState) {
        if (!this.elements.gameClock || !this.elements.shotClock || !this.elements.quarter) return;
        
        // 更新游戏时钟
        const minutes = Math.floor(gameState.gameClock / 60);
        const seconds = gameState.gameClock % 60;
        this.elements.gameClock.textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // 最后两分钟特殊显示
        if (gameState.gameClock <= 120 && gameState.quarter === 4) {
            this.elements.gameClock.style.color = '#ff0000';
            this.elements.gameClock.style.animation = 'pulse 1s infinite';
        } else {
            this.elements.gameClock.style.color = '#ffffff';
            this.elements.gameClock.style.animation = '';
        }
        
        // 更新进攻时钟
        this.elements.shotClock.textContent = gameState.shotClock;
        
        // 进攻时钟警告
        if (gameState.shotClock <= 5) {
            this.elements.shotClock.style.color = '#ff0000';
        } else if (gameState.shotClock <= 10) {
            this.elements.shotClock.style.color = '#ffff00';
        } else {
            this.elements.shotClock.style.color = '#ffffff';
        }
        
        // 更新节数
        this.elements.quarter.textContent = `第${gameState.quarter}节`;
    }
    
    updatePlayerInfo(player) {
        if (!player) return;
        
        // 更新球员姓名
        if (this.elements.playerName) {
            this.elements.playerName.textContent = player.name;
        }
        
        // 更新属性数值
        if (this.elements.playerSpeed) {
            this.elements.playerSpeed.textContent = player.attributes.speed;
        }
        if (this.elements.playerShooting) {
            this.elements.playerShooting.textContent = player.attributes.shooting;
        }
        if (this.elements.playerDribbling) {
            this.elements.playerDribbling.textContent = player.attributes.dribbling;
        }
        if (this.elements.playerDefense) {
            this.elements.playerDefense.textContent = player.attributes.defense;
        }
        
        // 更新体力条
        if (this.elements.staminaBar) {
            const staminaPercent = (player.currentStamina / player.attributes.stamina) * 100;
            this.elements.staminaBar.style.width = `${staminaPercent}%`;
            
            // 体力低时改变颜色
            if (staminaPercent < 30) {
                this.elements.staminaBar.style.background = 'linear-gradient(to right, #f44336, #d32f2f)';
            } else if (staminaPercent < 60) {
                this.elements.staminaBar.style.background = 'linear-gradient(to right, #ff9800, #f57c00)';
            } else {
                this.elements.staminaBar.style.background = 'linear-gradient(to right, #4caf50, #388e3c)';
            }
        }
        
        // 更新其他属性条（如果存在）
        if (this.elements.shootingBar) {
            this.elements.shootingBar.style.width = `${player.attributes.shooting}%`;
        }
        if (this.elements.dribblingBar) {
            this.elements.dribblingBar.style.width = `${player.attributes.dribbling}%`;
        }
    }
    
    updatePossessionIndicator(possession) {
        if (!this.elements.possessionIndicator) return;
        
        // 更新球权指示器
        const indicator = this.elements.possessionIndicator;
        if (possession === 'home') {
            indicator.style.color = '#2196f3'; // 蓝色
            indicator.innerHTML = '<i class="fas fa-basketball-ball"></i> 主队球权';
        } else {
            indicator.style.color = '#f44336'; // 红色
            indicator.innerHTML = '<i class="fas fa-basketball-ball"></i> 客队球权';
        }
    }
    
    addEvent(text) {
        if (!this.elements.gameEvents) return;
        
        const now = new Date();
        const timeString = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
        
        // 创建事件元素
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.innerHTML = `<span class="event-time">${timeString}</span> ${text}`;
        
        // 添加到事件列表
        this.elements.gameEvents.appendChild(eventElement);
        
        // 限制事件数量
        if (this.elements.gameEvents.children.length > this.config.maxEvents) {
            this.elements.gameEvents.removeChild(this.elements.gameEvents.children[0]);
        }
        
        // 滚动到底部
        this.elements.gameEvents.scrollTop = this.elements.gameEvents.scrollHeight;
        
        // 添加到状态
        this.state.events.push({
            time: timeString,
            text: text,
            timestamp: now.getTime()
        });
        
        // 限制状态中的事件数量
        if (this.state.events.length > this.config.maxEvents * 2) {
            this.state.events = this.state.events.slice(-this.config.maxEvents);
        }
    }
    
    showMessage(text, type = 'info', duration = null) {
        if (!this.elements.gameMessages) {
            // 如果没有消息元素，添加到队列
            this.state.notificationQueue.push({ text, type, duration });
            return;
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = text;
        
        // 设置样式
        switch(type) {
            case 'success':
                messageElement.style.color = '#4caf50';
                break;
            case 'warning':
                messageElement.style.color = '#ff9800';
                break;
            case 'error':
                messageElement.style.color = '#f44336';
                break;
            default:
                messageElement.style.color = '#ffffff';
        }
        
        // 添加到消息区域
        this.elements.gameMessages.appendChild(messageElement);
        
        // 限制消息数量
        if (this.elements.gameMessages.children.length > this.config.maxMessages) {
            this.elements.gameMessages.removeChild(this.elements.gameMessages.children[0]);
        }
        
        // 添加到状态
        this.state.messages.push({
            element: messageElement,
            timestamp: Date.now(),
            duration: duration || this.config.messageDuration
        });
        
        // 设置自动移除
        const removeDuration = duration || this.config.messageDuration;
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.opacity = '0';
                messageElement.style.transition = 'opacity 0.5s';
                
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.parentNode.removeChild(messageElement);
                    }
                }, 500);
            }
        }, removeDuration);
    }
    
    showShotMeter() {
        if (this.elements.shotMeter) {
            this.elements.shotMeter.classList.remove('hidden');
        }
    }
    
    hideShotMeter() {
        if (this.elements.shotMeter) {
            this.elements.shotMeter.classList.add('hidden');
        }
    }
    
    updateShotMeter(power, timing) {
        if (!this.elements.shotPower || !this.elements.shotTiming) return;
        
        // 更新投篮力量条
        this.elements.shotPower.style.width = `${power}%`;
        
        // 更新时机文本
        this.elements.shotTiming.textContent = timing.text;
        this.elements.shotTiming.style.color = timing.color;
    }
    
    showNotification(title, message, type = 'info') {
        // 创建通知
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        notification.innerHTML = `
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        `;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 添加到活动通知
        this.state.activeNotifications.push(notification);
        
        // 设置样式和动画
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.background = 'rgba(0, 0, 0, 0.8)';
        notification.style.color = 'white';
        notification.style.padding = '15px';
        notification.style.borderRadius = '10px';
        notification.style.borderLeft = `5px solid ${this.getNotificationColor(type)}`;
        notification.style.zIndex = '1000';
        notification.style.maxWidth = '300px';
        notification.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.5)';
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        notification.style.transition = 'all 0.3s';
        
        // 触发动画
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // 自动移除
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    
                    // 从活动通知中移除
                    const index = this.state.activeNotifications.indexOf(notification);
                    if (index > -1) {
                        this.state.activeNotifications.splice(index, 1);
                    }
                }
            }, 300);
        }, this.config.notificationDuration);
    }
    
    getNotificationColor(type) {
        switch(type) {
            case 'success': return '#4caf50';
            case 'warning': return '#ff9800';
            case 'error': return '#f44336';
            case 'info': return '#2196f3';
            default: return '#ffffff';
        }
    }
    
    flashElement(element, color) {
        // 元素闪烁效果
        const originalColor = element.style.color;
        const originalBackground = element.style.backgroundColor;
        
        // 设置闪烁颜色
        element.style.color = color;
        element.style.backgroundColor = color === 'green' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)';
        
        // 恢复原样
        setTimeout(() => {
            element.style.color = originalColor;
            element.style.backgroundColor = originalBackground;
        }, 500);
    }
    
    processNotificationQueue() {
        // 处理等待中的通知
        if (this.state.notificationQueue.length > 0) {
            const notification = this.state.notificationQueue.shift();
            this.showMessage(notification.text, notification.type, notification.duration);
        }
    }
    
    cleanupMessages() {
        const currentTime = Date.now();
        
        // 清理过期的消息
        this.state.messages = this.state.messages.filter(message => {
            if (currentTime - message.timestamp > message.duration) {
                if (message.element && message.element.parentNode) {
                    message.element.parentNode.removeChild(message.element);
                }
                return false;
            }
            return true;
        });
        
        // 清理过期的状态事件
        const eventExpiry = 5 * 60 * 1000; // 5分钟
        this.state.events = this.state.events.filter(event => {
            return currentTime - event.timestamp < eventExpiry;
        });
    }
    
    toggleStats() {
        this.state.statsVisible = !this.state.statsVisible;
        
        const statsContainer = document.getElementById('player-stats');
        if (statsContainer) {
            if (this.state.statsVisible) {
                statsContainer.style.display = 'block';
            } else {
                statsContainer.style.display = 'none';
            }
        }
        
        this.showNotification(
            '统计信息',
            `统计信息已${this.state.statsVisible ? '显示' : '隐藏'}`,
            'info'
        );
    }
    
    showGameStats(gameState) {
        // 显示游戏统计信息
        const stats = this.calculateGameStats(gameState);
        
        const statsHTML = `
            <div class="stats-popup">
                <h3>比赛统计</h3>
                <div class="stats-grid">
                    <div class="stat-category">
                        <h4>${gameState.homeTeam.name}</h4>
                        <div>得分: ${stats.home.points}</div>
                        <div>投篮: ${stats.home.fieldGoals}</div>
                        <div>三分: ${stats.home.threePoints}</div>
                        <div>篮板: ${stats.home.rebounds}</div>
                        <div>助攻: ${stats.home.assists}</div>
                    </div>
                    <div class="stat-category">
                        <h4>${gameState.awayTeam.name}</h4>
                        <div>得分: ${stats.away.points}</div>
                        <div>投篮: ${stats.away.fieldGoals}</div>
                        <div>三分: ${stats.away.threePoints}</div>
                        <div>篮板: ${stats.away.rebounds}</div>
                        <div>助攻: ${stats.away.assists}</div>
                    </div>
                </div>
            </div>
        `;
        
        // 创建并显示弹出窗口
        const popup = document.createElement('div');
        popup.className = 'stats-popup-container';
        popup.innerHTML = statsHTML;
        
        // 添加到页面
        document.body.appendChild(popup);
        
        // 设置样式
        popup.style.position = 'fixed';
        popup.style.top = '50%';
        popup.style.left = '50%';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.background = 'rgba(0, 0, 0, 0.9)';
        popup.style.color = 'white';
        popup.style.padding = '30px';
        popup.style.borderRadius = '15px';
        popup.style.border = '3px solid #ff6b00';
        popup.style.zIndex = '2000';
        popup.style.minWidth = '500px';
        popup.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.7)';
        
        // 关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '关闭';
        closeButton.style.marginTop = '20px';
        closeButton.style.padding = '10px 20px';
        closeButton.style.background = '#ff6b00';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(popup);
        });
        
        popup.querySelector('.stats-popup').appendChild(closeButton);
        
        // 点击外部关闭
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                document.body.removeChild(popup);
            }
        });
    }
    
    calculateGameStats(gameState) {
        // 计算游戏统计（简化版）
        return {
            home: {
                points: gameState.score.home,
                fieldGoals: `${Math.floor(gameState.score.home / 2)}/${Math.floor(gameState.score.home / 2) + 5}`,
                threePoints: `${Math.floor(gameState.score.home / 3)}/${Math.floor(gameState.score.home / 3) + 3}`,
                rebounds: Math.floor(Math.random() * 30) + 20,
                assists: Math.floor(Math.random() * 15) + 10
            },
            away: {
                points: gameState.score.away,
                fieldGoals: `${Math.floor(gameState.score.away / 2)}/${Math.floor(gameState.score.away / 2) + 5}`,
                threePoints: `${Math.floor(gameState.score.away / 3)}/${Math.floor(gameState.score.away / 3) + 3}`,
                rebounds: Math.floor(Math.random() * 30) + 20,
                assists: Math.floor(Math.random() * 15) + 10
            }
        };
    }
    
    reset() {
        // 重置UI状态
        this.state.messages = [];
        this.state.events = [];
        this.state.notificationQueue = [];
        
        // 清除事件列表
        if (this.elements.gameEvents) {
            this.elements.gameEvents.innerHTML = '';
        }
        
        // 清除消息
        if (this.elements.gameMessages) {
            this.elements.gameMessages.innerHTML = '';
        }
        
        // 清除活动通知
        this.state.activeNotifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        this.state.activeNotifications = [];
        
        // 隐藏投篮计量器
        this.hideShotMeter();
        
        console.log('UI已重置');
    }
    
    render(ctx, gameState) {
        // 渲染UI到画布（如果需要）
        if (!ctx) return;
        
        // 渲染得分（如果需要）
        this.renderScore(ctx, gameState);
        
        // 渲染时钟
        this.renderClock(ctx, gameState);
        
        // 渲染球员信息
        if (gameState.controlledPlayer) {
            this.renderPlayerInfo(ctx, gameState.controlledPlayer);
        }
    }
    
    renderScore(ctx, gameState) {
        // 在画布上渲染分数（备用）
        const canvas = ctx.canvas;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${gameState.homeTeam.name}: ${gameState.score.home}`, 20, 40);
        ctx.fillText(`${gameState.awayTeam.name}: ${gameState.score.away}`, 20, 70);
    }
    
    renderClock(ctx, gameState) {
        const canvas = ctx.canvas;
        
        // 游戏时钟
        const minutes = Math.floor(gameState.gameClock / 60);
        const seconds = gameState.gameClock % 60;
        const clockText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(canvas.width - 150, 10, 140, 40);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(clockText, canvas.width - 80, 35);
        ctx.textAlign = 'left';
        
        // 进攻时钟
        ctx.fillStyle = gameState.shotClock <= 5 ? '#ff0000' : '#ffff00';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${gameState.shotClock}`, canvas.width - 50, 65);
    }
    
    renderPlayerInfo(ctx, player) {
        const canvas = ctx.canvas;
        
        // 在球员上方显示姓名
        ctx.fillStyle = player.team === 'home' ? '#2196f3' : '#f44336';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - player.radius - 10);
        ctx.textAlign = 'left';
        
        // 如果是受控球员，显示额外信息
        if (player.isControlled) {
            // 体力条
            const staminaPercent = player.currentStamina / player.attributes.stamina;
            const staminaWidth = 40;
            const staminaHeight = 4;
            const staminaX = player.x - staminaWidth / 2;
            const staminaY = player.y - player.radius - 25;
            
            // 体力条背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(staminaX, staminaY, staminaWidth, staminaHeight);
            
            // 体力条前景
            if (staminaPercent > 0.5) {
                ctx.fillStyle = '#4caf50';
            } else if (staminaPercent > 0.2) {
                ctx.fillStyle = '#ff9800';
            } else {
                ctx.fillStyle = '#f44336';
            }
            ctx.fillRect(staminaX, staminaY, staminaWidth * staminaPercent, staminaHeight);
        }
    }
}
