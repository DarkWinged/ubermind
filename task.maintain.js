var maintain = {
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

    preform: function(task, target){
        //console.log(`task ${task.task_id} is being preformed`);
        let missing_drones = task.drones_desired - task.drones.length;
        let creep;

        task.drones.forEach(drone => {
            if(drone){
                creep = Game.creeps[drone];
                if(creep){
                    //console.log(`drone ${creep.name} is working on ${task.task_id}`)
                    this.work(creep, target, task.origin_room);
                }
            }
        });

        //console.log(`task ${task.task_id} is missing ${missing_drones}`);
        if(missing_drones > 0)
            task.drones_queued += this.requestDrones(task, missing_drones-task.drones_queued);
    },

    requestDrones: function(task, count){
        let path = {hive:task.origin_room, job:task.job_id, task:task.task_id};
        let queued = 0;
        while(count > 0){
            queued += require('abathur').speciesSpawn(path,task.allowed_parts);
            count -= 1;
        }
        return queued;
    },

    work: function(drone, target, room_id){
        if(Memory.creeps[drone.name].loaded){
            this.maintainStructures(drone,target);
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
            let target = this.findStorage(drone.pos);
            
            switch(drone.withdraw(target, RESOURCE_ENERGY)) {
                case ERR_NOT_IN_RANGE: 
                    drone.moveTo(target);
                    break;
            }
        }
    },

    findStorage: function(position){ 
        const valid_structures = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION];           
        let found;
        
        found = position.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: function(structure) {
                return (structure.structureType == STRUCTURE_STORAGE && structure.store.getUsedCapacity(RESOURCE_ENERGY) != 0);
            }
        });
        
        if(!found){
            found = position.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: function(structure) {
                    return (valid_structures.includes(structure.structureType) && structure.store.getUsedCapacity(RESOURCE_ENERGY) != 0);
                }
            });
        }

        return found;
    },

    maintainStructures: function(drone, room_id){
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
                        target = _.filter(drone.pos.findInRange(FIND_MY_STRUCTURES, 3),  {
                            filter: function(structure) {
                                return(!invalid_structures.includes(structure.structureType) && structure.hits < structure.hitsMax);
                            }
                        });
                        if(drone.repair(target) == 0)
                            Memory.creeps[creep.name].fitness_score += parts * 2;
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