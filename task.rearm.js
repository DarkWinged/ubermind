let Task = require('task');
const rearm = {
    init: function(drones_desired, room_id, job_id, target_storage){
        let task_id = `rearm:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'rearm',
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
        //console.log(`${drone} is working on ${target}`);
        if(target_storage){
            switch(drone.withdraw(target_storage, RESOURCE_ENERGY)) {
                case ERR_NOT_IN_RANGE:
                    drone.moveTo(target_storage, {visualizePathStyle: {stroke: '#ffff33'}});
                    break;
            }
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
        let valid_container = Game.getObjectById(Memory.creeps[drone.name].target)

        if(!valid_container || valid_container.store.getFreeCapacity(RESOURCE_ENERGY) <= 10){
            valid_container = Task.findStructures(drone.pos, [STRUCTURE_TOWER], false);
            valid_container = valid_container.sort((a,b) => (a.store.getFreeCapacity(RESOURCE_ENERGY) < b.store.getFreeCapacity(RESOURCE_ENERGY)))[0];
        }
        
        if(valid_container){
            Memory.creeps[drone.name].target = valid_container.id
            let used_capacity = drone.store.getUsedCapacity(RESOURCE_ENERGY);
            let store_free_space = valid_container.store.getFreeCapacity(RESOURCE_ENERGY);
            switch(drone.transfer(valid_container, RESOURCE_ENERGY)){
                case ERR_NOT_IN_RANGE:
                    drone.moveTo(valid_container);
                    break;
                case 0:
                    let difference = used_capacity - store_free_space;
                    if(difference > 0){
                        Memory.creeps[drone.name].fitness_score += (used_capacity - difference)*Memory.abathur.fitness_scaler;
                    }
                    else
                        Memory.creeps[drone.name].fitness_score += used_capacity*Memory.abathur.fitness_scaler;
                    break;
            }
        }
    }

};

module.exports = rearm;