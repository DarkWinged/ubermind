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
        console.log(`task ${task.task_id} is being preformed`);
        let target = Game.rooms[task.target_pos.roomName].lookForAt(LOOK_SOURCES,task.target_pos.x,task.target_pos.y)[0];
        let missing_drones = 0;

        task.drones.forEach(drone => {
            let creep;
            if(drone){
                creep = Game.creeps[drone];
                if(creep)
                    this.work(creep, target);
            }
            else
                missing_drones += 1;
        })

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
        switch(creep.harvest(target)){
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target, {visualizePathStyle: {stroke: '#ffff33'}});
                break;
            case 0:
                //parts = creep.getActiveBodyparts(WORK);
                //Memory.drones[creep.name].Fitness_Score[Job_ID] += parts * 2;
                break;
            }
    }

};

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
module.exports = mine;