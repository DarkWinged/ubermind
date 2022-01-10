let Task = require('task');
const refill = {
    init: function(drones_desired, room_id, job_id, target_storage){
        let task_id = `refill:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'refill',
            origin_room:room_id,
            target_storage:target_storage,
            allowed_parts:['MOVE','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        return new_task;
    },

    work: function(drone, room_id, target){
        //console.log(drone.store.getFreeCapacity());
        let target_storage = Game.getObjectById(target);
        if(Memory.creeps[drone.name].loaded){
            //console.log(`builder(${drone.name}) is working on ${target}`);
            this.dropoffResources(drone, room_id);
            if(drone.store.getUsedCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = false;
        }
        else{
            this.pickupResources(drone, target_storage);
            if(drone.store.getFreeCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = true;
        }
    },

    pickupResources: function(drone, target_storage){
        //console.log(`${drone} is working on ${target_storage}`);
        if(target_storage){
            switch(drone.withdraw(target_storage, RESOURCE_ENERGY)) {
                case ERR_NOT_IN_RANGE: 
                drone.moveTo(target_storage, {visualizePathStyle: {stroke: '#ffff33'}});
                break;
            }
        } else {
            drone.moveTo({x:25,y:25,roomName:drone.pos.roomName}, {visualizePathStyle: {stroke: '#ffff33'}});
        }
    },

    dropoffResources: function(drone, room_id){
        if (drone.pos.roomName != room_id) {
            drone.moveTo(Game.rooms[room_id].controller.pos, {visualizePathStyle: {stroke: '#ffff33'}});
        } else {       
            if(48 < drone.pos.x < 2 || 48 < drone.pos.y < 2)
                drone.moveTo({x:25,y:25,roomName:drone.pos.roomName}, {visualizePathStyle: {stroke: '#ffff33'}});
            this.dropOff(drone);
        }
    }, 

    dropOff: function(drone){
        let target = Game.getObjectById(Memory.creeps[drone.name].target_refill);

        if(!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            target = Task.findStructures(drone.pos, [STRUCTURE_EXTENSION], false);
            target = target.sort((a,b) => (Task.pythagDistance(a.pos, drone.pos) < Task.pythagDistance(b.pos, drone.pos))? -1: 1)[0];
        }
        
        if(!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0){
            target = Task.findStructures(drone.pos, [STRUCTURE_SPAWN], false);
            target = target.sort((a,b) => (Task.pythagDistance(a.pos, drone.pos) < Task.pythagDistance(b.pos, drone.pos))? -1: 1)[0];
        }

        if(target){
            Memory.creeps[drone.name].target_refill = target.id;
            let used_capacity = drone.store.getUsedCapacity(RESOURCE_ENERGY);
            let store_free_space = target.store.getFreeCapacity(RESOURCE_ENERGY);
            switch(drone.transfer(target, RESOURCE_ENERGY)){
                case ERR_NOT_IN_RANGE:
                    drone.moveTo(target, {visualizePathStyle: {stroke: '#ff0000'}});
                    break;
                case 0:
                    let difference = used_capacity - store_free_space;
                    //console.log(difference, used_capacity, store_free_space);
                    if(difference > 0){
                        Memory.creeps[drone.name].fitness_score += (used_capacity - difference)*Memory.abathur.fitness_scaler;
                    }
                    else
                        Memory.creeps[drone.name].fitness_score += used_capacity*Memory.abathur.fitness_scaler;
                    break;
            }
        } 
        else {
            drone.moveTo({x:25,y:25,roomName:drone.pos.roomName}, {visualizePathStyle: {stroke: '#ffff33'}});
        }
    }

};

module.exports = refill;