var tower = {
    init: function(tower_id){
        let new_name = `tower:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_tower = {
            name: new_name,
            structure_id:tower_id,
        };
        return new_tower;
    },

    operate: function(tower_id){
        let tower = Game.getObjectById(Memory.towers[tower_id].structure_id);
        if(tower){
            this.targetHostiles(tower);
            if(tower.store.getUsedCapacity(RESOURCE_ENERGY) > 750)
                this.repairWalls(tower);
        }
    },
    
    targetHostiles: function(tower){
        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile != null && closestHostile != undefined) {
            tower.attack(closestHostile);
        } 
    },

    repairWalls: function(tower){
        const permitted_structures = [STRUCTURE_WALL,STRUCTURE_RAMPART]
        let walls = [];
    
        walls = tower.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return permitted_structures.includes(structure.structureType) && structure.hits < structure.hitsMax;
            }
        });

        if(walls.length > 0) {
            if(walls.length >= 1){
                walls = walls.sort((a,b) => (a.hits > b.hits) ? 1 : -1);
            }
            tower.repair(walls[0]);
        }
    },
};

module.exports = tower;
