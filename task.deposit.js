var deposit = {
    init: function(drones_desired, room_id, job_id){
        let task_id = `deposit:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_deposit_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'deposit',
            origin_room:room_id,
            allowed_parts:['MOVE','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        return new_deposit_task;
    },

    preform: function(task, target){
        //console.log(`task ${task.task_id} is being preformed`);
        let target_creep = Game.creeps[target];
        let missing_drones = task.drones_desired - task.drones.length;
        let creep;

        task.drones.forEach(drone => {
            if(drone){
                creep = Game.creeps[drone];
                if(creep){
                    //console.log(`drone ${creep.name} is working on ${task.task_id}`)
                    this.work(creep, target_creep, task.origin_room);
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
        //console.log(drone.store.getFreeCapacity());
        if(target != null && drone.store.getFreeCapacity() > 0){
            this.pickupResources(drone, target);
        } else {
            this.dropoffResources(drone, room_id);
        }
    },

    outsourceWork: function(drone_name, target_name, room_id){
        let drone = Game.creeps[drone_name];
        let target = Game.creeps[target_name];

        if(target != null && drone.store.getFreeCapacity() > 0){
            if(target.name != drone.name)
                this.pickupResources(drone, target);
        } else {
            this.dropoffResources(drone, room_id);
        }
    },

    pickupResources: function(drone,target){
        let target_drops;
        //console.log(`${drone} is working on ${target.transfer(drone, RESOURCE_ENERGY)}`);
        switch(target.transfer(drone, RESOURCE_ENERGY)) {
            case ERR_NOT_IN_RANGE: 
                drone.moveTo(target);
                break;
            case ERR_NOT_ENOUGH_RESOURCES: 
                target_drops = target.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
                if(target_drops) {
                    if(drone.pickup(target_drops) == ERR_NOT_IN_RANGE) {
                        drone.moveTo(target_drops);
                    }
                }
                break;
            case ERR_INVALID_TARGET: 
                target_drops = target.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
                if(target_drops) {
                    if(drone.pickup(target_drops) == ERR_NOT_IN_RANGE) {
                        drone.moveTo(target_drops);
                    }
                }
                break;
        }
    },

    dropoffResources: function(drone, room_id){
        if (drone.pos.roomName != room_id) {
            drone.moveTo({x:20,y:20,roomName:room_id});
        } else {       
            let valid_container = this.findStorage(drone.pos);

            if(valid_container){
                let used_capacity = drone.store.getUsedCapacity(RESOURCE_ENERGY);
                let store_free_space = valid_container.store.getFreeCapacity(RESOURCE_ENERGY);
                switch(drone.transfer(valid_container, RESOURCE_ENERGY)){
                    case ERR_NOT_IN_RANGE:
                        drone.moveTo(valid_container);
                        break;
                    case 0:
                        let difference = used_capacity - store_free_space;
                        console.log(difference, used_capacity, store_free_space);
                        if(difference > 0){
                            Memory.creeps[drone.name].fitness_score += used_capacity - difference;
                        }
                        else
                            Memory.creeps[drone.name].fitness_score += used_capacity;
                        break;
                }
            }
        }
    }, 

    findStorage: function(position){ 
        const valid_structures = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION];           
        let found;
        
        found = position.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: function(structure) {
                return (structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) != 0);
            }
        });

        if(!found){
            found = position.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: function(structure) {
                    return (valid_structures.includes(structure.structureType) && structure.store.getFreeCapacity(RESOURCE_ENERGY) != 0);
                }
            });
        }

        return found;
    },

};

module.exports = deposit;