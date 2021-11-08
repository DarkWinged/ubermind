var mine = {
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

    preform: function(task){
        //console.log(`task ${task.task_id} is being preformed`);
        let target = Game.rooms[task.target_pos.roomName].lookForAt(LOOK_SOURCES,task.target_pos.x,task.target_pos.y)[0];
        let missing_drones = task.drones_desired - task.drones.length;
        let creep;

        task.drones.forEach(drone => {
            if(drone){
                creep = Game.creeps[drone];
                if(creep){
                    //console.log(`drone ${creep.name} is working on ${task.task_id}`)
                    this.work(creep, target);
                }
            }
        })

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

    work: function(creep, target){
        let parts = creep.getActiveBodyparts(WORK);
        if(creep.store.getFreeCapacity(RESOURCE_ENERGY) >= parts * 2){
            switch(creep.harvest(target)){
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffff33'}});
                    break;
                case 0:
                    Memory.creeps[creep.name].fitness_score += parts * 2;
                    break;
            }
        } else {
            switch(creep.harvest(target)){
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#ffff33'}});
                    break;
                case 0:
                    Memory.creeps[creep.name].fitness_score += creep.store.getFreeCapacity(RESOURCE_ENERGY);
                    break;
            }
        }
    }

};
module.exports = mine;