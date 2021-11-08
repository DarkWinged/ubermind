var upgrade = {
    init: function(drones_desired, room_id, job_id, target_room){
        let task_id = `upgrade:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_build_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'upgrade',
            origin_room:room_id,
            target_room:target_room,
            allowed_parts:['MOVE','WORK','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        return new_build_task;
    },

    preform: function(task){
        //console.log(`task ${task.task_id} is being preformed`);
        let missing_drones = task.drones_desired - task.drones.length;
        let creep;

        task.drones.forEach(drone => {
            if(drone){
                creep = Game.creeps[drone];
                if(creep){
                    //console.log(`drone ${creep.name} is working on ${task.task_id}`)
                    this.work(creep, task.origin_room);
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

    work: function(drone, room_id){
        //console.log(drone.store.getFreeCapacity(),drone.name);

        if(Memory.creeps[drone.name].loaded){
            this.upgradeController(drone);
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

    upgradeController: function(drone){
        let parts = drone.getActiveBodyparts(WORK);
        let target = drone.room.controller;
        switch(drone.upgradeController(target)) {
            case ERR_NOT_IN_RANGE:
                drone.moveTo(target, {visualizePathStyle: {stroke: '#33f6ff'}});
                break;
            case 0:
                Memory.creeps[drone.name].fitness_score += parts * 2;
                break;
        }
    }
};

module.exports = upgrade;