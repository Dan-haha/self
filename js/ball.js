// 篮球类
class Ball {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.z = 0; // 用于3D效果
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.radius = 10;
        this.holder = null; // 持球球员
        this.inAir = false;
        this.lastHolder = null;
        this.spin = 0; // 旋转效果
        
        // 篮球纹理
        this.texture = {
            color1: '#ff8c00',
            color2: '#cc7000',
            lines: 8
        };
        
        // 轨迹点（用于绘制轨迹）
        this.trajectory = [];
        this.maxTrajectoryPoints = 20;
    }
    
    update() {
        if (this.inAir) {
            // 应用重力
            this.vz -= 0.5;
            
            // 更新位置
            this.x += this.vx;
            this.y += this.vy;
            this.z += this.vz;
            
            // 地面碰撞
            if (this.z <= 0) {
                this.z = 0;
                this.vz = -this.vz * 0.7; // 反弹
                this.vx *= 0.9;
                this.vy *= 0.9;
                
                // 如果速度很小，停止弹跳
                if (Math.abs(this.vz) < 0.5) {
                    this.vz = 0;
                }
            }
            
            // 旋转效果
            this.spin += Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 0.1;
            
            // 记录轨迹
            this.trajectory.push({ x: this.x, y: this.y, z: this.z });
            if (this.trajectory.length > this.maxTrajectoryPoints) {
                this.trajectory.shift();
            }
        } else if (this.holder) {
            // 篮球在球员手中
            this.x = this.holder.x;
            this.y = this.holder.y - this.holder.radius;
            this.z = 0;
        }
    }
    
    render(ctx) {
        // 保存上下文
        ctx.save();
        
        // 计算篮球在画布上的位置（考虑Z轴）
        const scale = 1 + this.z / 200;
        const drawX = this.x;
        const drawY = this.y - this.z * 0.5; // 模拟透视
        
        // 绘制篮球
        ctx.translate(drawX, drawY);
        ctx.scale(scale, scale);
        
        // 篮球主体
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
        gradient.addColorStop(0, this.texture.color1);
        gradient.addColorStop(1, this.texture.color2);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 篮球线条
        ctx.strokeStyle = '#8B4513';
        ctx.lineWidth = 1;
        
        // 旋转线条
        ctx.rotate(this.spin);
        
        // 绘制线条
        for (let i = 0; i < this.texture.lines; i++) {
            const angle = (Math.PI * 2 / this.texture.lines) * i;
            ctx.beginPath();
            ctx.moveTo(
                Math.cos(angle) * this.radius * 0.7,
                Math.sin(angle) * this.radius * 0.7
            );
            ctx.lineTo(
                Math.cos(angle + Math.PI) * this.radius * 0.7,
                Math.sin(angle + Math.PI) * this.radius * 0.7
            );
            ctx.stroke();
        }
        
        // 中间线条
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // 阴影
        if (this.z > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.beginPath();
            ctx.ellipse(0, this.radius * 1.5, this.radius * 1.2, this.radius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
        
        // 绘制轨迹（调试用）
        this.renderTrajectory(ctx);
    }
    
    renderTrajectory(ctx) {
        if (this.trajectory.length < 2) return;
        
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // 绘制轨迹线
        for (let i = 0; i < this.trajectory.length - 1; i++) {
            const point1 = this.trajectory[i];
            const point2 = this.trajectory[i + 1];
            
            // 计算绘制位置（考虑Z轴）
            const drawX1 = point1.x;
            const drawY1 = point1.y - point1.z * 0.5;
            const drawX2 = point2.x;
            const drawY2 = point2.y - point2.z * 0.5;
            
            if (i === 0) {
                ctx.moveTo(drawX1, drawY1);
            }
            ctx.lineTo(drawX2, drawY2);
        }
        
        ctx.stroke();
    }
    
    shoot(shooter, targetX, targetY, power) {
        this.holder = null;
        this.inAir = true;
        this.lastHolder = shooter;
        
        // 计算射击向量
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算所需时间（基于力量和距离）
        const time = 1.0 + distance / 300 + (1 - power) * 0.5;
        
        // 水平速度
        this.vx = dx / time;
        this.vy = dy / time;
        
        // 垂直速度（基于力量）
        this.vz = 50 + power * 30;
        
        // 清除轨迹
        this.trajectory = [];
        
        console.log(`投篮：从(${this.x}, ${this.y}) 到 (${targetX}, ${targetY})，力量：${power}`);
    }
    
    pass(passer, receiver) {
        this.holder = null;
        this.inAir = true;
        this.lastHolder = passer;
        
        // 计算传球向量
        const dx = receiver.x - this.x;
        const dy = receiver.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算传球时间（基于距离）
        const time = 0.5 + distance / 500;
        
        // 水平速度
        this.vx = dx / time;
        this.vy = dy / time;
        
        // 垂直速度
        this.vz = 30;
        
        // 清除轨迹
        this.trajectory = [];
        
        console.log(`传球：从${passer.name} 到 ${receiver.name}`);
    }
    
    bounce() {
        // 模拟篮球弹跳
        if (this.z <= 0 && Math.abs(this.vz) > 0.5) {
            this.vz = -this.vz * 0.7;
        }
    }
    
    reset() {
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.holder = null;
        this.inAir = false;
        this.trajectory = [];
    }
    
    isOutOfBounds(courtWidth, courtHeight, margin = 50) {
        return this.x < margin || this.x > courtWidth - margin || 
               this.y < margin || this.y > courtHeight - margin;
    }
}
