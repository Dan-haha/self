// 游戏核心逻辑
class BasketballGame {
    constructor(config) {
        this.config = {
            homeTeam: config.homeTeam,
            awayTeam: config.awayTeam,
            difficulty: config.difficulty || 'pro',
            quarterLength: 12, // 每节12分钟
            courtWidth: 1000,
            courtHeight: 600
        };
        
        this.state = {
            score: { home: 0, away: 0 },
            quarter: 1,
            gameClock: 12 * 60, // 秒
            shotClock: 24,
            possession: 'home', // 'home' 或 'away'
            gameActive: false,
            paused: false,
            ball: null,
            homeTeam: null,
            awayTeam: null,
            players: [],
            controlledPlayer: null
        };
        
        // 游戏元素
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 游戏系统
        this.physics = new PhysicsEngine();
        this.aiSystem = new AISystem(this.config.difficulty);
        this.controls = new GameControls();
        this.ui = new GameUI();
        
        this.init();
    }
    
    init() {
        // 设置画布大小
        this.canvas.width = this.config.courtWidth;
        this.canvas.height = this.config.courtHeight;
        
        // 创建球队
        this.state.homeTeam = new Team(this.config.homeTeam, 'home');
        this.state.awayTeam = new Team(this.config.awayTeam, 'away');
        
        // 创建球员
        this.createPlayers();
        
        // 创建篮球
        this.state.ball = new Ball();
        
        // 设置初始球权
        this.state.ball.holder = this.state.homeTeam.players[0];
        this.state.controlledPlayer = this.state.homeTeam.players[0];
        
        // 初始化UI
        this.ui.init(this.state);
        
        // 设置控制
        this.controls.init(this);
        
        // 绑定事件
        this.bindEvents();
        
        console.log('游戏初始化完成');
    }
    
    createPlayers() {
        // 创建主队球员
        const homePositions = [
            { x: 200, y: 300, role: 'PG', number: 1, name: '控球后卫' },
            { x: 150, y: 200, role: 'SG', number: 2, name: '得分后卫' },
            { x: 150, y: 400, role: 'SF', number: 3, name: '小前锋' },
            { x: 100, y: 250, role: 'PF', number: 4, name: '大前锋' },
            { x: 100, y: 350, role: 'C', number: 5, name: '中锋' }
        ];
        
        homePositions.forEach(pos => {
            const player = new Player({
                ...pos,
                team: 'home',
                color: this.config.homeTeam.color1,
                attributes: this.generatePlayerAttributes(pos.role)
            });
            
            this.state.homeTeam.addPlayer(player);
            this.state.players.push(player);
        });
        
        // 创建客队球员
        const awayPositions = [
            { x: 800, y: 300, role: 'PG', number: 1, name: '控球后卫' },
            { x: 850, y: 200, role: 'SG', number: 2, name: '得分后卫' },
            { x: 850, y: 400, role: 'SF', number: 3, name: '小前锋' },
            { x: 900, y: 250, role: 'PF', number: 4, name: '大前锋' },
            { x: 900, y: 350, role: 'C', number: 5, name: '中锋' }
        ];
        
        awayPositions.forEach(pos => {
            const player = new Player({
                ...pos,
                team: 'away',
                color: this.config.awayTeam.color1,
                attributes: this.generatePlayerAttributes(pos.role)
            });
            
            this.state.awayTeam.addPlayer(player);
            this.state.players.push(player);
        });
    }
    
    generatePlayerAttributes(role) {
        const baseAttributes = {
            PG: { speed: 85, shooting: 78, dribbling: 88, defense: 75, stamina: 90, threePoint: 80 },
            SG: { speed: 82, shooting: 85, dribbling: 80, defense: 72, stamina: 88, threePoint: 85 },
            SF: { speed: 80, shooting: 82, dribbling: 75, defense: 78, stamina: 85, threePoint: 80 },
            PF: { speed: 75, shooting: 76, dribbling: 70, defense: 85, stamina: 90, threePoint: 70 },
            C: { speed: 70, shooting: 72, dribbling: 65, defense: 90, stamina: 95, threePoint: 60 }
        };
        
        // 添加随机变化
        const base = baseAttributes[role] || baseAttributes.PG;
        const attributes = {};
        
        for (const key in base) {
            const variation = Math.floor(Math.random() * 11) - 5; // -5 到 +5
            attributes[key] = Math.max(40, Math.min(99, base[key] + variation));
        }
        
        return attributes;
    }
    
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            if (!this.state.gameActive || this.state.paused) return;
            
            this.controls.handleKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            if (!this.state.gameActive || this.state.paused) return;
            
            this.controls.handleKeyUp(e);
        });
        
        // 游戏事件
        this.on('score', (team, points) => {
            this.handleScore(team, points);
        });
        
        this.on('foul', (player) => {
            this.handleFoul(player);
        });
        
        this.on('turnover', (team) => {
            this.handleTurnover(team);
        });
        
        this.on('quarterEnd', () => {
            this.handleQuarterEnd();
        });
        
        this.on('gameEnd', () => {
            this.handleGameEnd();
        });
    }
    
    start() {
        this.state.gameActive = true;
        this.state.paused = false;
        
        // 开始游戏循环
        this.gameLoop();
        
        // 开始游戏计时器
        this.startGameTimer();
        
        // 播放人群声音
        this.playSound('crowd-sound', 0.3, true);
        
        // 添加游戏开始事件
        this.ui.addEvent('比赛开始！');
        
        console.log('游戏开始');
    }
    
    pause() {
        this.state.paused = true;
        clearInterval(this.gameTimer);
        document.getElementById('pause-menu').classList.remove('hidden');
    }
    
    resume() {
        this.state.paused = false;
        this.startGameTimer();
        document.getElementById('pause-menu').classList.add('hidden');
        this.gameLoop();
    }
    
    stop() {
        this.state.gameActive = false;
        clearInterval(this.gameTimer);
        cancelAnimationFrame(this.animationFrame);
        
        // 停止所有声音
        this.stopAllSounds();
    }
    
    reset() {
        this.stop();
        
        // 重置游戏状态
        this.state.score = { home: 0, away: 0 };
        this.state.quarter = 1;
        this.state.gameClock = 12 * 60;
        this.state.shotClock = 24;
        this.state.possession = 'home';
        
        // 重置球员位置
        this.resetPlayerPositions();
        
        // 重置篮球
        this.state.ball.reset();
        this.state.ball.holder = this.state.homeTeam.players[0];
        this.state.controlledPlayer = this.state.homeTeam.players[0];
        
        // 重置UI
        this.ui.reset();
        
        console.log('游戏已重置');
    }
    
    gameLoop() {
        if (!this.state.gameActive || this.state.paused) return;
        
        // 更新游戏状态
        this.update();
        
        // 渲染游戏
        this.render();
        
        // 继续循环
        this.animationFrame = requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        // 更新球员
        this.state.players.forEach(player => {
            player.update();
            
            // 更新受控球员
            if (player === this.state.controlledPlayer) {
                this.controls.updatePlayerMovement(player);
            }
        });
        
        // 更新篮球
        this.state.ball.update();
        
        // 更新物理
        this.physics.update(this.state);
        
        // 更新AI
        if (this.state.possession === 'away') {
            this.aiSystem.update(this.state);
        }
        
        // 检查碰撞
        this.checkCollisions();
        
        // 检查得分
        this.checkForScore();
        
        // 更新UI
        this.ui.update(this.state);
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制球场
        this.renderCourt();
        
        // 绘制球员
        this.state.players.forEach(player => {
            player.render(this.ctx);
        });
        
        // 绘制篮球
        this.state.ball.render(this.ctx);
        
        // 绘制UI元素
        this.ui.render(this.ctx);
    }
    
    renderCourt() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        // 球场背景
        ctx.fillStyle = '#1a472a';
        ctx.fillRect(0, 0, width, height);
        
        // 边界线
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(50, 50, width - 100, height - 100);
        
        // 中线
        ctx.beginPath();
        ctx.moveTo(width / 2, 50);
        ctx.lineTo(width / 2, height - 50);
        ctx.stroke();
        
        // 中心圆
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();
        
        // 三分线（左侧）
        ctx.beginPath();
        ctx.arc(100, height / 2, 180, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
        
        // 三分线（右侧）
        ctx.beginPath();
        ctx.arc(width - 100, height / 2, 180, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
        
        // 罚球线（左侧）
        ctx.beginPath();
        ctx.arc(100, height / 2, 60, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
        
        // 罚球线（右侧）
        ctx.beginPath();
        ctx.arc(width - 100, height / 2, 60, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
        
        // 篮筐（左侧）
        ctx.fillStyle = '#ff6b00';
        ctx.fillRect(80, height / 2 - 5, 20, 10);
        
        // 篮筐（右侧）
        ctx.fillRect(width - 100, height / 2 - 5, 20, 10);
        
        // 篮板（左侧）
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(60, height / 2 - 30, 10, 60);
        
        // 篮板（右侧）
        ctx.fillRect(width - 70, height / 2 - 30, 10, 60);
    }
    
    startGameTimer() {
        clearInterval(this.gameTimer);
        
        this.gameTimer = setInterval(() => {
            if (!this.state.gameActive || this.state.paused) return;
            
            // 减少游戏时间
            this.state.gameClock--;
            
            // 减少进攻时间
            if (this.state.possession === 'home') {
                this.state.shotClock--;
                
                // 24秒违例
                if (this.state.shotClock <= 0) {
                    this.state.shotClock = 24;
                    this.state.possession = 'away';
                    this.ui.addEvent('24秒违例！球权转换');
                }
            }
            
            // 检查节末
            if (this.state.gameClock <= 0) {
                this.handleQuarterEnd();
            }
            
            // 更新UI
            this.ui.updateClock(this.state);
            
        }, 1000); // 每秒更新一次
    }
    
    checkCollisions() {
        // 球员与球员碰撞
        for (let i = 0; i < this.state.players.length; i++) {
            for (let j = i + 1; j < this.state.players.length; j++) {
                const player1 = this.state.players[i];
                const player2 = this.state.players[j];
                
                const dx = player1.x - player2.x;
                const dy = player1.y - player2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 如果碰撞
                if (distance < player1.radius + player2.radius) {
                    // 简单碰撞响应
                    const angle = Math.atan2(dy, dx);
                    const force = 0.5;
                    
                    player1.vx += Math.cos(angle) * force;
                    player1.vy += Math.sin(angle) * force;
                    player2.vx -= Math.cos(angle) * force;
                    player2.vy -= Math.sin(angle) * force;
                }
            }
        }
        
        // 篮球与球员碰撞
        if (this.state.ball.inAir) {
            this.state.players.forEach(player => {
                const dx = this.state.ball.x - player.x;
                const dy = this.state.ball.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 如果球员接到球
                if (distance < player.radius + this.state.ball.radius) {
                    // 只有当前没有持球者才能接球
                    if (!this.state.ball.holder) {
                        this.state.ball.holder = player;
                        this.state.ball.inAir = false;
                        this.state.ball.x = player.x;
                        this.state.ball.y = player.y - player.radius;
                        
                        // 更新球权
                        this.state.possession = player.team;
                        this.state.shotClock = 24;
                        
                        this.ui.addEvent(`${player.name} 接到球`);
                        this.playSound('bounce-sound');
                        
                        // 如果是对方球员接到球，切换控制
                        if (player.team === 'away' && this.state.controlledPlayer.team === 'home') {
                            // AI控制，玩家无法控制对方球员
                        }
                    }
                }
            });
        }
        
        // 篮球与边界碰撞
        if (this.state.ball.inAir) {
            const ball = this.state.ball;
            
            // 左右边界
            if (ball.x - ball.radius < 50 || ball.x + ball.radius > this.canvas.width - 50) {
                ball.vx = -ball.vx * 0.8;
                this.playSound('bounce-sound');
            }
            
            // 上下边界
            if (ball.y - ball.radius < 50 || ball.y + ball.radius > this.canvas.height - 50) {
                ball.vy = -ball.vy * 0.8;
                this.playSound('bounce-sound');
            }
        }
    }
    
    checkForScore() {
        if (!this.state.ball.inAir) return;
        
        const ball = this.state.ball;
        const hoopLeft = { x: 90, y: this.canvas.height / 2 };
        const hoopRight = { x: this.canvas.width - 90, y: this.canvas.height / 2 };
        const hoopRadius = 15;
        
        // 检查左侧篮筐
        const dxLeft = ball.x - hoopLeft.x;
        const dyLeft = ball.y - hoopLeft.y;
        const distanceLeft = Math.sqrt(dxLeft * dxLeft + dyLeft * dyLeft);
        
        // 检查右侧篮筐
        const dxRight = ball.x - hoopRight.x;
        const dyRight = ball.y - hoopRight.y;
        const distanceRight = Math.sqrt(dxRight * dxRight + dyRight * dyRight);
        
        // 检查是否进球（篮球正在下落并且靠近篮筐）
        if (ball.vy > 0 && ball.y > this.canvas.height / 2 - 20) {
            // 左侧篮筐
            if (distanceLeft < hoopRadius) {
                this.handleScore('away', 2); // 右侧球队得分
                this.playSound('swish-sound');
                return;
            }
            
            // 右侧篮筐
            if (distanceRight < hoopRadius) {
                this.handleScore('home', 2); // 左侧球队得分
                this.playSound('swish-sound');
                return;
            }
        }
    }
    
    handleScore(team, points) {
        // 更新分数
        if (team === 'home') {
            this.state.score.home += points;
        } else {
            this.state.score.away += points;
        }
        
        // 更新UI
        this.ui.updateScore(this.state);
        
        // 添加事件
        const teamName = team === 'home' ? this.config.homeTeam.name : this.config.awayTeam.name;
        this.ui.addEvent(`${teamName} 得分！+${points}分`);
        
        // 球权转换
        this.state.possession = team === 'home' ? 'away' : 'home';
        this.state.shotClock = 24;
        
        // 重置篮球
        setTimeout(() => {
            this.state.ball.reset();
            
            // 将球给得分方
            if (this.state.possession === 'home') {
                this.state.ball.holder = this.state.homeTeam.players[0];
            } else {
                this.state.ball.holder = this.state.awayTeam.players[0];
            }
            
            // 重置球员位置
            this.resetPlayerPositions();
        }, 1500);
    }
    
    handleFoul(player) {
        // 犯规逻辑
        this.ui.addEvent(`${player.name} 犯规`);
        
        // 根据情况处理（罚球、球权转换等）
        // 简化版本：只是转换球权
        this.state.possession = player.team === 'home' ? 'away' : 'home';
        this.state.shotClock = 24;
    }
    
    handleTurnover(team) {
        // 失误逻辑
        this.ui.addEvent(`${team === 'home' ? this.config.homeTeam.name : this.config.awayTeam.name} 失误`);
        
        // 转换球权
        this.state.possession = team === 'home' ? 'away' : 'home';
        this.state.shotClock = 24;
    }
    
    handleQuarterEnd() {
        this.state.quarter++;
        
        if (this.state.quarter > 4) {
            this.handleGameEnd();
        } else {
            this.state.gameClock = this.config.quarterLength * 60;
            this.ui.addEvent(`第${this.state.quarter}节开始`);
        }
    }
    
    handleGameEnd() {
        this.state.gameActive = false;
        clearInterval(this.gameTimer);
        
        // 播放终场哨声
        this.playSound('buzzer-sound');
        
        // 显示游戏结束界面
        setTimeout(() => {
            if (window.gameMain) {
                window.gameMain.showGameOver(
                    this.state.score.home,
                    this.state.score.away,
                    this.config.homeTeam,
                    this.config.awayTeam
                );
            }
        }, 2000);
    }
    
    resetPlayerPositions() {
        // 重置主队球员位置
        const homePositions = [
            { x: 200, y: 300 },
            { x: 150, y: 200 },
            { x: 150, y: 400 },
            { x: 100, y: 250 },
            { x: 100, y: 350 }
        ];
        
        this.state.homeTeam.players.forEach((player, index) => {
            player.x = homePositions[index].x;
            player.y = homePositions[index].y;
            player.vx = 0;
            player.vy = 0;
        });
        
        // 重置客队球员位置
        const awayPositions = [
            { x: 800, y: 300 },
            { x: 850, y: 200 },
            { x: 850, y: 400 },
            { x: 900, y: 250 },
            { x: 900, y: 350 }
        ];
        
        this.state.awayTeam.players.forEach((player, index) => {
            player.x = awayPositions[index].x;
            player.y = awayPositions[index].y;
            player.vx = 0;
            player.vy = 0;
        });
    }
    
    playSound(soundId, volume = 1.0, loop = false) {
        const sound = document.getElementById(soundId);
        if (sound) {
            sound.volume = volume;
            sound.loop = loop;
            
            // 重置播放位置并播放
            sound.currentTime = 0;
            sound.play().catch(e => {
                console.log('音频播放失败:', e);
            });
        }
    }
    
    stopAllSounds() {
        const sounds = [
            'bounce-sound',
            'swish-sound', 
            'dribble-sound',
            'crowd-sound',
            'buzzer-sound'
        ];
        
        sounds.forEach(soundId => {
            const sound = document.getElementById(soundId);
            if (sound) {
                sound.pause();
                sound.currentTime = 0;
            }
        });
    }
    
    on(event, callback) {
        // 简单的事件系统
        if (!this.events) this.events = {};
        if (!this.events[event]) this.events[event] = [];
        this.events[event].push(callback);
    }
    
    emit(event, data) {
        if (this.events && this.events[event]) {
            this.events[event].forEach(callback => {
                callback(data);
            });
        }
    }
}
