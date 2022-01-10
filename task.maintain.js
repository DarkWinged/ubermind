let Task = require('task');
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
            this.maintain(drone);
        }
    },
    
    maintain: function(drone){
        let targets = Memory.creeps[drone.name].targets_maintain_list;
        let invalid_structures = [STRUCTURE_WALL, STRUCTURE_RAMPART];

        if(!targets || targets.length == 0){    
            targets = drone.room.find(FIND_STRUCTURES, {
                filter: function(structure) {
                    return (!invalid_structures.includes(structure.structureType) && structure.hits < structure.hitsMax);
                }
            });
            targets = targets.map((t) => t.id);
        }

        if(targets.length > 0){
            let target = Game.getObjectById(Memory.creeps[drone.name].target_maintain);

            if(!target || target.hits == target.hitsMax){
                targets = targets.filter(t => Game.getObjectById(t).hits != Game.getObjectById(t).hitsMax);
                targets = targets.sort(
                    (a, b) =>
                    ((Game.getObjectById(a).hits / Game.getObjectById(a).hitsMax) >
                    (Game.getObjectById(b).hits / Game.getObjectById(b).hitsMax)) ?
                    1 : -1
                );
                target = Game.getObjectById(targets[0]);
            }

            if(target){
                Memory.creeps[drone.name].target_maintain = target.id
                let fitness = drone.getActiveBodyparts(WORK) * 1;
                switch(drone.repair(target)) {
                    case ERR_NOT_IN_RANGE:
                        drone.moveTo(target, {visualizePathStyle: {stroke: '#afff33'}});
                        target = drone.pos.findClosestByRange(FIND_STRUCTURES,  {
                            filter: function(structure) {
                                return(!invalid_structures.includes(structure.structureType) && structure.hits < structure.hitsMax);
                            }
                        });
                        
                        if(drone.repair(target) == 0)
                            Memory.creeps[drone.name].fitness_score += fitness * Memory.abathur.fitness_scaler;
                        break;
                    case 0:
                        drone.moveTo(target, {visualizePathStyle: {stroke: '#afff33'}});
                        Memory.creeps[drone.name].fitness_score += fitness * Memory.abathur.fitness_scaler;
                        break;
                }
            }
            Memory.creeps[drone.name].targets_maintain_list = targets;
        }
    }
};

module.exports = maintain;