let Task_Prospcet = require('task.prospect');
let Task_Mule = require('task.mule');
let Task = require('task');

const excavate = {
    init: function(room_id, target_pos){
        let job_id = `excavate:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let mine_task = Task_Prospcet.init(1, room_id, job_id, target_pos);
        let deposit_task = Task_Mule.init(2, room_id, job_id);
        let new_job ={
            job_id:job_id,
            room_id:room_id,
            job_type:'excavate',
            job_tasks:[mine_task.task_id, deposit_task.task_id],
        };

        Memory.tasks[mine_task.task_id] = mine_task;
        Memory.tasks[deposit_task.task_id] = deposit_task;
        return new_job;
    },

    operate: function(job){
        //console.log(`job ${job.job_id} is operational`);
        let prospect_task = Memory.tasks[job.job_tasks[0]];
        let prospecting_drone = prospect_task.drones[0];
        let mule_task = Memory.tasks[job.job_tasks[1]];
        
        if(
            prospect_task.drones.length > 0 &&
            mule_task.drones.length < 1 &&
            Game.creeps[prospecting_drone].store.getFreeCapacity() <= 0
        ) {
            Task.outsourceWork(prospecting_drone, mule_task, prospecting_drone);
        } else{
            Task.preform(prospect_task, prospect_task.origin_room, prospect_task.target_pos);
            Task.preform(mule_task, mule_task.origin_room, prospecting_drone);
        }
        return job;
    }
};

module.exports = excavate;