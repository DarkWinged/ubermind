let Task = require('task');
const deposit = {
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
        //console.log(drone.name);
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
        if(target.store.getUsedCapacity(RESOURCE_ENERGY) > 10){
            switch(target.transfer(drone, RESOURCE_ENERGY)) {
                case ERR_NOT_IN_RANGE: 
                drone.moveTo(target, {visualizePathStyle: {stroke: '#ffff33'}});
                break;
            }
        }
        else {
            target_drops = Game.rooms[target.pos.roomName].lookForAt(LOOK_STRUCTURES, target.pos);
            target_drops = _.filter(target_drops, function(structure){
                return (structure.structureType == STRUCTURE_CONTAINER);
            })[0];
            if(target_drops) {
                //console.log(`target drops: ${target_drops.pos},${target_drops.store.getUsedCapacity(RESOURCE_ENERGY)}`);
                if(drone.withdraw(target_drops, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    drone.moveTo(target_drops);
                }
            }
        }
    },

    dropoffResources: function(drone, room_id){
        if (drone.pos.roomName != room_id) {
            drone.moveTo(Game.rooms[room_id].controller.pos, {visualizePathStyle: {stroke: '#ffff33'}});
        } else {       
            if(48 < drone.pos.x < 2 || 48 < drone.pos.y < 2)
                drone.moveTo({x:20,y:20,roomName:drone.pos.roomName}, {visualizePathStyle: {stroke: '#ffff33'}});
            this.dropOff(drone);
        }
    }, 

    dropOff: function(drone) {
        let target = Game.getObjectById(Memory.creeps[drone.name].target_deposit);

        if(!target || target.store.getFreeCapacity(RESOURCE_ENERGY) == 0)
            target = Task.findDepot(drone.pos);

        if(target){
            Memory.creeps[drone.name].target_deposit = target.id;
            switch(drone.transfer(target, RESOURCE_ENERGY)){
                case ERR_NOT_IN_RANGE:
                    drone.moveTo(target);
                    break;
                case 0:
                    let used_capacity = drone.store.getUsedCapacity(RESOURCE_ENERGY);
                    let difference = used_capacity - target.store.getFreeCapacity(RESOURCE_ENERGY);
                    //console.log(difference, used_capacity, store_free_space);
                    if(difference > 0){
                        Memory.creeps[drone.name].fitness_score += Math.floor(((used_capacity - difference)*2)*Memory.abathur.fitness_scaler);
                    }
                    else
                        Memory.creeps[drone.name].fitness_score += Math.floor((used_capacity*2)*Memory.abathur.fitness_scaler);
                    break;
            }
        }
    }

};

module.exports = deposit;