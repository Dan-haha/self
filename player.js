// 球员类
class Player {
    constructor(config) {
        this.id = config.id || `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.vx = 0;
        this.vy = 0;
        this.radius = config.radius || 20;
        this.team = config.team || 'home'; // 'home' 或 'away'
        this.role = config.role || 'PG';
        this.number = config.number || 1;
        this.name = config.name || '球员';
        this.color = config.color || '#2196f3';
        this.secondaryColor = config.secondaryColor || '#ffffff';
        
        // 球员属性
        this.attributes = config.attributes || {
            speed: 75,
            shooting: 70,
            dribbling: 75,
            defense: 70,
            stamina: 90,
            threePoint: 70
        };
        
        // 当前状态
        this.currentStamina = this.attributes.stamina;
        this.isControlled = false;
        this.hasBall = false;
        this.isShooting = false;
        this.isDribbling = false;
        this.dribbleType = 'normal'; // 'normal', 'crossover', 'behind', 'spin'
        this.dribbleTimer = 0;
        
        // 投篮相关
        this.shotPower = 0;
        this.shotAngle = 0;
        this.shotTarget = { x: 0, y: 0 };
        
        // 动画状态
        this.animation = {
            jump: 0,
            fade: 0,
            spin: 0
        };
        
        // 统计
        this.stats = {
            points: 0,
            rebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fouls: 0,
            shotsAttempted: 0,
            shotsMade: 0,
            threeAttempted: 0,
            threeMade: 0
        };
    }
    
    update() {
        // 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 应用摩擦
        this.vx *= 0.9;
        this.vy *= 0.9;
        
        // 更新运球计时器
        if (this.dribbleTimer > 0) {
            this.dribbleTimer--;
            if (this.dribbleTimer === 0) {
                this.dribbleType = 'normal';
            }
        }
        
        // 更新动画
        this.updateAnimation();
        
        // 恢复体力
        if (this.currentStamina < this.attributes.stamina) {
            this.currentStamina += 0.5;
            if (this.currentStamina > this.attributes.stamina) {
                this.currentStamina = this.attributes.stamina;
            }
        }
    }
    
    updateAnimation() {
        // 跳跃动画
        if (this.animation.jump > 0) {
            this.animation.jump--;
        }
        
        // 转身动画
        if (this.animation.spin > 0) {
            this.animation.spin--;
        }
        
        // 渐隐动画（用于假动作）
        if (this.animation.fade > 0) {
            this.animation.fade--;
        }
    }
    
    render(ctx) {
        // 保存上下文状态
        ctx.save();
        
        // 应用动画变换
        if (this.animation.spin > 0) {
            const spinAngle = (30 - this.animation.spin) * 0.2;
            ctx.translate(this.x, this.y);
            ctx.rotate(spinAngle);
            ctx.translate(-this.x, -this.y);
        }
        
        // 绘制球员身体
        const jumpOffset = Math.sin(this.animation.jump * 0.1) * 10;
        
        // 球员主体（圆形）
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y - jumpOffset, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 球员边框
        ctx.strokeStyle = this.secondaryColor;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 受控球员高亮
        if (this.isControlled) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y - jumpOffset, this.radius + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 持球指示
        if (this.hasBall) {
            ctx.fillStyle = '#ff8c00';
            ctx.beginPath();
            ctx.arc(this.x, this.y - jumpOffset - this.radius - 5, 8, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 球员号码
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.number, this.x, this.y - jumpOffset);
        
        // 体力条（如果体力低）
        if (this.currentStamina < this.attributes.stamina * 0.5) {
            const staminaWidth = 40;
            const staminaHeight = 4;
            const staminaX = this.x - staminaWidth / 2;
            const staminaY = this.y - jumpOffset - this.radius - 15;
            
            // 背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(staminaX, staminaY, staminaWidth, staminaHeight);
            
            // 体力值
            const staminaPercent = this.currentStamina / this.attributes.stamina;
            ctx.fillStyle = staminaPercent > 0.3 ? '#4caf50' : '#f44336';
            ctx.fillRect(staminaX, staminaY, staminaWidth * staminaPercent, staminaHeight);
        }
        
        // 恢复上下文状态
        ctx.restore();
    }
    
    move(dx, dy, sprint = false) {
        // 计算移动速度
        let speed = this.attributes.speed / 100;
        
        // 冲刺消耗体力
        if (sprint && this.currentStamina > 0) {
            speed *= 1.5;
            this.currentStamina -= 1;
        }
        
        // 应用移动
        this.vx += dx * speed;
        this.vy += dy * speed;
        
        // 限制最大速度
        const maxSpeed = sprint ? 4 : 2;
        const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (currentSpeed > maxSpeed) {
            this.vx = (this.vx / currentSpeed) * maxSpeed;
            this.vy = (this.vy / currentSpeed) * maxSpeed;
        }
        
        // 如果有球，运球
        if (this.hasBall) {
            this.dribble();
        }
    }
    
    dribble(type = 'normal') {
        this.isDribbling = true;
        this.dribbleType = type;
        
        // 设置运球计时器
        switch(type) {
            case 'crossover':
                this.dribbleTimer = 20;
                this.animation.spin = 30;
                break;
            case 'behind':
                this.dribbleTimer = 25;
                break;
            case 'spin':
                this.dribbleTimer = 30;
                this.animation.spin = 30;
                break;
            default:
                this.dribbleTimer = 10;
        }
    }
    
    shoot(targetX, targetY, power) {
        this.isShooting = true;
        this.shotTarget = { x: targetX, y: targetY };
        this.shotPower = power;
        
        // 跳跃动画
        this.animation.jump = 30;
        
        // 投篮后重置状态
        setTimeout(() => {
            this.isShooting = false;
            this.hasBall = false;
        }, 500);
    }
    
    pass(targetPlayer) {
        // 传球逻辑
        this.hasBall = false;
        
        // 更新统计
        this.stats.assists++;
        
        return true;
    }
    
    steal() {
        // 抢断尝试
        const stealChance = this.attributes.defense / 100 * 0.3;
        return Math.random() < stealChance;
    }
    
    block() {
        // 盖帽尝试
        const blockChance = this.attributes.defense / 100 * 0.2;
        return Math.random() < blockChance;
    }
    
    calculateShotChance(distance, defensePressure) {
        // 计算投篮命中率
        let baseChance = this.attributes.shooting / 100;
        
        // 距离因素
        let distanceFactor = 1.0;
        if (distance > 400) { // 远距离（三分）
            distanceFactor = this.attributes.threePoint / 100;
        } else if (distance > 200) { // 中距离
            distanceFactor = 0.8;
        } else { // 近距离
            distanceFactor = 1.0;
        }
        
        // 防守压力
        const defenseFactor = 1.0 - (defensePressure / 100);
        
        // 体力因素
        const staminaFactor = this.currentStamina / this.attributes.stamina;
        
        // 最终命中率
        let finalChance = baseChance * distanceFactor * defenseFactor * staminaFactor;
        
        return Math.max(0.1, Math.min(0.9, finalChance));
    }
    
    getSpeed() {
        // 考虑体力的速度
        const staminaFactor = this.currentStamina / this.attributes.stamina;
        return this.attributes.speed * staminaFactor;
    }
    
    reset() {
        this.vx = 0;
        this.vy = 0;
        this.isShooting = false;
        this.isDribbling = false;
        this.dribbleTimer = 0;
        this.dribbleType = 'normal';
        this.animation = {
            jump: 0,
            fade: 0,
            spin: 0
        };
    }
}
