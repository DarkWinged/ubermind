const Task = require('task');
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

    work: function(drone, room_id, target){
        //console.log(drone.store.getFreeCapacity());
        let target_drone = Game.creeps[target];
        if(Memory.creeps[drone.name].loaded){
            //console.log(`builder(${drone.name}) is working on ${target}`);
            this.dropoffResources(drone, room_id);
            if(drone.store.getUsedCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = false;
        }
        else{
            if(target_drone != null)
                this.pickupResources(drone, target_drone);
            if(drone.store.getFreeCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = true;
        }
    },

    pickupResources: function(drone, target){
        let target_drops;
        //console.log(`${drone} is working on ${target}`);
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
            let valid_container = Task.findDepot(drone.pos);

            if(valid_container){
                let used_capacity = drone.store.getUsedCapacity(RESOURCE_ENERGY);
                let store_free_space = valid_container.store.getFreeCapacity(RESOURCE_ENERGY);
                switch(drone.transfer(valid_container, RESOURCE_ENERGY)){
                    case ERR_NOT_IN_RANGE:
                        drone.moveTo(valid_container);
                        break;
                    case 0:
                        let difference = used_capacity - store_free_space;
                        //console.log(difference, used_capacity, store_free_space);
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

};

module.exports = deposit;