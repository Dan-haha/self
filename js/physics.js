// 物理引擎
class PhysicsEngine {
    constructor() {
        // 物理常量
        this.gravity = 0.5;
        this.friction = 0.9;
        this.elasticity = 0.7; // 弹性系数
        this.airResistance = 0.99; // 空气阻力
        
        // 碰撞检测设置
        this.collisionPrecision = 'high'; // 'low', 'medium', 'high'
        
        // 性能优化
        this.frameCount = 0;
        this.updateInterval = 1; // 每帧更新
        this.broadPhase = true; // 使用宽阶段碰撞检测
        
        // 调试模式
        this.debug = false;
        this.collisionPoints = [];
        
        this.init();
    }
    
    init() {
        console.log('物理引擎初始化');
    }
    
    update(gameState) {
        this.frameCount++;
        
        // 每updateInterval帧更新一次物理
        if (this.frameCount % this.updateInterval !== 0) {
            return;
        }
        
        // 更新篮球物理
        this.updateBallPhysics(gameState.ball);
        
        // 更新球员物理
        gameState.players.forEach(player => {
            this.updatePlayerPhysics(player, gameState);
        });
        
        // 碰撞检测
        this.detectCollisions(gameState);
        
        // 边界检查
        this.checkBoundaries(gameState);
        
        // 清理调试点
        if (this.debug && this.frameCount % 60 === 0) {
            this.collisionPoints = [];
        }
    }
    
    updateBallPhysics(ball) {
        if (ball.inAir) {
            // 应用重力
            ball.vz -= this.gravity;
            
            // 应用空气阻力
            ball.vx *= this.airResistance;
            ball.vy *= this.airResistance;
            ball.vz *= this.airResistance;
            
            // 更新位置
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.z += ball.vz;
            
            // 地面碰撞
            if (ball.z <= 0) {
                ball.z = 0;
                ball.vz = -ball.vz * this.elasticity;
                
                // 如果弹跳很小，停止弹跳
                if (Math.abs(ball.vz) < 0.5) {
                    ball.vz = 0;
                    ball.vx *= this.friction;
                    ball.vy *= this.friction;
                }
            }
            
            // 更新旋转
            ball.spin += Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy) * 0.1;
        }
    }
    
    updatePlayerPhysics(player, gameState) {
        // 应用摩擦
        player.vx *= this.friction;
        player.vy *= this.friction;
        
        // 限制最大速度
        const maxSpeed = player.isSprinting ? 4 : 2;
        const currentSpeed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        
        if (currentSpeed > maxSpeed) {
            player.vx = (player.vx / currentSpeed) * maxSpeed;
            player.vy = (player.vy / currentSpeed) * maxSpeed;
        }
        
        // 更新位置
        player.x += player.vx;
        player.y += player.vy;
        
        // 更新目标位置（如果AI设置了目标）
        if (player.targetX !== undefined && player.targetY !== undefined) {
            this.moveToTarget(player, player.targetX, player.targetY);
        }
        
        // 更新动画状态
        this.updatePlayerAnimation(player);
    }
    
    moveToTarget(player, targetX, targetY) {
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            // 移动到目标
            const speed = player.attributes.speed / 100;
            player.vx += (dx / distance) * speed;
            player.vy += (dy / distance) * speed;
        } else {
            // 到达目标，清除目标
            player.targetX = undefined;
            player.targetY = undefined;
        }
    }
    
    updatePlayerAnimation(player) {
        // 更新跳跃动画
        if (player.animation.jump > 0) {
            player.animation.jump--;
        }
        
        // 更新转身动画
        if (player.animation.spin > 0) {
            player.animation.spin--;
        }
        
        // 恢复体力
        if (player.currentStamina < player.attributes.stamina) {
            player.currentStamina += 0.2;
            if (player.currentStamina > player.attributes.stamina) {
                player.currentStamina = player.attributes.stamina;
            }
        }
    }
    
    detectCollisions(gameState) {
        const players = gameState.players;
        const ball = gameState.ball;
        
        // 宽阶段碰撞检测（优化性能）
        if (this.broadPhase) {
            this.broadPhaseCollisionDetection(players, ball);
        } else {
            this.narrowPhaseCollisionDetection(players, ball);
        }
        
        // 篮球与球员碰撞
        this.detectBallPlayerCollisions(ball, players, gameState);
    }
    
    broadPhaseCollisionDetection(players, ball) {
        // 空间划分：将球场分为网格
        const gridSize = 100;
        const grid = {};
        
        // 将球员分配到网格
        players.forEach((player, index) => {
            const gridX = Math.floor(player.x / gridSize);
            const gridY = Math.floor(player.y / gridSize);
            const gridKey = `${gridX},${gridY}`;
            
            if (!grid[gridKey]) {
                grid[gridKey] = [];
            }
            grid[gridKey].push({ type: 'player', index, object: player });
            
            // 检查相邻网格
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    
                    const neighborKey = `${gridX + dx},${gridY + dy}`;
                    if (!grid[neighborKey]) {
                        grid[neighborKey] = [];
                    }
                    // 标记可能碰撞
                    grid[neighborKey].push({ type: 'player', index, object: player, potential: true });
                }
            }
        });
        
        // 检查每个网格内的碰撞
        for (const gridKey in grid) {
            const objects = grid[gridKey];
            
            for (let i = 0; i < objects.length; i++) {
                for (let j = i + 1; j < objects.length; j++) {
                    const obj1 = objects[i];
                    const obj2 = objects[j];
                    
                    // 跳过标记为潜在的相同对象
                    if (obj1.index === obj2.index && (obj1.potential || obj2.potential)) {
                        continue;
                    }
                    
                    if (obj1.type === 'player' && obj2.type === 'player') {
                        this.checkPlayerCollision(obj1.object, obj2.object);
                    }
                }
            }
        }
    }
    
    narrowPhaseCollisionDetection(players, ball) {
        // 详细的碰撞检测
        for (let i = 0; i < players.length; i++) {
            for (let j = i + 1; j < players.length; j++) {
                this.checkPlayerCollision(players[i], players[j]);
            }
        }
    }
    
    checkPlayerCollision(player1, player2) {
        const dx = player1.x - player2.x;
        const dy = player1.y - player2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = player1.radius + player2.radius;
        
        if (distance < minDistance && distance > 0) {
            // 记录碰撞点（调试用）
            if (this.debug) {
                this.collisionPoints.push({
                    x: (player1.x + player2.x) / 2,
                    y: (player1.y + player2.y) / 2,
                    time: this.frameCount
                });
            }
            
            // 碰撞响应
            const angle = Math.atan2(dy, dx);
            const force = 0.5;
            
            // 分开球员
            const overlap = minDistance - distance;
            const separateX = Math.cos(angle) * overlap * 0.5;
            const separateY = Math.sin(angle) * overlap * 0.5;
            
            player1.x += separateX;
            player1.y += separateY;
            player2.x -= separateX;
            player2.y -= separateY;
            
            // 应用碰撞力
            player1.vx += Math.cos(angle) * force;
            player1.vy += Math.sin(angle) * force;
            player2.vx -= Math.cos(angle) * force;
            player2.vy -= Math.sin(angle) * force;
            
            // 如果是不同队的球员，增加犯规几率
            if (player1.team !== player2.team && Math.random() < 0.01) {
                this.handleFoul(player1, player2);
            }
        }
    }
    
    detectBallPlayerCollisions(ball, players, gameState) {
        if (!ball.inAir || ball.z > 50) return;
        
        players.forEach(player => {
            const dx = ball.x - player.x;
            const dy = ball.y - player.y;
            const dz = ball.z;
            const distance2D = Math.sqrt(dx * dx + dy * dy);
            const distance3D = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // 检查碰撞
            if (distance2D < player.radius + ball.radius && ball.z < player.radius) {
                // 记录碰撞点（调试用）
                if (this.debug) {
                    this.collisionPoints.push({
                        x: ball.x,
                        y: ball.y,
                        z: ball.z,
                        time: this.frameCount,
                        type: 'ball-player'
                    });
                }
                
                // 球被球员接住
                if (!ball.holder && ball.z < 20 && Math.abs(ball.vz) < 10) {
                    this.catchBall(player, ball, gameState);
                    return;
                }
                
                // 球弹开
                this.bounceBallOffPlayer(ball, player, dx, dy);
            }
        });
    }
    
    catchBall(player, ball, gameState) {
        // 球员接住球
        ball.holder = player;
        ball.inAir = false;
        ball.x = player.x;
        ball.y = player.y - player.radius;
        ball.z = 0;
        ball.vx = 0;
        ball.vy = 0;
        ball.vz = 0;
        
        player.hasBall = true;
        
        // 更新球权
        gameState.possession = player.team;
        gameState.shotClock = 24;
        
        // 播放声音
        if (gameState.playSound) {
            gameState.playSound('bounce-sound', 0.5);
        }
        
        // 添加事件
        if (gameState.ui && gameState.ui.addEvent) {
            gameState.ui.addEvent(`${player.name} 接到球`);
        }
    }
    
    bounceBallOffPlayer(ball, player, dx, dy) {
        // 计算碰撞法线
        const distance = Math.sqrt(dx * dx + dy * dy);
        const normalX = dx / distance;
        const normalY = dy / distance;
        
        // 反射向量
        const dotProduct = ball.vx * normalX + ball.vy * normalY;
        ball.vx = ball.vx - 2 * dotProduct * normalX;
        ball.vy = ball.vy - 2 * dotProduct * normalY;
        
        // 减少能量
        ball.vx *= this.elasticity;
        ball.vy *= this.elasticity;
        ball.vz *= this.elasticity;
        
        // 轻微随机变化
        ball.vx += (Math.random() - 0.5) * 2;
        ball.vy += (Math.random() - 0.5) * 2;
        
        // 播放声音
        if (gameState.playSound) {
            gameState.playSound('bounce-sound', 0.3);
        }
    }
    
    checkBoundaries(gameState) {
        const courtWidth = gameState.canvas.width;
        const courtHeight = gameState.canvas.height;
        const boundaryMargin = 50;
        
        // 检查球员边界
        gameState.players.forEach(player => {
            // 左右边界
            if (player.x < boundaryMargin) {
                player.x = boundaryMargin;
                player.vx = Math.abs(player.vx) * 0.5;
            } else if (player.x > courtWidth - boundaryMargin) {
                player.x = courtWidth - boundaryMargin;
                player.vx = -Math.abs(player.vx) * 0.5;
            }
            
            // 上下边界
            if (player.y < boundaryMargin) {
                player.y = boundaryMargin;
                player.vy = Math.abs(player.vy) * 0.5;
            } else if (player.y > courtHeight - boundaryMargin) {
                player.y = courtHeight - boundaryMargin;
                player.vy = -Math.abs(player.vy) * 0.5;
            }
        });
        
        // 检查篮球边界
        const ball = gameState.ball;
        if (ball.inAir) {
            // 左右边界
            if (ball.x < boundaryMargin) {
                ball.x = boundaryMargin;
                ball.vx = Math.abs(ball.vx) * this.elasticity;
                if (gameState.playSound) {
                    gameState.playSound('bounce-sound', 0.4);
                }
            } else if (ball.x > courtWidth - boundaryMargin) {
                ball.x = courtWidth - boundaryMargin;
                ball.vx = -Math.abs(ball.vx) * this.elasticity;
                if (gameState.playSound) {
                    gameState.playSound('bounce-sound', 0.4);
                }
            }
            
            // 上下边界
            if (ball.y < boundaryMargin) {
                ball.y = boundaryMargin;
                ball.vy = Math.abs(ball.vy) * this.elasticity;
                if (gameState.playSound) {
                    gameState.playSound('bounce-sound', 0.4);
                }
            } else if (ball.y > courtHeight - boundaryMargin) {
                ball.y = courtHeight - boundaryMargin;
                ball.vy = -Math.abs(ball.vy) * this.elasticity;
                if (gameState.playSound) {
                    gameState.playSound('bounce-sound', 0.4);
                }
            }
            
            // 检查球是否出界
            if (ball.x < boundaryMargin - 20 || ball.x > courtWidth - boundaryMargin + 20 ||
                ball.y < boundaryMargin - 20 || ball.y > courtHeight - boundaryMargin + 20) {
                this.handleOutOfBounds(ball, gameState);
            }
        }
    }
    
    handleOutOfBounds(ball, gameState) {
        // 球出界处理
        ball.inAir = false;
        ball.vx = 0;
        ball.vy = 0;
        ball.vz = 0;
        
        // 转换球权
        gameState.possession = gameState.possession === 'home' ? 'away' : 'home';
        gameState.shotClock = 24;
        
        // 添加事件
        if (gameState.ui && gameState.ui.addEvent) {
            gameState.ui.addEvent('球出界！球权转换');
        }
        
        // 重置球位置
        setTimeout(() => {
            if (gameState.possession === 'home') {
                ball.holder = gameState.homeTeam.players[0];
                ball.x = gameState.homeTeam.players[0].x;
                ball.y = gameState.homeTeam.players[0].y;
            } else {
                ball.holder = gameState.awayTeam.players[0];
                ball.x = gameState.awayTeam.players[0].x;
                ball.y = gameState.awayTeam.players[0].y;
            }
        }, 1000);
    }
    
    handleFoul(player1, player2) {
        // 犯规处理
        if (player1.hasBall) {
            // 持球者被犯规
            console.log(`${player2.name} 对 ${player1.name} 犯规`);
            
            // 这里可以添加罚球逻辑
        }
    }
    
    calculateShotTrajectory(startX, startY, targetX, targetY, power) {
        // 计算投篮轨迹
        const gravity = this.gravity;
        const time = 1.5 + (1 - power) * 0.5; // 飞行时间
        
        // 水平速度
        const vx = (targetX - startX) / time;
        const vy = (targetY - startY) / time;
        
        // 垂直速度（达到最高点所需时间）
        const vz = 50 + power * 30;
        
        return {
            vx: vx,
            vy: vy,
            vz: vz,
            time: time,
            peakHeight: vz * vz / (2 * gravity) // 最高点高度
        };
    }
    
    calculatePassTrajectory(passer, receiver, power = 0.5) {
        // 计算传球轨迹
        const dx = receiver.x - passer.x;
        const dy = receiver.y - passer.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 根据距离调整传球力量
        const adjustedPower = Math.min(1.0, distance / 300 + power * 0.5);
        const time = 0.5 + distance / 500;
        
        return {
            vx: dx / time,
            vy: dy / time,
            vz: 20 + adjustedPower * 20,
            time: time
        };
    }
    
    isBallGoingIn(ball, basketX, basketY, basketRadius = 15) {
        // 预测球是否会进入篮筐
        if (!ball.inAir || ball.vz > 0) return false;
        
        // 计算球的落点
        const timeToLand = -ball.vz / this.gravity;
        const landingX = ball.x + ball.vx * timeToLand;
        const landingY = ball.y + ball.vy * timeToLand;
        
        // 计算与篮筐的距离
        const dx = landingX - basketX;
        const dy = landingY - basketY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < basketRadius;
    }
    
    toggleDebug() {
        this.debug = !this.debug;
        console.log(`物理调试模式: ${this.debug ? '开启' : '关闭'}`);
    }
    
    renderDebug(ctx) {
        if (!this.debug) return;
        
        // 绘制碰撞点
        this.collisionPoints.forEach(point => {
            const age = this.frameCount - point.time;
            const alpha = Math.max(0, 1 - age / 60); // 60帧后消失
            
            ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
            ctx.fill();
            
            if (point.type === 'ball-player') {
                ctx.strokeStyle = `rgba(0, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        // 绘制物理信息
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`物理帧: ${this.frameCount}`, 10, 20);
        ctx.fillText(`碰撞点: ${this.collisionPoints.length}`, 10, 40);
    }
    
    setCollisionPrecision(precision) {
        this.collisionPrecision = precision;
        
        switch(precision) {
            case 'low':
                this.broadPhase = true;
                this.updateInterval = 2;
                break;
            case 'medium':
                this.broadPhase = true;
                this.updateInterval = 1;
                break;
            case 'high':
                this.broadPhase = false;
                this.updateInterval = 1;
                break;
        }
        
        console.log(`碰撞检测精度设置为: ${precision}`);
    }
}
