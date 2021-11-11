const Mine = require('task.mine');
const Deposit = require('task.deposit');
const Task = require('task');

const harvest = {
    init: function(room_id, target_pos){
        let job_id = `harvest:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let mine_task = Mine.init(1, room_id, job_id, target_pos);
        let deposit_task = Deposit.init(2, room_id, job_id);
        let new_job ={
            job_id:job_id,
            room_id:room_id,
            job_type:'harvest',
            job_tasks:[mine_task.task_id, deposit_task.task_id],
        };

        Memory.tasks[mine_task.task_id] = mine_task;
        Memory.tasks[deposit_task.task_id] = deposit_task;
        return new_job;
    },

    operate: function(job){
        //console.log(`job ${job.job_id} is operational`);
        let mining_task = Memory.tasks[job.job_tasks[0]];
        let mining_drone = mining_task.drones[0];
        let depositing_task = Memory.tasks[job.job_tasks[1]];
        
        if(
            mining_task.drones.length > 0 &&
            depositing_task.drones.length < 1 &&
            Game.creeps[mining_drone].store.getFreeCapacity() <= 0
        ) {
            Task.outsourceWork(mining_drone, depositing_task, mining_drone);
        } else{
            Task.preform(mining_task, mining_task.origin_room, mining_task.target_pos);
            Task.preform(depositing_task, depositing_task.origin_room, mining_drone);
        }
        return job;
    }
};

module.exports = harvest;