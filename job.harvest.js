const mine = require('task.mine');
const deposit = require('task.deposit');

var harvest = {
    init: function(room_id, target_pos){
        let job_id = `harvest:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let mine_task = mine.init(1, room_id, job_id, target_pos);
        let deposit_task = deposit.init(2, room_id, job_id);
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
        let task1 = Memory.tasks[job.job_tasks[0]];
        let task2 = Memory.tasks[job.job_tasks[1]];
        if(task1.drones.length > 0 && task2.drones.length < 1 && Game.creeps[task1.drones[0]].store.getFreeCapacity() <= 0){
            deposit.outsourceWork(task1.drones[0], task1.drones[0], task2.origin_room);
        } else{
            mine.preform(task1, job.room_id);
            deposit.preform(task2, task1.drones[0], job.room_id);
        }
        return job;
    }
};

module.exports = harvest;