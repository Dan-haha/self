// 资源管理器
class AssetManager {
    constructor() {
        this.assets = {
            images: {},
            sounds: {},
            fonts: {},
            data: {}
        };
        
        this.loaded = false;
        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;
        
        this.callbacks = {
            onProgress: null,
            onComplete: null,
            onError: null
        };
        
        this.init();
    }
    
    init() {
        console.log('资源管理器初始化');
        this.preloadEssentialAssets();
    }
    
    preloadEssentialAssets() {
        // 预加载基本资源
        const essentialAssets = [
            // 这里可以添加必须预加载的资源
        ];
        
        this.totalAssets = essentialAssets.length;
        
        if (this.totalAssets === 0) {
            this.loaded = true;
            this.loadProgress = 100;
        }
    }
    
    loadImage(key, url) {
        return new Promise((resolve, reject) => {
            this.totalAssets++;
            
            const img = new Image();
            img.onload = () => {
                this.assets.images[key] = img;
                this.onAssetLoaded();
                resolve(img);
            };
            
            img.onerror = (error) => {
                console.error(`图片加载失败: ${url}`, error);
                this.onAssetError(error);
                reject(error);
            };
            
            img.src = url;
        });
    }
    
    loadSound(key, url) {
        return new Promise((resolve, reject) => {
            this.totalAssets++;
            
            const audio = new Audio();
            audio.preload = 'auto';
            
            audio.addEventListener('canplaythrough', () => {
                this.assets.sounds[key] = audio;
                this.onAssetLoaded();
                resolve(audio);
            }, { once: true });
            
            audio.addEventListener('error', (error) => {
                console.error(`音频加载失败: ${url}`, error);
                this.onAssetError(error);
                reject(error);
            }, { once: true });
            
            audio.src = url;
            audio.load();
        });
    }
    
    loadFont(key, fontFamily, url) {
        return new Promise((resolve, reject) => {
            this.totalAssets++;
            
            const font = new FontFace(fontFamily, `url(${url})`);
            
            font.load().then((loadedFont) => {
                document.fonts.add(loadedFont);
                this.assets.fonts[key] = loadedFont;
                this.onAssetLoaded();
                resolve(loadedFont);
            }).catch((error) => {
                console.error(`字体加载失败: ${url}`, error);
                this.onAssetError(error);
                reject(error);
            });
        });
    }
    
    loadJSON(key, url) {
        return new Promise((resolve, reject) => {
            this.totalAssets++;
            
            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    return response.json();
                })
                .then(data => {
                    this.assets.data[key] = data;
                    this.onAssetLoaded();
                    resolve(data);
                })
                .catch(error => {
                    console.error(`JSON加载失败: ${url}`, error);
                    this.onAssetError(error);
                    reject(error);
                });
        });
    }
    
    onAssetLoaded() {
        this.loadedAssets++;
        this.loadProgress = Math.floor((this.loadedAssets / this.totalAssets) * 100);
        
        // 调用进度回调
        if (this.callbacks.onProgress) {
            this.callbacks.onProgress(this.loadProgress);
        }
        
        // 检查是否全部加载完成
        if (this.loadedAssets === this.totalAssets) {
            this.loaded = true;
            
            if (this.callbacks.onComplete) {
                this.callbacks.onComplete();
            }
        }
    }
    
    onAssetError(error) {
        this.loadedAssets++;
        
        // 即使出错也计入进度
        this.loadProgress = Math.floor((this.loadedAssets / this.totalAssets) * 100);
        
        if (this.callbacks.onProgress) {
            this.callbacks.onProgress(this.loadProgress);
        }
        
        if (this.callbacks.onError) {
            this.callbacks.onError(error);
        }
    }
    
    getImage(key) {
        return this.assets.images[key];
    }
    
    getSound(key) {
        return this.assets.sounds[key];
    }
    
    getFont(key) {
        return this.assets.fonts[key];
    }
    
    getData(key) {
        return this.assets.data[key];
    }
    
    playSound(key, volume = 1.0, loop = false) {
        const sound = this.assets.sounds[key];
        if (sound) {
            const audio = sound.cloneNode();
            audio.volume = volume;
            audio.loop = loop;
            
            audio.play().catch(error => {
                console.log('音频播放失败:', error);
            });
            
            return audio;
        }
        return null;
    }
    
    stopSound(audio) {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
    }
    
    setCallback(type, callback) {
        if (this.callbacks.hasOwnProperty(type)) {
            this.callbacks[type] = callback;
        }
    }
    
    getLoadProgress() {
        return this.loadProgress;
    }
    
    isLoaded() {
        return this.loaded;
    }
    
    reset() {
        this.assets = {
            images: {},
            sounds: {},
            fonts: {},
            data: {}
        };
        
        this.loaded = false;
        this.loadProgress = 0;
        this.totalAssets = 0;
        this.loadedAssets = 0;
    }
    
    // 预加载游戏资源
    preloadGameAssets() {
        const assetManifest = {
            images: [
                // { key: 'court', url: 'assets/images/court.png' },
                // { key: 'player', url: 'assets/images/player.png' },
                // { key: 'ball', url: 'assets/images/ball.png' }
            ],
            sounds: [
                // { key: 'bounce', url: 'assets/sounds/bounce.mp3' },
                // { key: 'swish', url: 'assets/sounds/swish.mp3' },
                // { key: 'dribble', url: 'assets/sounds/dribble.mp3' },
                // { key: 'crowd', url: 'assets/sounds/crowd.mp3' },
                // { key: 'buzzer', url: 'assets/sounds/buzzer.mp3' }
            ],
            fonts: [
                // { key: 'scoreboard', fontFamily: 'Scoreboard', url: 'assets/fonts/scoreboard.ttf' }
            ],
            data: [
                // { key: 'teams', url: 'assets/data/teams.json' },
                // { key: 'players', url: 'assets/data/players.json' }
            ]
        };
        
        const promises = [];
        
        // 加载图片
        assetManifest.images.forEach(asset => {
            promises.push(this.loadImage(asset.key, asset.url));
        });
        
        // 加载声音
        assetManifest.sounds.forEach(asset => {
            promises.push(this.loadSound(asset.key, asset.url));
        });
        
        // 加载字体
        assetManifest.fonts.forEach(asset => {
            promises.push(this.loadFont(asset.key, asset.fontFamily, asset.url));
        });
        
        // 加载数据
        assetManifest.data.forEach(asset => {
            promises.push(this.loadJSON(asset.key, asset.url));
        });
        
        return Promise.all(promises);
    }
}

// 创建全局资源管理器实例
const Assets = new AssetManager();
