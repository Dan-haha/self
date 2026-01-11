// 智能AI系统
class AISystem {
    constructor(difficulty = 'pro') {
        this.difficulty = difficulty;
        this.difficultySettings = {
            rookie: {
                decisionDelay: 1000, // 决策延迟（毫秒）
                accuracy: 0.4,       // 投篮准确率
                defenseReaction: 0.3, // 防守反应
                mistakeRate: 0.3,     // 失误率
                aggression: 0.3       // 侵略性
            },
            pro: {
                decisionDelay: 700,
                accuracy: 0.55,
                defenseReaction: 0.5,
                mistakeRate: 0.2,
                aggression: 0.5
            },
            allstar: {
                decisionDelay: 500,
                accuracy: 0.65,
                defenseReaction: 0.7,
                mistakeRate: 0.1,
                aggression: 0.7
            },
            legendary: {
                decisionDelay: 300,
                accuracy: 0.75,
                defenseReaction: 0.9,
                mistakeRate: 0.05,
                aggression: 0.9
            }
        };
        
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.pro;
        
        // AI状态
        this.aiState = {
            lastDecisionTime: 0,
            currentAction: null,
            targetPlayer: null,
            strategy: 'balanced',
            offensivePlays: [],
            defensivePlays: []
        };
        
        // 战术系统
        this.tactics = {
            offensive: {
                isolation: {
                    name: '单打战术',
                    description: '为最佳得分手创造单打机会',
                    execute: (team, gameState) => this.executeIsolation(team, gameState)
                },
                pickAndRoll: {
                    name: '挡拆战术',
                    description: '控球后卫和大个子球员执行挡拆',
                    execute: (team, gameState) => this.executePickAndRoll(team, gameState)
                },
                fastBreak: {
                    name: '快攻战术',
                    description: '快速推进到前场得分',
                    execute: (team, gameState) => this.executeFastBreak(team, gameState)
                },
                threePoint: {
                    name: '三分战术',
                    description: '创造外线投篮机会',
                    execute: (team, gameState) => this.executeThreePoint(team, gameState)
                },
                postUp: {
                    name: '低位战术',
                    description: '将球交给内线球员单打',
                    execute: (team, gameState) => this.executePostUp(team, gameState)
                }
            },
            defensive: {
                manToMan: {
                    name: '人盯人防守',
                    description: '每个防守球员盯防一个进攻球员',
                    execute: (team, gameState) => this.executeManToMan(team, gameState)
                },
                zoneDefense: {
                    name: '区域联防',
                    description: '防守指定区域而不是特定球员',
                    execute: (team, gameState) => this.executeZoneDefense(team, gameState)
                },
                fullCourtPress: {
                    name: '全场紧逼',
                    description: '在全场施加防守压力',
                    execute: (team, gameState) => this.executeFullCourtPress(team, gameState)
                },
                doubleTeam: {
                    name: '双人包夹',
                    description: '两名防守球员包夹持球者',
                    execute: (team, gameState) => this.executeDoubleTeam(team, gameState)
                }
            }
        };
        
        this.init();
    }
    
    init() {
        console.log(`AI系统初始化 - 难度: ${this.difficulty}`);
    }
    
    update(gameState) {
        if (!gameState.gameActive || gameState.paused) return;
        
        const currentTime = Date.now();
        
        // 如果AI球队没有球权，执行防守逻辑
        if (gameState.possession !== 'away') {
            this.runDefensiveLogic(gameState);
            return;
        }
        
        // 检查是否需要做出新决策
        if (currentTime - this.aiState.lastDecisionTime < this.settings.decisionDelay) {
            return;
        }
        
        // 做出新决策
        this.makeDecision(gameState);
        this.aiState.lastDecisionTime = currentTime;
    }
    
    makeDecision(gameState) {
        const aiTeam = gameState.awayTeam;
        const userTeam = gameState.homeTeam;
        
        // 获取持球球员
        const ballHandler = this.getBallHandler(aiTeam);
        if (!ballHandler) {
            this.findOpenPlayer(aiTeam, gameState);
            return;
        }
        
        // 根据比赛情况选择行动
        const situation = this.analyzeSituation(gameState);
        const action = this.chooseAction(situation, ballHandler, gameState);
        
        // 执行选择的行为
        this.executeAction(action, ballHandler, gameState);
    }
    
    analyzeSituation(gameState) {
        const analysis = {
            shotClock: gameState.shotClock,
            scoreDifference: gameState.score.away - gameState.score.home,
            quarter: gameState.quarter,
            timeRemaining: gameState.gameClock,
            playerPositions: {},
            defensivePressure: 0
        };
        
        // 分析球员位置
        const aiPlayers = gameState.awayTeam.players;
        const userPlayers = gameState.homeTeam.players;
        
        // 计算防守压力
        let totalPressure = 0;
        aiPlayers.forEach(player => {
            if (player.hasBall) {
                // 计算持球球员的防守压力
                userPlayers.forEach(defender => {
                    const dx = defender.x - player.x;
                    const dy = defender.y - player.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance < 150) {
                        totalPressure += (150 - distance) / 150;
                    }
                });
            }
        });
        
        analysis.defensivePressure = totalPressure / Math.max(1, aiPlayers.length);
        
        // 确定情况类型
        if (analysis.shotClock < 5) {
            analysis.situationType = 'shotClockLow';
        } else if (analysis.scoreDifference < -10) {
            analysis.situationType = 'losingBadly';
        } else if (analysis.scoreDifference < 0) {
            analysis.situationType = 'losing';
        } else if (analysis.scoreDifference > 10) {
            analysis.situationType = 'winningComfortably';
        } else if (analysis.quarter === 4 && analysis.timeRemaining < 60) {
            analysis.situationType = 'crunchTime';
        } else {
            analysis.situationType = 'normal';
        }
        
        return analysis;
    }
    
    chooseAction(situation, ballHandler, gameState) {
        const actions = [];
        const aiTeam = gameState.awayTeam;
        
        // 基于情况添加可能的行动
        switch(situation.situationType) {
            case 'shotClockLow':
                // 投篮时钟快到时，必须投篮
                actions.push('shoot');
                break;
                
            case 'losingBadly':
                // 大幅落后时，采取激进策略
                actions.push('shootThree', 'driveAggressive', 'fastBreak');
                break;
                
            case 'crunchTime':
                // 关键时刻，保守选择
                actions.push('drive', 'postUp', 'midRange');
                break;
                
            default:
                // 正常情况，所有行动都考虑
                actions.push('drive', 'shoot', 'pass', 'postUp', 'pickAndRoll');
        }
        
        // 考虑球员能力
        const playerCapabilities = this.evaluatePlayerCapabilities(ballHandler);
        
        // 过滤掉球员不擅长的行动
        const viableActions = actions.filter(action => {
            switch(action) {
                case 'shoot':
                case 'shootThree':
                case 'midRange':
                    return playerCapabilities.shooting > 70;
                case 'drive':
                case 'driveAggressive':
                    return playerCapabilities.dribbling > 75 && playerCapabilities.speed > 75;
                case 'postUp':
                    return playerCapabilities.strength > 70 && playerCapabilities.height > 200;
                default:
                    return true;
            }
        });
        
        // 如果没有可行行动，默认传球
        if (viableActions.length === 0) {
            return 'pass';
        }
        
        // 基于难度设置选择行动
        const randomFactor = Math.random();
        let selectedAction;
        
        if (randomFactor < 0.1 * this.settings.mistakeRate) {
            // 偶尔失误
            selectedAction = 'turnover';
        } else if (viableActions.includes('shoot') && randomFactor < this.settings.aggression) {
            // 侵略性投篮
            selectedAction = 'shoot';
        } else {
            // 随机选择可行行动
            selectedAction = viableActions[Math.floor(Math.random() * viableActions.length)];
        }
        
        return selectedAction;
    }
    
    evaluatePlayerCapabilities(player) {
        // 评估球员能力（简化版）
        return {
            shooting: player.attributes.shooting || 70,
            dribbling: player.attributes.dribbling || 70,
            speed: player.attributes.speed || 70,
            strength: 70, // 假设值
            height: player.role === 'C' ? 210 : player.role === 'PF' ? 205 : player.role === 'SF' ? 200 : player.role === 'SG' ? 195 : 185
        };
    }
    
    executeAction(action, ballHandler, gameState) {
        const aiTeam = gameState.awayTeam;
        
        switch(action) {
            case 'shoot':
                this.aiShoot(ballHandler, gameState);
                break;
                
            case 'shootThree':
                this.aiShootThree(ballHandler, gameState);
                break;
                
            case 'drive':
                this.aiDrive(ballHandler, gameState);
                break;
                
            case 'driveAggressive':
                this.aiDriveAggressive(ballHandler, gameState);
                break;
                
            case 'pass':
                this.aiPass(ballHandler, aiTeam, gameState);
                break;
                
            case 'postUp':
                this.aiPostUp(ballHandler, gameState);
                break;
                
            case 'pickAndRoll':
                this.executePickAndRoll(aiTeam, gameState);
                break;
                
            case 'turnover':
                this.aiTurnover(ballHandler, gameState);
                break;
                
            default:
                this.aiPass(ballHandler, aiTeam, gameState);
        }
    }
    
    aiShoot(player, gameState) {
        // 决定投篮位置
        const basketX = 90; // AI篮筐在左侧
        const basketY = gameState.canvas.height / 2;
        
        // 计算距离和角度
        const dx = basketX - player.x;
        const dy = basketY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 计算投篮准确率
        const baseAccuracy = player.attributes.shooting / 100;
        const distanceFactor = distance > 400 ? 0.6 : distance > 200 ? 0.8 : 1.0;
        const difficultyFactor = this.settings.accuracy;
        const defenseFactor = 1.0 - (this.calculateDefensePressure(player, gameState) / 100);
        
        const finalAccuracy = baseAccuracy * distanceFactor * difficultyFactor * defenseFactor;
        const isMade = Math.random() < finalAccuracy;
        
        // 执行投篮
        player.shoot(basketX, basketY, 0.7); // 中等力量
        
        // 篮球物理
        gameState.ball.shoot(player, basketX, basketY, 0.7);
        
        // 添加事件
        gameState.ui.addEvent(`${player.name} ${isMade ? '投篮命中' : '投篮未中'} (${Math.round(finalAccuracy * 100)}% 机会)`);
        
        if (isMade) {
            setTimeout(() => {
                gameState.score.away += distance > 400 ? 3 : 2;
                gameState.ui.updateScore(gameState);
                gameState.ui.addEvent(`${gameState.awayTeam.name} 得分！+${distance > 400 ? 3 : 2}分`);
                
                // 重置球权
                gameState.resetAfterScore();
            }, 1500);
        }
    }
    
    aiShootThree(player, gameState) {
        // 三分投篮
        const basketX = 90;
        const basketY = gameState.canvas.height / 2;
        
        // 调整到三分线距离
        const threePointDistance = 400;
        const angle = Math.atan2(basketY - player.y, basketX - player.x);
        const targetX = player.x + Math.cos(angle) * threePointDistance;
        const targetY = player.y + Math.sin(angle) * threePointDistance;
        
        // 计算准确率
        const baseAccuracy = player.attributes.threePoint / 100;
        const difficultyFactor = this.settings.accuracy * 0.9; // 三分更难
        const finalAccuracy = baseAccuracy * difficultyFactor;
        const isMade = Math.random() < finalAccuracy;
        
        // 执行投篮
        player.shoot(targetX, targetY, 0.75);
        gameState.ball.shoot(player, targetX, targetY, 0.75);
        
        gameState.ui.addEvent(`${player.name} 尝试三分球...`);
        
        if (isMade) {
            setTimeout(() => {
                gameState.score.away += 3;
                gameState.ui.updateScore(gameState);
                gameState.ui.addEvent(`三分命中！${gameState.awayTeam.name} +3分`);
                gameState.resetAfterScore();
            }, 1500);
        }
    }
    
    aiDrive(player, gameState) {
        // 突破到篮下
        const targetX = 200; // 向篮下移动
        const targetY = gameState.canvas.height / 2;
        
        // 计算移动方向
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 50) {
            // 向篮下移动
            player.vx += (dx / distance) * 2;
            player.vy += (dy / distance) * 2;
            
            // 运球
            player.dribble(Math.random() > 0.5 ? 'crossover' : 'normal');
            
            // 偶尔决定投篮或传球
            if (distance < 100 && Math.random() < 0.3) {
                // 近距离投篮
                this.aiShoot(player, gameState);
            } else if (Math.random() < 0.2) {
                // 传球给队友
                this.aiPass(player, gameState.awayTeam, gameState);
            }
        } else {
            // 到达篮下，投篮
            this.aiShoot(player, gameState);
        }
    }
    
    aiDriveAggressive(player, gameState) {
        // 更激进的突破
        const targetX = 150;
        const targetY = gameState.canvas.height / 2;
        
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) {
            // 快速移动
            player.vx += (dx / distance) * 3;
            player.vy += (dy / distance) * 3;
            
            // 花式运球
            const dribbleTypes = ['crossover', 'behind', 'spin'];
            player.dribble(dribbleTypes[Math.floor(Math.random() * dribbleTypes.length)]);
            
            // 尝试扣篮（如果够近）
            if (distance < 80 && Math.random() < 0.5) {
                this.aiDunk(player, gameState);
            }
        }
    }
    
    aiDunk(player, gameState) {
        // 扣篮尝试
        const basketX = 90;
        const basketY = gameState.canvas.height / 2;
        
        // 扣篮有更高的命中率但可能被盖帽
        const dunkChance = 0.8;
        const blockChance = this.calculateBlockChance(player, gameState);
        
        if (Math.random() < blockChance) {
            // 被盖帽
            gameState.ui.addEvent(`${player.name} 扣篮被盖帽！`);
            gameState.turnover('away');
        } else if (Math.random() < dunkChance) {
            // 扣篮成功
            gameState.ui.addEvent(`${player.name} 霸气扣篮！`);
            
            setTimeout(() => {
                gameState.score.away += 2;
                gameState.ui.updateScore(gameState);
                gameState.resetAfterScore();
            }, 1000);
        } else {
            // 扣篮失败
            gameState.ui.addEvent(`${player.name} 扣篮不进！`);
            gameState.turnover('away');
        }
    }
    
    aiPass(ballHandler, aiTeam, gameState) {
        // 寻找最佳传球目标
        const teammates = aiTeam.players.filter(p => p !== ballHandler);
        
        if (teammates.length === 0) return;
        
        // 评估每个队友
        const passOptions = teammates.map(teammate => {
            const dx = teammate.x - ballHandler.x;
            const dy = teammate.y - ballHandler.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 计算传球质量（距离越近越好，有投篮机会更好）
            let quality = 1.0 / distance;
            
            // 检查是否有投篮机会
            const shootingChance = teammate.attributes.shooting / 100;
            quality *= (1 + shootingChance);
            
            // 检查是否有防守者
            const defensePressure = this.calculateDefensePressure(teammate, gameState);
            quality *= (1 - defensePressure / 100);
            
            return {
                player: teammate,
                quality: quality,
                distance: distance
            };
        });
        
        // 选择最佳传球目标
        passOptions.sort((a, b) => b.quality - a.quality);
        const bestTarget = passOptions[0].player;
        
        // 执行传球
        ballHandler.hasBall = false;
        bestTarget.hasBall = true;
        
        // 篮球物理
        gameState.ball.pass(ballHandler, bestTarget);
        
        // 添加事件
        gameState.ui.addEvent(`${ballHandler.name} 传球给 ${bestTarget.name}`);
        
        // 偶尔助攻
        if (Math.random() < 0.3) {
            // 接球后立即投篮
            setTimeout(() => {
                this.aiShoot(bestTarget, gameState);
            }, 500);
        }
    }
    
    aiPostUp(player, gameState) {
        // 低位单打（通常是内线球员）
        if (player.role !== 'C' && player.role !== 'PF') {
            // 如果不是内线球员，改为其他行动
            this.aiPass(player, gameState.awayTeam, gameState);
            return;
        }
        
        // 移动到低位位置
        const postPosition = {
            x: 150,
            y: gameState.canvas.height / 2
        };
        
        const dx = postPosition.x - player.x;
        const dy = postPosition.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 30) {
            // 移动到低位
            player.vx += (dx / distance) * 1.5;
            player.vy += (dy / distance) * 1.5;
        } else {
            // 在低位，尝试得分
            const postMove = Math.random();
            
            if (postMove < 0.4) {
                // 勾手投篮
                this.aiShoot(player, gameState);
            } else if (postMove < 0.7) {
                // 转身跳投
                this.aiShoot(player, gameState);
            } else {
                // 传球出去
                this.aiPass(player, gameState.awayTeam, gameState);
            }
        }
    }
    
    aiTurnover(player, gameState) {
        // AI失误
        player.hasBall = false;
        gameState.ball.holder = null;
        gameState.ball.inAir = false;
        
        // 转换球权
        gameState.possession = 'home';
        gameState.shotClock = 24;
        
        // 添加事件
        gameState.ui.addEvent(`${player.name} 失误！球权转换`);
        
        // 重置篮球位置
        setTimeout(() => {
            gameState.ball.holder = gameState.homeTeam.players[0];
            gameState.ball.x = gameState.homeTeam.players[0].x;
            gameState.ball.y = gameState.homeTeam.players[0].y;
        }, 1000);
    }
    
    runDefensiveLogic(gameState) {
        // AI球队防守逻辑
        const aiPlayers = gameState.awayTeam.players;
        const userPlayers = gameState.homeTeam.players;
        const ballHandler = this.getBallHandler(userPlayers);
        
        aiPlayers.forEach(defender => {
            // 寻找防守目标
            let target = this.findDefensiveTarget(defender, userPlayers, ballHandler);
            
            if (target) {
                // 移动到防守位置
                const dx = target.x - defender.x;
                const dy = target.y - defender.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 防守距离取决于防守策略
                const defensiveDistance = ballHandler === target ? 80 : 120;
                
                if (distance > defensiveDistance) {
                    // 靠近防守目标
                    defender.vx += (dx / distance) * 1.2 * this.settings.defenseReaction;
                    defender.vy += (dy / distance) * 1.2 * this.settings.defenseReaction;
                } else if (distance < defensiveDistance - 20) {
                    // 后退一点，避免太近
                    defender.vx -= (dx / distance) * 0.5;
                    defender.vy -= (dy / distance) * 0.5;
                }
                
                // 尝试抢断（如果防守持球者）
                if (ballHandler === target && distance < 100 && Math.random() < 0.01 * this.settings.aggression) {
                    this.attemptSteal(defender, ballHandler, gameState);
                }
                
                // 尝试盖帽（如果对方投篮）
                if (gameState.ball.inAir && distance < 120 && Math.random() < 0.005 * this.settings.defenseReaction) {
                    this.attemptBlock(defender, gameState);
                }
            }
        });
    }
    
    findDefensiveTarget(defender, userPlayers, ballHandler) {
        // 简单的人盯人防守：每个防守球员防守最近的进攻球员
        let closestPlayer = null;
        let closestDistance = Infinity;
        
        userPlayers.forEach(offender => {
            const dx = offender.x - defender.x;
            const dy = offender.y - defender.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = offender;
            }
        });
        
        // 如果持球者很近，优先防守持球者
        if (ballHandler) {
            const dx = ballHandler.x - defender.x;
            const dy = ballHandler.y - defender.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 200) {
                return ballHandler;
            }
        }
        
        return closestPlayer;
    }
    
    attemptSteal(defender, ballHandler, gameState) {
        // 抢断尝试
        const stealChance = (defender.attributes.defense / 100) * 0.3 * this.settings.aggression;
        
        if (Math.random() < stealChance) {
            // 抢断成功
            ballHandler.hasBall = false;
            defender.hasBall = true;
            gameState.ball.holder = defender;
            gameState.possession = 'away';
            gameState.shotClock = 24;
            
            gameState.ui.addEvent(`${defender.name} 抢断！`);
        }
    }
    
    attemptBlock(defender, gameState) {
        // 盖帽尝试
        const blockChance = (defender.attributes.defense / 100) * 0.2 * this.settings.defenseReaction;
        
        if (Math.random() < blockChance && gameState.ball.z < 100) {
            // 盖帽成功
            gameState.ball.vx = -gameState.ball.vx * 0.5;
            gameState.ball.vy = -gameState.ball.vy * 0.5;
            gameState.ball.vz = 30;
            
            gameState.ui.addEvent(`${defender.name} 盖帽！`);
        }
    }
    
    calculateDefensePressure(player, gameState) {
        // 计算球员面临的防守压力
        let pressure = 0;
        const defenders = player.team === 'home' ? gameState.awayTeam.players : gameState.homeTeam.players;
        
        defenders.forEach(defender => {
            const dx = defender.x - player.x;
            const dy = defender.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 150) {
                pressure += (150 - distance) * defender.attributes.defense / 150;
            }
        });
        
        return Math.min(100, pressure);
    }
    
    calculateBlockChance(player, gameState) {
        // 计算被盖帽的几率
        let blockChance = 0;
        const defenders = player.team === 'home' ? gameState.awayTeam.players : gameState.homeTeam.players;
        
        defenders.forEach(defender => {
            const dx = defender.x - player.x;
            const dy = defender.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
                blockChance += defender.attributes.defense / 500;
            }
        });
        
        return Math.min(0.5, blockChance);
    }
    
    getBallHandler(team) {
        // 获取持球球员
        return team.players.find(player => player.hasBall);
    }
    
    findOpenPlayer(team, gameState) {
        // 寻找空位球员
        const players = team.players;
        
        // 按开放程度排序
        const openPlayers = players.map(player => {
            const openness = 100 - this.calculateDefensePressure(player, gameState);
            return {
                player: player,
                openness: openness
            };
        }).sort((a, b) => b.openness - a.openness);
        
        return openPlayers.length > 0 ? openPlayers[0].player : players[0];
    }
    
    // 战术执行方法
    executeIsolation(team, gameState) {
        // 单打战术
        const isolationPlayer = team.players.reduce((best, current) => {
            return (current.attributes.shooting + current.attributes.dribbling) > 
                   (best.attributes.shooting + best.attributes.dribbling) ? current : best;
        });
        
        // 清空一侧让该球员单打
        this.aiState.currentAction = 'isolation';
        this.aiState.targetPlayer = isolationPlayer;
        
        // 其他球员拉开空间
        team.players.forEach(player => {
            if (player !== isolationPlayer) {
                // 移动到三分线外
                const angle = Math.random() * Math.PI * 2;
                player.targetX = isolationPlayer.x + Math.cos(angle) * 200;
                player.targetY = isolationPlayer.y + Math.sin(angle) * 200;
            }
        });
        
        // 单打球员尝试得分
        this.aiDrive(isolationPlayer, gameState);
    }
    
    executePickAndRoll(team, gameState) {
        // 挡拆战术
        const ballHandler = this.getBallHandler(team) || team.players[0]; // 控球后卫
        const bigMan = team.players.find(p => p.role === 'C' || p.role === 'PF') || team.players[4];
        
        if (!ballHandler || !bigMan) return;
        
        // 大个子设置掩护
        const screenPosition = {
            x: ballHandler.x + 50,
            y: ballHandler.y
        };
        
        // 大个子移动到掩护位置
        const dx = screenPosition.x - bigMan.x;
        const dy = screenPosition.y - bigMan.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 20) {
            bigMan.vx += (dx / distance) * 2;
            bigMan.vy += (dy / distance) * 2;
        } else {
            // 掩护设置完成，持球者利用掩护
            const driveDirection = Math.random() > 0.5 ? 1 : -1;
            ballHandler.vx += 3 * driveDirection;
            
            // 掩护后大个子顺下或外弹
            if (Math.random() > 0.5) {
                // 顺下到篮下
                bigMan.targetX = 150;
                bigMan.targetY = gameState.canvas.height / 2;
            } else {
                // 外弹到三分线
                bigMan.targetX = ballHandler.x + 100;
                bigMan.targetY = ballHandler.y;
            }
        }
    }
    
    executeFastBreak(team, gameState) {
        // 快攻战术
        const fastestPlayers = team.players
            .sort((a, b) => b.attributes.speed - a.attributes.speed)
            .slice(0, 3);
        
        // 快速向前场推进
        fastestPlayers.forEach(player => {
            player.vx += 4;
            
            // 分散跑位
            if (player !== fastestPlayers[0]) {
                player.vy += (Math.random() - 0.5) * 2;
            }
        });
        
        // 如果有球，快速传球推进
        const ballHandler = this.getBallHandler(team);
        if (ballHandler) {
            // 长传给跑在最前面的球员
            const leadRunner = fastestPlayers[0];
            if (leadRunner !== ballHandler && Math.random() < 0.5) {
                this.aiPass(ballHandler, team, gameState);
            }
        }
    }
    
    executeThreePoint(team, gameState) {
        // 三分战术
        const shooters = team.players
            .filter(p => p.attributes.threePoint > 75)
            .sort((a, b) => b.attributes.threePoint - a.attributes.threePoint);
        
        if (shooters.length === 0) return;
        
        const primaryShooter = shooters[0];
        const ballHandler = this.getBallHandler(team);
        
        if (ballHandler && ballHandler !== primaryShooter) {
            // 传球给射手
            this.aiPass(ballHandler, team, gameState);
            
            // 射手移动到三分线
            const threePointX = 300;
            const threePointY = gameState.canvas.height / 2 + (Math.random() - 0.5) * 100;
            
            primaryShooter.targetX = threePointX;
            primaryShooter.targetY = threePointY;
            
            // 接球后投篮
            setTimeout(() => {
                if (primaryShooter.hasBall) {
                    this.aiShootThree(primaryShooter, gameState);
                }
            }, 800);
        }
    }
    
    executePostUp(team, gameState) {
        // 低位战术
        const postPlayers = team.players.filter(p => p.role === 'C' || p.role === 'PF');
        
        if (postPlayers.length === 0) return;
        
        const postPlayer = postPlayers[0];
        const ballHandler = this.getBallHandler(team);
        
        if (ballHandler && ballHandler !== postPlayer) {
            // 传球给内线球员
            this.aiPass(ballHandler, team, gameState);
            
            // 内线球员要位
            postPlayer.targetX = 150;
            postPlayer.targetY = gameState.canvas.height / 2;
            
            // 接球后低位单打
            setTimeout(() => {
                if (postPlayer.hasBall) {
                    this.aiPostUp(postPlayer, gameState);
                }
            }, 1000);
        }
    }
    
    executeManToMan(team, gameState) {
        // 人盯人防守已在runDefensiveLogic中实现
        this.aiState.defensiveStrategy = 'manToMan';
    }
    
    executeZoneDefense(team, gameState) {
        // 区域联防
        this.aiState.defensiveStrategy = 'zoneDefense';
        
        // 设置区域位置（2-3联防）
        const zones = [
            { x: 300, y: 200, player: null }, // 上线左侧
            { x: 300, y: 400, player: null }, // 上线右侧
            { x: 150, y: 250, player: null }, // 下线左侧
            { x: 150, y: 350, player: null }, // 下线中间
            { x: 150, y: 450, player: null }  // 下线右侧
        ];
        
        // 分配球员到区域
        team.players.forEach((player, index) => {
            if (index < zones.length) {
                player.targetX = zones[index].x;
                player.targetY = zones[index].y;
                zones[index].player = player;
            }
        });
    }
    
    executeFullCourtPress(team, gameState) {
        // 全场紧逼
        this.aiState.defensiveStrategy = 'fullCourtPress';
        
        // 每个防守球员紧逼对位球员
        team.players.forEach(player => {
            player.vx += 1; // 向前场施压
        });
    }
    
    executeDoubleTeam(team, gameState) {
        // 双人包夹
        const userTeam = gameState.homeTeam;
        const ballHandler = this.getBallHandler(userTeam);
        
        if (!ballHandler) return;
        
        // 找到离持球者最近的两个防守球员
        const closestDefenders = team.players
            .map(player => {
                const dx = player.x - ballHandler.x;
                const dy = player.y - ballHandler.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return { player, distance };
            })
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 2);
        
        // 包夹持球者
        closestDefenders.forEach(({ player }) => {
            const dx = ballHandler.x - player.x;
            const dy = ballHandler.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 50) {
                player.vx += (dx / distance) * 2;
                player.vy += (dy / distance) * 2;
            }
        });
    }
    
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        this.settings = this.difficultySettings[difficulty] || this.difficultySettings.pro;
        console.log(`AI难度已设置为: ${difficulty}`);
    }
    
    getCurrentStrategy() {
        return {
            offensive: this.aiState.strategy,
            defensive: this.aiState.defensiveStrategy,
            difficulty: this.difficulty
        };
    }
}
