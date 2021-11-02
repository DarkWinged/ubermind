var mine = {
    init: function(drones_desired, target_pos, job_id, room_id){
        let task_id = `mine:${Game.time%1000}`;
        let drones = [];
        drones.length = drones_desired;
        let new_mine_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'mine',
            target_pos:target_pos,
            origin_room:room_id,
            allowed_parts:['MOVE','WORK','CARRY'],
            drones:drones,
            queued_drones:0
        };
        return new_mine_task;
    },

    preform: function(task){
        //console.log(`task ${task.task_id} is being preformed`);
        let target = Game.rooms[task.target_pos.roomName].lookForAt(LOOK_SOURCES,task.target_pos.x,task.target_pos.y)[0];
        let missing_drones = 0;

        task.drones.forEach(drone => {
            let creep;
            if(drone){
                creep = Game.creeps[drone];
                if(creep){
                    //console.log(`drone ${creep.name} is working on ${task.task_id}`)
                    this.work(creep, target);
                }
            }
            else
                missing_drones += 1;
        })

        //console.log(`task ${task.task_id} is missing ${missing_drones}`);
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

    work: function(creep, target){
        let parts = creep.getActiveBodyparts(WORK);
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) <= parts * 2){
            switch(creep.harvest(target)){
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffff33'}});
                    break;
                case 0:
                    Memory.creeps[creep.name].fitness_score += parts * 2;
                    break;
            }
        }
    }

};
module.exports = mine;