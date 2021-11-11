const Task = require('task');
const maintain = {
    init: function(drones_desired, room_id, job_id, target_room){
        let task_id = `maintain:${Game.time%1000}`;
        let new_build_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'maintain',
            origin_room:room_id,
            target_room:target_room,
            allowed_parts:['MOVE','WORK','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        return new_build_task;
    },

    work: function(drone, room_id, target_room){
        //console.log(`drone(${drone.name}) is working on ${target_room} in ${room_id}`);
        if(Memory.creeps[drone.name].loaded){
            this.maintainStructures(drone, target_room);
            if(drone.store.getUsedCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = false;
        }
        else{
            this.pickupResources(drone, room_id);
            if(drone.store.getFreeCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = true;
        }
    },

    pickupResources: function(drone, room_id){
        if (drone.pos.roomName != room_id) {
            drone.moveTo({x:20,y:20,roomName:room_id});
        }
        else {
            let target = Task.findStorage(drone.pos);
            
            switch(drone.withdraw(target, RESOURCE_ENERGY)) {
                case ERR_NOT_IN_RANGE: 
                    drone.moveTo(target);
                    break;
            }
        }
    },

    maintainStructures: function(drone, room_id){
        //console.log(`drone(${drone.name}) is maintain structures in ${room_id}`);
        if (drone.pos.roomName != room_id) {
            drone.moveTo({x:20,y:20,roomName:room_id});
        } else {
            let parts = drone.getActiveBodyparts(WORK);
            let invalid_structures = [STRUCTURE_WALL,STRUCTURE_RAMPART];    
            let targets = [];
            targets = drone.room.find(FIND_STRUCTURES, {
                filter: function(structure) {
                    return (!invalid_structures.includes(structure.structureType) && structure.hits < structure.hitsMax);
                }
            });
            let target;
            if(targets.length > 0){
                targets = targets.sort((a, b) => ((a.hits/a.hitsMax) > (b.hits/b.hitsMax))? 1 : -1);
                target = targets[0];
                switch(drone.repair(target)) {
                    case ERR_NOT_IN_RANGE:
                        drone.moveTo(target, {visualizePathStyle: {stroke: '#afff33'}});
                        target = drone.pos.findClosestByRange(FIND_STRUCTURES,  {
                            filter: function(structure) {
                                return(!invalid_structures.includes(structure.structureType) && structure.hits < structure.hitsMax);
                            }
                        });
                        
                        if(drone.repair(target) == 0)
                            Memory.creeps[drone.name].fitness_score += parts * 2;
                        break;
                    case 0:
                        drone.moveTo(target, {visualizePathStyle: {stroke: '#afff33'}});
                        Memory.creeps[drone.name].fitness_score += parts * 2;
                        break;
                }
            }
        }
    }
};

module.exports = maintain;