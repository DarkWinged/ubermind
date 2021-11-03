var mine = require('task.mine');
var deposit = require('task.deposit');

var harvest = {
    init: function(room_id, target_pos){
        let job_id = `harvest:${Game.time%1000}`;
        let mine_task = mine.init(1, target_pos, job_id, room_id);
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
        mine.preform(Memory.tasks[job.job_tasks[0]], job.room_id);
        deposit.preform(Memory.tasks[job.job_tasks[1]], Memory.tasks[job.job_tasks[0]].drones[0], job.room_id);
        return job;
    }
};

module.exports = harvest;