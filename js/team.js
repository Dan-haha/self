// 球队类
class Team {
    constructor(config, side) {
        this.id = config.id;
        this.name = config.name;
        this.logo = config.logo;
        this.color1 = config.color1;
        this.color2 = config.color2;
        this.rating = config.rating;
        this.side = side; // 'home' 或 'away'
        
        this.players = [];
        this.bench = [];
        this.coach = null;
        
        this.stats = {
            points: 0,
            fieldGoalsMade: 0,
            fieldGoalsAttempted: 0,
            threePointsMade: 0,
            threePointsAttempted: 0,
            freeThrowsMade: 0,
            freeThrowsAttempted: 0,
            rebounds: 0,
            offensiveRebounds: 0,
            defensiveRebounds: 0,
            assists: 0,
            steals: 0,
            blocks: 0,
            turnovers: 0,
            fouls: 0,
            timeouts: 7,
            quarterFouls: [0, 0, 0, 0] // 每节犯规数
        };
        
        this.strategy = {
            offense: 'balanced', // 'fastBreak', 'inside', 'outside', 'balanced'
            defense: 'manToMan', // 'manToMan', 'zone2-3', 'zone3-2', 'press'
            pace: 50, // 0-100
            focusOn: 'balanced' // 'inside', 'outside', 'balanced'
        };
        
        this.playbook = [];
        this.currentPlay = null;
    }
    
    addPlayer(player) {
        this.players.push(player);
    }
    
    removePlayer(player) {
        const index = this.players.indexOf(player);
        if (index > -1) {
            this.players.splice(index, 1);
        }
    }
    
    substitute(playerOut, playerIn) {
        // 确保球员在场上或板凳上
        if (this.players.includes(playerOut) && this.bench.includes(playerIn)) {
            this.removePlayer(playerOut);
            this.addPlayer(playerIn);
            
            this.bench.push(playerOut);
            const benchIndex = this.bench.indexOf(playerIn);
            this.bench.splice(benchIndex, 1);
            
            console.log(`${playerOut.name} 下场，${playerIn.name} 上场`);
        }
    }
    
    updateStats(stat, value = 1) {
        if (this.stats.hasOwnProperty(stat)) {
            this.stats[stat] += value;
        }
    }
    
    getFieldGoalPercentage() {
        if (this.stats.fieldGoalsAttempted === 0) return 0;
        return (this.stats.fieldGoalsMade / this.stats.fieldGoalsAttempted) * 100;
    }
    
    getThreePointPercentage() {
        if (this.stats.threePointsAttempted === 0) return 0;
        return (this.stats.threePointsMade / this.stats.threePointsAttempted) * 100;
    }
    
    getFreeThrowPercentage() {
        if (this.stats.freeThrowsAttempted === 0) return 0;
        return (this.stats.freeThrowsMade / this.stats.freeThrowsAttempted) * 100;
    }
    
    getRebounds() {
        return this.stats.rebounds;
    }
    
    getAssists() {
        return this.stats.assists;
    }
    
    getTurnovers() {
        return this.stats.turnovers;
    }
    
    getFouls() {
        return this.stats.fouls;
    }
    
    getQuarterFouls(quarter) {
        if (quarter >= 1 && quarter <= 4) {
            return this.stats.quarterFouls[quarter - 1];
        }
        return 0;
    }
    
    addFoul(quarter) {
        this.stats.fouls++;
        if (quarter >= 1 && quarter <= 4) {
            this.stats.quarterFouls[quarter - 1]++;
        }
    }
    
    resetQuarterFouls() {
        this.stats.quarterFouls = [0, 0, 0, 0];
    }
    
    callTimeout() {
        if (this.stats.timeouts > 0) {
            this.stats.timeouts--;
            return true;
        }
        return false;
    }
    
    setStrategy(offense, defense, pace, focusOn) {
        this.strategy.offense = offense;
        this.strategy.defense = defense;
        this.strategy.pace = pace;
        this.strategy.focusOn = focusOn;
    }
    
    getPlayerByPosition(position) {
        return this.players.find(player => player.role === position);
    }
    
    getPlayerByNumber(number) {
        return this.players.find(player => player.number === number);
    }
    
    getStartingLineup() {
        return this.players.slice(0, 5);
    }
    
    getBenchPlayers() {
        return this.bench;
    }
    
    getBestShooter() {
        let bestPlayer = this.players[0];
        let bestRating = 0;
        
        this.players.forEach(player => {
            const rating = player.attributes.shooting + player.attributes.threePoint;
            if (rating > bestRating) {
                bestRating = rating;
                bestPlayer = player;
            }
        });
        
        return bestPlayer;
    }
    
    getBestDefender() {
        let bestPlayer = this.players[0];
        let bestRating = 0;
        
        this.players.forEach(player => {
            const rating = player.attributes.defense;
            if (rating > bestRating) {
                bestRating = rating;
                bestPlayer = player;
            }
        });
        
        return bestPlayer;
    }
    
    getBestRebounder() {
        let bestPlayer = this.players[0];
        let bestRating = 0;
        
        this.players.forEach(player => {
            // 假设身高和防守属性影响篮板能力
            const rating = player.attributes.defense;
            if (rating > bestRating) {
                bestRating = rating;
                bestPlayer = player;
            }
        });
        
        return bestPlayer;
    }
}
