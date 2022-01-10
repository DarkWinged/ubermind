let Task = require('task');
const mine = {
    init: function(drones_desired, room_id, job_id, target_pos){
        let task_id = `mine:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_mine_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'mine',
            target_pos:target_pos,
            origin_room:room_id,
            allowed_parts:['MOVE','WORK','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        return new_mine_task;
    },

    work: function(drone, room_id, target, task_id){
        //console.log(`drone(${drone.name}) is mining form ${source}`);
        if(drone.pos.roomName != target.roomName){
            target = Game.flags[task_id];
            drone.moveTo(target, {visualizePathStyle: {stroke: '#ffff33'}});
        } else {
            if(48 < drone.pos.x < 2 || 48 < drone.pos.y < 2){
                drone.moveTo({x:25,y:25,roomName:drone.pos.roomName}, {visualizePathStyle: {stroke: '#ffff33'}});
            }
            this.harvestEnergy(drone, target);
        }
    },

    harvestEnergy: function(drone, target){
        let creep = Memory.creeps[drone.name];
        let source = Game.getObjectById(creep.target_mine);

        if(!source){
            source = Game.rooms[target.roomName].lookForAt(LOOK_SOURCES, target.x, target.y)[0];
        }

        if(source){
            Memory.creeps[drone.name].target_mine = source.id;
            if(drone.store.getFreeCapacity(RESOURCE_ENERGY) >= 1){
                creep.loaded = false;
                this.extract(drone, creep, source, this.calculateFitness(drone, drone.getActiveBodyparts(WORK)));
            }
            else{
                creep.loaded = true;
                let container = Game.getObjectById(Memory.creeps[drone.name].target_mine_container);
                if(!container){
                    container = Game.rooms[target.roomName].lookForAt(LOOK_STRUCTURES, drone.pos);
                    container = _.filter(container, function(structure){
                        return (structure.structureType == STRUCTURE_CONTAINER);
                    })[0];
                }
                if(container){
                    Memory.creeps[drone.name].target_mine_container = container.id;
                    //console.log(`container: ${container.pos},${container.store.getUsedCapacity(RESOURCE_ENERGY)}`);
                    this.extract(drone, creep, source, drone.getActiveBodyparts(WORK)*2);
                }
            }
        }
    },

    extract: function(drone, creep, source, fitness){
        switch(drone.harvest(source)){
            case ERR_NOT_IN_RANGE:
                drone.moveTo(source, {visualizePathStyle: {stroke: '#ffff33'}});
                break;
            case 0:
                creep.fitness_score += Math.floor(fitness*Memory.abathur.fitness_scaler);
                break;
        }
    },

    calculateFitness: function(drone, parts){
        if(drone.store.getFreeCapacity(RESOURCE_ENERGY) >= parts * 2){
            return parts * 2;
        } else {
            return drone.store.getFreeCapacity(RESOURCE_ENERGY);
        }
    }

};
module.exports = mine;