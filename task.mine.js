const mine = {
    init: function(drones_desired, room_id, job_id, target_pos){
        let task_id = `mine:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_mine_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'mine',
            target_pos:target_pos,
            origin_room:room_id,
            allowed_parts:['MOVE','WORK','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        return new_mine_task;
    },

    work: function(drone, room_id, target){
        let source = Game.rooms[room_id].lookForAt(LOOK_SOURCES, target.x, target.y)[0];
        //console.log(`drone(${drone.name}) is mining form ${source}`);
        let parts = drone.getActiveBodyparts(WORK);
        let fitness;
        if(drone.store.getFreeCapacity(RESOURCE_ENERGY) >= parts * 2){
            fitness = parts * 2;
        } else {
            fitness = drone.store.getFreeCapacity(RESOURCE_ENERGY);
        }

        switch(drone.harvest(source)){
            case ERR_NOT_IN_RANGE:
                drone.moveTo(source, {visualizePathStyle: {stroke: '#ffff33'}});
                break;
            case 0:
                Memory.creeps[drone.name].fitness_score += fitness;
                break;
        }
    }

};
module.exports = mine;