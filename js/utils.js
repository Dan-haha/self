// 工具函数库
class GameUtils {
    constructor() {
        // 数学常量
        this.PI = Math.PI;
        this.TWO_PI = Math.PI * 2;
        this.HALF_PI = Math.PI / 2;
        
        // 随机种子
        this.seed = Date.now();
        
        this.init();
    }
    
    init() {
        console.log('工具函数库初始化');
    }
    
    // 数学函数
    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }
    
    lerp(start, end, t) {
        return start + (end - start) * t;
    }
    
    map(value, inMin, inMax, outMin, outMax) {
        return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
    
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    distance3D(x1, y1, z1, x2, y2, z2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    angleBetween(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }
    
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    radiansToDegrees(radians) {
        return radians * (180 / Math.PI);
    }
    
    pointInCircle(px, py, cx, cy, radius) {
        const dx = px - cx;
        const dy = py - cy;
        return dx * dx + dy * dy <= radius * radius;
    }
    
    pointInRectangle(px, py, rx, ry, rw, rh) {
        return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
    }
    
    circleCircleCollision(x1, y1, r1, x2, y2, r2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < r1 + r2;
    }
    
    circleRectangleCollision(cx, cy, radius, rx, ry, rw, rh) {
        // 找到矩形上离圆心最近的点
        const closestX = this.clamp(cx, rx, rx + rw);
        const closestY = this.clamp(cy, ry, ry + rh);
        
        // 计算圆心到最近点的距离
        const distanceX = cx - closestX;
        const distanceY = cy - closestY;
        
        // 检查是否碰撞
        return (distanceX * distanceX + distanceY * distanceY) < (radius * radius);
    }
    
    // 随机数函数
    random(min, max) {
        if (arguments.length === 1) {
            max = min;
            min = 0;
        }
        return Math.random() * (max - min) + min;
    }
    
    randomInt(min, max) {
        if (arguments.length === 1) {
            max = min;
            min = 0;
        }
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    weightedRandom(weights) {
        const total = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * total;
        
        for (let i = 0; i < weights.length; i++) {
            if (random < weights[i]) {
                return i;
            }
            random -= weights[i];
        }
        
        return weights.length - 1;
    }
    
    setSeed(seed) {
        this.seed = seed;
        // 这里可以添加确定性随机数生成器
    }
    
    // 颜色函数
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    hslToRgb(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }
    
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }
    
    // 字符串函数
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    formatNumber(number, decimals = 0) {
        return number.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    
    generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }
    
    // 数组函数
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }
    
    // 对象函数
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        
        if (obj instanceof Date) {
            return new Date(obj.getTime());
        }
        
        if (obj instanceof Array) {
            return obj.map(item => this.deepClone(item));
        }
        
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
        
        return obj;
    }
    
    mergeObjects(...objects) {
        const result = {};
        
        objects.forEach(obj => {
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                        result[key] = this.mergeObjects(result[key] || {}, obj[key]);
                    } else {
                        result[key] = obj[key];
                    }
                }
            }
        });
        
        return result;
    }
    
    // 游戏相关函数
    calculateShotAccuracy(distance, playerSkill, defensePressure, shotType = 'normal') {
        let baseAccuracy = playerSkill / 100;
        
        // 距离因素
        let distanceFactor = 1.0;
        if (distance > 400) {
            distanceFactor = 0.6; // 远距离
            if (shotType === 'three') {
                distanceFactor = 0.8; // 三分球专门训练
            }
        } else if (distance > 200) {
            distanceFactor = 0.8; // 中距离
        }
        
        // 防守压力
        const defenseFactor = 1.0 - (defensePressure / 100);
        
        // 最终命中率
        let finalAccuracy = baseAccuracy * distanceFactor * defenseFactor;
        
        return this.clamp(finalAccuracy, 0.1, 0.95);
    }
    
    calculateDunkChance(playerHeight, defenderHeight, playerJump, timing) {
        // 计算扣篮成功率
        const heightAdvantage = (playerHeight - defenderHeight) / 10;
        const timingBonus = timing > 0.8 ? 0.2 : timing > 0.6 ? 0.1 : 0;
        
        return this.clamp(0.5 + heightAdvantage + timingBonus, 0.1, 0.95);
    }
    
    calculateStealChance(defenderSkill, ballHandlerSkill, angle) {
        // 计算抢断成功率
        const skillDifference = (defenderSkill - ballHandlerSkill) / 100;
        const angleBonus = Math.abs(angle) < 0.5 ? 0.1 : 0; // 从正面抢断更容易
        
        return this.clamp(0.1 + skillDifference + angleBonus, 0.01, 0.5);
    }
    
    calculateBlockChance(defenderHeight, defenderTiming, shotHeight) {
        // 计算盖帽成功率
        const heightFactor = defenderHeight / 200; // 假设平均身高200cm
        const timingFactor = defenderTiming;
        
        return this.clamp(heightFactor * timingFactor * 0.5, 0.05, 0.8);
    }
    
    // 性能优化
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // 浏览器相关
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = '未知';
        
        if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
        else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
        else if (ua.indexOf('Safari') > -1) browser = 'Safari';
        else if (ua.indexOf('Edge') > -1) browser = 'Edge';
        else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
        else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident/') > -1) browser = 'IE';
        
        return {
            browser: browser,
            userAgent: ua,
            isMobile: this.isMobile(),
            isTouch: this.isTouchDevice()
        };
    }
    
    // 存储相关
    saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存到本地存储失败:', error);
            return false;
        }
    }
    
    loadFromLocalStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (error) {
            console.error('从本地存储加载失败:', error);
            return defaultValue;
        }
    }
    
    removeFromLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('从本地存储删除失败:', error);
            return false;
        }
    }
    
    clearLocalStorage() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('清空本地存储失败:', error);
            return false;
        }
    }
}

// 创建全局工具实例
const Utils = new GameUtils();
