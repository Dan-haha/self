// 球场渲染类
class CourtRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 球场颜色
        this.colors = {
            court: '#1a472a',
            lines: '#ffffff',
            centerCircle: '#ffffff',
            paint: '#ffffff',
            threePointLine: '#ffffff',
            restrictedArea: '#ffffff'
        };
        
        // 纹理
        this.textures = {
            court: null,
            crowd: null
        };
        
        // 照明
        this.lighting = {
            enabled: true,
            intensity: 0.7,
            direction: { x: 0.5, y: 0.5 }
        };
        
        // 阴影
        this.shadows = {
            enabled: true,
            opacity: 0.3
        };
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 绘制球场
        this.drawCourt();
        
        // 绘制球场线
        this.drawCourtLines();
        
        // 绘制阴影
        if (this.shadows.enabled) {
            this.drawShadows();
        }
    }
    
    drawCourt() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        // 球场背景
        ctx.fillStyle = this.colors.court;
        ctx.fillRect(0, 0, width, height);
        
        // 添加纹理（如果可用）
        if (this.textures.court) {
            // 使用纹理
            ctx.drawImage(this.textures.court, 0, 0, width, height);
        } else {
            // 绘制简单的木质纹理效果
            this.drawWoodTexture();
        }
        
        // 添加照明效果
        if (this.lighting.enabled) {
            this.applyLighting();
        }
    }
    
    drawWoodTexture() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        // 创建木质纹理
        ctx.save();
        
        // 木质条纹
        ctx.strokeStyle = 'rgba(139, 69, 19, 0.1)';
        ctx.lineWidth = 2;
        
        // 水平条纹
        for (let y = 0; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // 垂直条纹
        for (let x = 0; x < width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    applyLighting() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        // 创建径向渐变模拟光照
        const gradient = ctx.createRadialGradient(
            width * this.lighting.direction.x,
            height * this.lighting.direction.y,
            0,
            width * this.lighting.direction.x,
            height * this.lighting.direction.y,
            Math.max(width, height) * 0.8
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    drawCourtLines() {
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        // 设置线条样式
        ctx.strokeStyle = this.colors.lines;
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        
        // 边界线
        const margin = 50;
        ctx.strokeRect(margin, margin, width - 2 * margin, height - 2 * margin);
        
        // 中线
        ctx.beginPath();
        ctx.moveTo(width / 2, margin);
        ctx.lineTo(width / 2, height - margin);
        ctx.stroke();
        
        // 中心圆
        ctx.beginPath();
        ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
        ctx.stroke();
        
        // 三分线 - 左侧
        ctx.beginPath();
        ctx.arc(margin, height / 2, 180, -Math.PI * 0.5, Math.PI * 0.5);
        ctx.stroke();
        
        // 三分线 - 右侧
        ctx.beginPath();
        ctx.arc(width - margin, height / 2, 180, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
        
        // 罚球区 - 左侧
        this.drawPaintArea(margin, height / 2, 'left');
        
        // 罚球区 - 右侧
        this.drawPaintArea(width - margin, height / 2, 'right');
        
        // 限制区 - 左侧
        ctx.beginPath();
        ctx.arc(margin, height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // 限制区 - 右侧
        ctx.beginPath();
        ctx.arc(width - margin, height / 2, 40, 0, Math.PI * 2);
        ctx.stroke();
        
        // 篮筐 - 左侧
        this.drawHoop(margin, height / 2);
        
        // 篮筐 - 右侧
        this.drawHoop(width - margin, height / 2);
        
        // 篮板 - 左侧
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(margin - 60, height / 2 - 30, 10, 60);
        
        // 篮板 - 右侧
        ctx.fillRect(width - margin + 50, height / 2 - 30, 10, 60);
    }
    
    drawPaintArea(x, y, side) {
        const ctx = this.ctx;
        const height = this.height;
        
        ctx.beginPath();
        
        if (side === 'left') {
            // 左侧罚球区
            ctx.arc(x, y, 60, -Math.PI * 0.5, Math.PI * 0.5);
            ctx.lineTo(x + 120, y - 60);
            ctx.lineTo(x + 120, y + 60);
            ctx.closePath();
        } else {
            // 右侧罚球区
            ctx.arc(x, y, 60, Math.PI * 0.5, Math.PI * 1.5);
            ctx.lineTo(x - 120, y + 60);
            ctx.lineTo(x - 120, y - 60);
            ctx.closePath();
        }
        
        ctx.stroke();
    }
    
    drawHoop(x, y) {
        const ctx = this.ctx;
        
        // 篮筐
        ctx.fillStyle = '#ff6b00';
        ctx.fillRect(x - 10, y - 5, 20, 10);
        
        // 篮网（简化版）
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            const angle = (i / 4) * Math.PI - Math.PI * 0.5;
            const startX = x + Math.cos(angle) * 10;
            const startY = y + Math.sin(angle) * 10;
            const endX = x + Math.cos(angle) * 15;
            const endY = y + Math.sin(angle) * 15 + 5;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    drawShadows() {
        // 这个方法需要在游戏循环中由游戏对象调用，传入球员和篮球
        // 这里只是占位
    }
    
    drawPlayerShadows(players) {
        const ctx = this.ctx;
        
        players.forEach(player => {
            // 计算阴影位置（基于球员位置）
            const shadowX = player.x;
            const shadowY = player.y + player.radius * 0.5;
            const shadowRadius = player.radius * 0.8;
            
            // 绘制阴影
            ctx.fillStyle = `rgba(0, 0, 0, ${this.shadows.opacity})`;
            ctx.beginPath();
            ctx.ellipse(shadowX, shadowY, shadowRadius, shadowRadius * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawBallShadow(ball) {
        if (ball.z <= 0) return;
        
        const ctx = this.ctx;
        const shadowX = ball.x;
        const shadowY = ball.y;
        const shadowRadius = ball.radius * (1 + ball.z / 100);
        
        // 绘制篮球阴影
        ctx.fillStyle = `rgba(0, 0, 0, ${this.shadows.opacity * (1 - ball.z / 200)})`;
        ctx.beginPath();
        ctx.ellipse(shadowX, shadowY, shadowRadius, shadowRadius * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawCrowd() {
        // 绘制观众（简化版）
        const ctx = this.ctx;
        const width = this.width;
        const height = this.height;
        
        // 底部观众
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, height - 50, width, 50);
        
        // 观众席纹理
        ctx.fillStyle = '#34495e';
        for (let x = 0; x < width; x += 20) {
            ctx.fillRect(x, height - 50, 10, 50);
        }
        
        // 顶部观众
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, width, 50);
        
        // 观众席纹理
        ctx.fillStyle = '#34495e';
        for (let x = 0; x < width; x += 20) {
            ctx.fillRect(x, 0, 10, 50);
        }
    }
}
