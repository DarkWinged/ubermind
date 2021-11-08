const build = require("task.build");
const upgrade = require("task.upgrade");
const maintain = require("task.maintain");
var ward = {
    init: function(room_id, target_room){
        let job_id = `ward:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let build_task = build.init(1, room_id, job_id, target_room);
        let upgrade_task = upgrade.init(1, room_id, job_id);
        let maintain_task = maintain.init(1, room_id, job_id, target_room);
        let new_job = {
            job_id:job_id,
            room_id:room_id,
            job_type:'ward',
            job_tasks:[build_task.task_id, upgrade_task.task_id, maintain_task.task_id],
        };

        Memory.tasks[build_task.task_id] = build_task;
        Memory.tasks[upgrade_task.task_id] = upgrade_task;
        Memory.tasks[maintain_task.task_id] = maintain_task;
        return new_job;
    },

    operate: function(job){
        //console.log(`job ${job.job_id} is operational`);
        upgrade.preform(Memory.tasks[job.job_tasks[1]]);
        build.preform(Memory.tasks[job.job_tasks[0]], Memory.tasks[job.job_tasks[0]].target_room);
        maintain.preform(Memory.tasks[job.job_tasks[2]], Memory.tasks[job.job_tasks[2]].target_room);
        return job;
    }
};

module.exports = ward;