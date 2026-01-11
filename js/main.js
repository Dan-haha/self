// 游戏主入口文件
class GameMain {
    constructor() {
        this.game = null;
        this.currentScreen = 'loading';
        this.init();
    }
    
    init() {
        // 预加载资源
        this.preloadAssets().then(() => {
            this.setupEventListeners();
            this.showMainMenu();
        }).catch(error => {
            console.error('资源加载失败:', error);
            this.showError('资源加载失败，请刷新页面重试');
        });
    }
    
    preloadAssets() {
        return new Promise((resolve, reject) => {
            // 模拟资源加载
            setTimeout(() => {
                // 加载声音
                const sounds = [
                    'bounce-sound',
                    'swish-sound', 
                    'dribble-sound',
                    'crowd-sound',
                    'buzzer-sound'
                ];
                
                let loaded = 0;
                sounds.forEach(soundId => {
                    const sound = document.getElementById(soundId);
                    if (sound) {
                        sound.addEventListener('canplaythrough', () => {
                            loaded++;
                            if (loaded === sounds.length) {
                                resolve();
                            }
                        });
                        sound.load();
                    } else {
                        loaded++;
                    }
                });
                
                // 如果所有声音都已加载或不存在，则立即解析
                if (loaded === sounds.length) {
                    resolve();
                }
            }, 2000); // 模拟2秒加载时间
        });
    }
    
    setupEventListeners() {
        // 主菜单按钮
        document.getElementById('quick-game').addEventListener('click', () => {
            this.startQuickGame();
        });
        
        document.getElementById('season-mode').addEventListener('click', () => {
            this.showSeasonMode();
        });
        
        document.getElementById('multiplayer').addEventListener('click', () => {
            this.showMultiplayer();
        });
        
        document.getElementById('training').addEventListener('click', () => {
            this.showTraining();
        });
        
        document.getElementById('settings').addEventListener('click', () => {
            this.showSettings();
        });
        
        document.getElementById('credits').addEventListener('click', () => {
            this.showCredits();
        });
        
        // 球队选择
        this.setupTeamSelection();
        
        // 难度选择
        this.setupDifficultySelection();
        
        // 暂停菜单
        document.getElementById('resume-game').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('game-settings').addEventListener('click', () => {
            this.showGameSettings();
        });
        
        document.getElementById('back-to-menu').addEventListener('click', () => {
            this.returnToMainMenu();
        });
        
        // 游戏结束按钮
        document.getElementById('play-again').addEventListener('click', () => {
            this.playAgain();
        });
        
        document.getElementById('back-to-main').addEventListener('click', () => {
            this.returnToMainMenu();
        });
    }
    
    setupTeamSelection() {
        const teams = [
            { id: 'lakers', name: '洛杉矶湖人', logo: 'LAL', color1: '#552583', color2: '#FDB927', rating: 85 },
            { id: 'warriors', name: '金州勇士', logo: 'GSW', color1: '#1D428A', color2: '#FFC72C', rating: 88 },
            { id: 'bulls', name: '芝加哥公牛', logo: 'CHI', color1: '#CE1141', color2: '#000000', rating: 82 },
            { id: 'celtics', name: '波士顿凯尔特人', logo: 'BOS', color1: '#008348', color2: '#BB9753', rating: 87 },
            { id: 'nets', name: '布鲁克林篮网', logo: 'BKN', color1: '#000000', color2: '#FFFFFF', rating: 84 },
            { id: 'bucks', name: '密尔沃基雄鹿', logo: 'MIL', color1: '#00471B', color2: '#EEE1C6', rating: 86 },
            { id: 'suns', name: '菲尼克斯太阳', logo: 'PHX', color1: '#1D1160', color2: '#E56020', rating: 83 },
            { id: 'heat', name: '迈阿密热火', logo: 'MIA', color1: '#98002E', color2: '#F9A01B', rating: 85 },
            { id: 'nuggets', name: '丹佛掘金', logo: 'DEN', color1: '#0E2240', color2: '#FEC524', rating: 86 },
            { id: 'sixers', name: '费城76人', logo: 'PHI', color1: '#006BB6', color2: '#ED174C', rating: 84 },
            { id: 'clippers', name: '洛杉矶快船', logo: 'LAC', color1: '#C8102E', color2: '#1D428A', rating: 83 },
            { id: 'mavericks', name: '达拉斯独行侠', logo: 'DAL', color1: '#00538C', color2: '#B8C4CA', rating: 85 }
        ];
        
        const container = document.getElementById('teams-container');
        container.innerHTML = '';
        
        teams.forEach(team => {
            const card = document.createElement('div');
            card.className = 'team-card';
            card.dataset.teamId = team.id;
            
            card.innerHTML = `
                <div class="team-logo" style="background: linear-gradient(45deg, ${team.color1}, ${team.color2}); color: ${team.color1 === '#000000' ? 'white' : 'black'}">
                    ${team.logo}
                </div>
                <div class="team-name">${team.name}</div>
                <div class="team-rating">评分: ${team.rating}</div>
            `;
            
            card.addEventListener('click', () => {
                // 移除之前选中的
                document.querySelectorAll('.team-card').forEach(c => {
                    c.classList.remove('selected');
                });
                
                // 选中当前
                card.classList.add('selected');
                
                // 更新选中的球队
                this.selectedTeam = team;
                
                // 更新界面
                document.getElementById('home-logo').textContent = team.logo;
                document.getElementById('home-name').textContent = team.name;
                document.getElementById('home-logo').style.background = `linear-gradient(45deg, ${team.color1}, ${team.color2})`;
            });
            
            container.appendChild(card);
        });
        
        // 默认选中第一个
        if (teams.length > 0) {
            container.querySelector('.team-card').click();
        }
    }
    
    setupDifficultySelection() {
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除之前选中的
                document.querySelectorAll('.diff-btn').forEach(b => {
                    b.classList.remove('active');
                });
                
                // 选中当前
                btn.classList.add('active');
                this.difficulty = btn.dataset.level;
            });
        });
    }
    
    showMainMenu() {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        this.currentScreen = 'menu';
    }
    
    startQuickGame() {
        if (!this.selectedTeam) {
            alert('请先选择一支球队！');
            return;
        }
        
        // 随机选择对手（不能和自己相同）
        const allTeams = Array.from(document.querySelectorAll('.team-card'))
            .map(card => ({
                id: card.dataset.teamId,
                name: card.querySelector('.team-name').textContent,
                logo: card.querySelector('.team-logo').textContent,
                color1: card.querySelector('.team-logo').style.background.match(/linear-gradient\(45deg, (#[0-9A-F]{6}),/)?.[1] || '#000000'
            }))
            .filter(team => team.id !== this.selectedTeam.id);
        
        const opponent = allTeams[Math.floor(Math.random() * allTeams.length)];
        
        // 隐藏主菜单，显示游戏界面
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-screen').classList.remove('hidden');
        this.currentScreen = 'game';
        
        // 设置对手信息
        document.getElementById('away-logo').textContent = opponent.logo;
        document.getElementById('away-name').textContent = opponent.name;
        document.getElementById('away-logo').style.background = `linear-gradient(45deg, ${opponent.color1}, #ffffff)`;
        
        // 初始化游戏
        this.game = new BasketballGame({
            homeTeam: this.selectedTeam,
            awayTeam: opponent,
            difficulty: this.difficulty || 'pro'
        });
        
        this.game.start();
    }
    
    showSeasonMode() {
        alert('赛季模式将在完整版中实现！');
    }
    
    showMultiplayer() {
        alert('多人游戏模式将在完整版中实现！');
    }
    
    showTraining() {
        alert('训练模式将在完整版中实现！');
    }
    
    showSettings() {
        alert('游戏设置将在完整版中实现！');
    }
    
    showCredits() {
        alert('篮球精英 2024\n\n开发者: 篮球游戏工作室\n版本: 1.0.0\n\n感谢游玩！');
    }
    
    resumeGame() {
        if (this.game) {
            this.game.resume();
            document.getElementById('pause-menu').classList.add('hidden');
        }
    }
    
    showGameSettings() {
        alert('游戏内设置将在完整版中实现！');
    }
    
    returnToMainMenu() {
        if (this.game) {
            this.game.stop();
            this.game = null;
        }
        
        document.getElementById('pause-menu').classList.add('hidden');
        this.showMainMenu();
    }
    
    showGameOver(homeScore, awayScore, homeTeam, awayTeam) {
        document.getElementById('game-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.remove('hidden');
        this.currentScreen = 'gameover';
        
        // 更新分数
        document.getElementById('final-home-name').textContent = homeTeam.name;
        document.getElementById('final-home-score').textContent = homeScore;
        document.getElementById('final-away-name').textContent = awayTeam.name;
        document.getElementById('final-away-score').textContent = awayScore;
        
        // 确定胜者
        let winnerText = '';
        if (homeScore > awayScore) {
            winnerText = `${homeTeam.name} 获胜！`;
        } else if (awayScore > homeScore) {
            winnerText = `${awayTeam.name} 获胜！`;
        } else {
            winnerText = '平局！';
        }
        
        document.getElementById('winner-text').textContent = winnerText;
        
        // 计算统计（模拟）
        const totalTime = '48:00';
        const fgPercentage = `${Math.floor(Math.random() * 30) + 40}%`;
        const threePtPercentage = `${Math.floor(Math.random() * 30) + 30}%`;
        
        document.getElementById('total-time').textContent = totalTime;
        document.getElementById('fg-percentage').textContent = fgPercentage;
        document.getElementById('3pt-percentage').textContent = threePtPercentage;
    }
    
    playAgain() {
        if (this.game) {
            this.game.reset();
            this.game.start();
            
            document.getElementById('game-over-screen').classList.add('hidden');
            document.getElementById('game-screen').classList.remove('hidden');
            this.currentScreen = 'game';
        }
    }
    
    showError(message) {
        document.getElementById('loading-screen').innerHTML = `
            <div class="error-message">
                <h2>错误</h2>
                <p>${message}</p>
                <button onclick="location.reload()">重新加载</button>
            </div>
        `;
    }
}

// 游戏启动
window.addEventListener('load', () => {
    window.gameMain = new GameMain();
});
