let Task = require('task');
const prospect = {
    init: function(drones_desired, room_id, job_id, target_pos){
        let task_id = `prospect:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_prospect_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'prospect',
            target_pos:target_pos,
            origin_room:room_id,
            allowed_parts:['TOUGH','MOVE','WORK','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        Game.rooms[room_id].createFlag(25,25,task_id);
        return new_prospect_task;
    },

    work: function(drone, room_id, target, task_id){
        if(Game.flags[task_id].pos.x != target.x || Game.flags[task_id].pos.y != target.y || Game.flags[task_id].pos.roomName != target.roomName){
            console.log(`flag position (${Game.flags[task_id].pos.x},${Game.flags[task_id].pos.y},${Game.flags[task_id].pos.roomName}) is not at target (${target.x},${target.y},${target.roomName})`);
            Game.flags[task_id].setPosition(new RoomPosition(target.x, target.y, target.roomName))
        }
        let source
        //console.log(`drone(${drone.name}) is mining form ${source}`);
        let parts = drone.getActiveBodyparts(WORK);
        let fitness;
        if(drone.pos.roomName != target.roomName){
            target = Game.flags[task_id];
            drone.moveTo(target, {visualizePathStyle: {stroke: '#ffff33'}});
        } else {
            source = Game.rooms[target.roomName].lookForAt(LOOK_SOURCES, target.x, target.y)[0];
            if(48 < drone.pos.x < 2 || 48 < drone.pos.y < 2)
                drone.moveTo({x:20,y:20,roomName:drone.pos.roomName}, {visualizePathStyle: {stroke: '#ffff33'}});
            if(drone.store.getFreeCapacity(RESOURCE_ENERGY) >= parts * 2){
                fitness = parts * 2;
            } else {
                fitness = drone.store.getFreeCapacity(RESOURCE_ENERGY);
            }
            if(drone.store.getFreeCapacity(RESOURCE_ENERGY) >= 1){
                switch(drone.harvest(source)){
                    case ERR_NOT_IN_RANGE:
                        drone.moveTo(source, {visualizePathStyle: {stroke: '#ffff33'}});
                        break;
                    case 0:
                        Memory.creeps[drone.name].fitness_score += Math.floor(fitness*Memory.abathur.fitness_scaler);
                        break;
                }
            }
        }   
    }

};
module.exports = prospect;