// 游戏控制类
class GameControls {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.game = null;
        
        // 控制配置
        this.config = {
            moveUp: ['w', 'arrowup'],
            moveDown: ['s', 'arrowdown'],
            moveLeft: ['a', 'arrowleft'],
            moveRight: ['d', 'arrowright'],
            sprint: 'shift',
            shoot: ' ',
            pass: ' ',
            dribbleCrossover: 'x',
            dribbleBehind: 'b',
            dribbleSpin: 'r',
            pumpFake: 'f',
            switchPlayer: 'tab',
            pause: 'escape'
        };
        
        // 控制状态
        this.state = {
            isShooting: false,
            shotPower: 0,
            shotIncreasing: true,
            shotTimer: null,
            lastDribbleTime: 0,
            dribbleCooldown: 500, // 毫秒
            lastSwitchTime: 0,
            switchCooldown: 300 // 毫秒
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;
            this.handleKeyDown(key);
        });
        
        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;
            this.handleKeyUp(key);
        });
        
        // 鼠标事件
        document.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        
        document.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            this.handleMouseDown(e);
        });
        
        document.addEventListener('mouseup', (e) => {
            this.mouse.down = false;
            this.handleMouseUp(e);
        });
        
        // 防止上下文菜单
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    setGame(game) {
        this.game = game;
    }
    
    handleKeyDown(key) {
        if (!this.game || !this.game.state.gameActive || this.game.state.paused) return;
        
        // 暂停游戏
        if (key === this.config.pause) {
            this.game.pause();
            return;
        }
        
        // 切换球员
        if (key === this.config.switchPlayer) {
            const now = Date.now();
            if (now - this.state.lastSwitchTime > this.state.switchCooldown) {
                this.switchPlayer();
                this.state.lastSwitchTime = now;
            }
            return;
        }
        
        // 运球动作
        if (key === this.config.dribbleCrossover) {
            this.performDribble('crossover');
            return;
        }
        
        if (key === this.config.dribbleBehind) {
            this.performDribble('behind');
            return;
        }
        
        if (key === this.config.dribbleSpin) {
            this.performDribble('spin');
            return;
        }
        
        if (key === this.config.pumpFake) {
            this.performPumpFake();
            return;
        }
        
        // 投篮/传球开始
        if (key === this.config.shoot && !this.state.isShooting) {
            this.startShot();
            return;
        }
    }
    
    handleKeyUp(key) {
        if (!this.game || !this.game.state.gameActive || this.game.state.paused) return;
        
        // 投篮/传球释放
        if (key === this.config.shoot && this.state.isShooting) {
            this.releaseShot();
            return;
        }
    }
    
    handleMouseDown(e) {
        // 鼠标控制可以用于瞄准或菜单交互
        if (!this.game || !this.game.state.gameActive || this.game.state.paused) return;
        
        // 可以根据游戏模式实现不同的鼠标控制
    }
    
    handleMouseUp(e) {
        if (!this.game || !this.game.state.gameActive || this.game.state.paused) return;
    }
    
    updatePlayerMovement(player) {
        if (!player || !player.isControlled) return;
        
        // 检查移动键
        let moveX = 0;
        let moveY = 0;
        let sprint = false;
        
        // 检查上/下
        this.config.moveUp.forEach(key => {
            if (this.keys[key]) moveY -= 1;
        });
        
        this.config.moveDown.forEach(key => {
            if (this.keys[key]) moveY += 1;
        });
        
        // 检查左/右
        this.config.moveLeft.forEach(key => {
            if (this.keys[key]) moveX -= 1;
        });
        
        this.config.moveRight.forEach(key => {
            if (this.keys[key]) moveX += 1;
        });
        
        // 检查冲刺
        if (this.keys[this.config.sprint]) {
            sprint = true;
        }
        
        // 如果有移动输入，更新球员
        if (moveX !== 0 || moveY !== 0) {
            player.move(moveX, moveY, sprint);
        }
    }
    
    startShot() {
        const player = this.game.state.controlledPlayer;
        if (!player || !player.hasBall) return;
        
        this.state.isShooting = true;
        this.state.shotPower = 0;
        this.state.shotIncreasing = true;
        
        // 显示投篮计量器
        const shotMeter = document.getElementById('shot-meter');
        if (shotMeter) {
            shotMeter.classList.remove('hidden');
        }
        
        // 开始投篮计时器
        this.state.shotTimer = setInterval(() => {
            if (this.state.shotIncreasing) {
                this.state.shotPower += 2;
                if (this.state.shotPower >= 100) this.state.shotIncreasing = false;
            } else {
                this.state.shotPower -= 2;
                if (this.state.shotPower <= 0) this.state.shotIncreasing = true;
            }
            
            // 更新UI
            const shotPowerElement = document.getElementById('shot-power');
            if (shotPowerElement) {
                shotPowerElement.style.width = `${this.state.shotPower}%`;
            }
            
            // 更新时机标签
            const timingLabel = document.getElementById('shot-timing');
            if (timingLabel) {
                let text = "释放空格键投篮";
                let color = "#fff";
                
                if (this.state.shotPower < 30) {
                    text = "太弱";
                    color = "#f44336";
                } else if (this.state.shotPower > 70) {
                    text = "太强";
                    color = "#f44336";
                } else if (this.state.shotPower > 45 && this.state.shotPower < 55) {
                    text = "完美时机！";
                    color = "#4caf50";
                } else {
                    text = "不错";
                    color = "#ffff00";
                }
                
                timingLabel.textContent = text;
                timingLabel.style.color = color;
            }
        }, 50);
    }
    
    releaseShot() {
        if (!this.state.isShooting) return;
        
        clearInterval(this.state.shotTimer);
        this.state.isShooting = false;
        
        // 隐藏投篮计量器
        const shotMeter = document.getElementById('shot-meter');
        if (shotMeter) {
            shotMeter.classList.add('hidden');
        }
        
        // 执行投篮
        this.takeShot();
    }
    
    takeShot() {
        const player = this.game.state.controlledPlayer;
        if (!player || !player.hasBall) return;
        
        // 计算投篮目标（基于鼠标位置或默认）
        let targetX, targetY;
        
        // 如果游戏有鼠标控制，可以使用鼠标位置
        if (this.game.config.useMouseAim && this.mouse.x && this.mouse.y) {
            // 将鼠标坐标转换为游戏坐标
            const rect = this.game.canvas.getBoundingClientRect();
            targetX = this.mouse.x - rect.left;
            targetY = this.mouse.y - rect.top;
        } else {
            // 默认投篮目标（对面篮筐）
            if (player.team === 'home') {
                targetX = this.game.canvas.width - 90; // 右侧篮筐
                targetY = this.game.canvas.height / 2;
            } else {
                targetX = 90; // 左侧篮筐
                targetY = this.game.canvas.height / 2;
            }
        }
        
        // 计算投篮力量（基于计时器）
        const power = this.state.shotPower / 100;
        
        // 球员投篮
        player.shoot(targetX, targetY, power);
        
        // 篮球投篮
        this.game.state.ball.shoot(player, targetX, targetY, power);
        
        // 添加游戏事件
        this.game.ui.addEvent(`${player.name} 投篮`);
    }
    
    performDribble(type) {
        const player = this.game.state.controlledPlayer;
        if (!player || !player.hasBall) return;
        
        const now = Date.now();
        if (now - this.state.lastDribbleTime < this.state.dribbleCooldown) return;
        
        // 执行运球动作
        player.dribble(type);
        
        // 更新最后运球时间
        this.state.lastDribbleTime = now;
        
        // 播放运球声音
        this.game.playSound('dribble-sound', 0.5);
        
        // 添加游戏事件
        const dribbleNames = {
            'crossover': '交叉运球',
            'behind': '背后运球',
            'spin': '转身运球'
        };
        
        this.game.ui.addEvent(`${player.name} ${dribbleNames[type] || '运球'}`);
    }
    
    performPumpFake() {
        const player = this.game.state.controlledPlayer;
        if (!player || !player.hasBall) return;
        
        // 执行假动作
        player.animation.fade = 30;
        
        // 添加游戏事件
        this.game.ui.addEvent(`${player.name} 投篮假动作`);
    }
    
    switchPlayer() {
        if (!this.game) return;
        
        const team = this.game.state.homeTeam;
        const currentIndex = team.players.indexOf(this.game.state.controlledPlayer);
        
        // 找到下一个球员
        let nextIndex = (currentIndex + 1) % team.players.length;
        
        // 确保不选择同一个球员
        if (nextIndex === currentIndex) return;
        
        // 切换控制
        this.game.state.controlledPlayer.isControlled = false;
        this.game.state.controlledPlayer = team.players[nextIndex];
        this.game.state.controlledPlayer.isControlled = true;
        
        // 更新UI
        this.game.ui.updatePlayerInfo(this.game.state.controlledPlayer);
        
        // 添加游戏事件
        this.game.ui.addEvent(`控制切换到 ${this.game.state.controlledPlayer.name}`);
    }
}
