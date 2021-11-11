const Task = require('task');
const upgrade = {
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

    work: function(drone, room_id, target_room){
        //console.log(drone.store.getFreeCapacity(),drone.name);
        //console.log(`drone(${drone.name}) is working on ${target_room} in ${room_id}`);

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
            let target = Task.findStorage(drone.pos);
            
            switch(drone.withdraw(target, RESOURCE_ENERGY)) {
                case ERR_NOT_IN_RANGE: 
                    drone.moveTo(target);
                    break;
            }
        }
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