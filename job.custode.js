let Task_Sweep = require("task.sweep");
let Task_Refill = require("task.refill");
let Task_Rearm = require("task.rearm");
let Task = require('task');
const custode = {
    init: function(room_id, target_storage){
        let job_id = `custode:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let sweep_task = Task_Sweep.init(1, room_id, job_id, target_storage);
        let refill_task = Task_Refill.init(2, room_id, job_id, target_storage);
        let rearm_task = Task_Rearm.init(1, room_id, job_id, target_storage);
        let new_job = {
            job_id:job_id,
            room_id:room_id,
            job_type:'custode',
            job_tasks:[sweep_task.task_id, refill_task.task_id, rearm_task.task_id],
        };

        Memory.tasks[sweep_task.task_id] = sweep_task;
        Memory.tasks[refill_task.task_id] = refill_task;
        Memory.tasks[rearm_task.task_id] = rearm_task;
        return new_job;
    },

    operate: function(job){
        //console.log(`job ${job.job_id} is operational`);
        let sweep_task = Memory.tasks[job.job_tasks[0]];
        let refill_task = Memory.tasks[job.job_tasks[1]];
        let rearm_task = Memory.tasks[job.job_tasks[2]];
        
        if(Game.rooms[sweep_task.origin_room].find(FIND_DROPPED_RESOURCES).length < 1 && Game.rooms[sweep_task.origin_room].find(FIND_RUINS, {filter: function(ruin) {
            return (ruin.store.getFreeCapacity(RESOURCE_ENERGY) != 0);
        }}).length < 1){
            sweep_task.drones.forEach(drone =>{
                Task.outsourceWork(drone, refill_task, refill_task.target_storage);
            })
        }
        Task.preform(sweep_task, sweep_task.origin_room, sweep_task.target_storage);
        Task.preform(refill_task, refill_task.origin_room, refill_task.target_storage);
        Task.preform(rearm_task, rearm_task.origin_room, rearm_task.target_storage);
        return job;
    }
};

module.exports = custode;