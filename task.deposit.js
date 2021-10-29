var deposit = {
    init: function(drones_desired, room_id, job_id){
        let task_id = `deposit:${Game.time%1000}`;
        let drones = [];
        drones.length = drones_desired;
        let new_deposit_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'deposit',
            origin_room:room_id,
            allowed_parts:['MOVE','CARRY'],
            drones:drones,
            queued_drones:0
        };
        return new_deposit_task;
    },

    preform: function(task, target){
        console.log(`task ${task.task_id} is being preformed`);
        let target_creep = Game.creeps[target];
        let missing_drones = 0;

        task.drones.forEach(drone => {
            let creep;
            if(drone){
                creep = Game.creeps[drone];
                if(creep && target_creep)
                    this.work(creep, target_creep, task.origin_room);
                //else
                   // missing_drones += 1;
            }
            else
                missing_drones += 1;
        });

        task.queued_drones += this.requestDrones(task.origin_room,task.job_id,task.task_id, task.allowed_parts, missing_drones-task.queued_drones);
    },

    requestDrones: function(origin_room, job_id, task_id, allowed_parts, count){
        let path = {hive:origin_room,job:job_id,task:task_id};
        let queued = 0;
        while(count > 0){
            queued += require('abathur').speciesSpawn(path,allowed_parts);
            count -= 1;
        }
        return queued;
    },

    work: function(drone, target, room_id){
        console.log(drone.store.getFreeCapacity());
        if(drone.store.getFreeCapacity() > 0){
            this.pickupResources(drone, target);
        } else {
            this.dropoffResources(drone, room_id);
        }
    },

    pickupResources: function(drone,target){
        let target_drops;
        console.log(`${drone} is working on ${target.transfer(drone, RESOURCE_ENERGY)}`);
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
            let valid_structures = [STRUCTURE_STORAGE,STRUCTURE_SPAWN,STRUCTURE_EXTENSION];
            let valid_container = Game.rooms[room_id].find(FIND_MY_STRUCTURES);
            valid_container = valid_container.filter( (structure) => {
                return (valid_structures.includes(structure.structureType) && structure.store.getFreeCapacity(RESOURCE_ENERGY) != 0)
            });
            /*let valid_container = drone.pos.findInRange(FIND_MY_STRUCTURES, 5, {
                filter: (structure) => {return structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION}
            });*/
            console.log(valid_container);
            valid_container = drone.pos.findClosestByRange(valid_container);
            switch(drone.transfer(valid_container, RESOURCE_ENERGY)){
                case ERR_NOT_IN_RANGE:
                    drone.moveTo(valid_container);
                    break;
            }
        }
    }

/*
let Job = Memory.jobs[Job_ID];
        let origin = Game.flags[Job.Source_ID];
        let creep, source, valid_container, parts;
        for(let drone in Job.Assigned_ID){
            creep = Game.creeps[Job.Assigned_ID[drone]];

            if(creep != null){
                source = Game.getObjectById(Job.Target_ID);
                if(creep.room != origin.room){
                    creep.moveTo(origin, {visualizePathStyle: {stroke: '#ffff33'}});
                } else {
                    valid_container = creep.pos.findInRange(FIND_STRUCTURES, 0, {
                        filter: (structure) => {return (structure.structureType == STRUCTURE_CONTAINER);}
                    });
                    valid_container = creep.pos.findClosestByRange(valid_container);
                    if (creep.store.getFreeCapacity() > 0
                        || (valid_container != null && valid_container.store.getFreeCapacity() > 0))
                    {
                        switch(creep.harvest(source)){
                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(source, {visualizePathStyle: {stroke: '#ffff33'}});
                            break;
                        case 0:
                            parts = creep.getActiveBodyparts(WORK);
                            Memory.drones[creep.name].Fitness_Score[Job_ID] += parts * 2;
                            break;
                        }
                    }
                }
            }
        }
*/
};

module.exports = deposit;