const Build = require("task.build");
const Upgrade = require("task.upgrade");
const Maintain = require("task.maintain");
const Task = require('task');
const ward = {
    init: function(room_id, target_room){
        let job_id = `ward:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let build_task = Build.init(1, room_id, job_id, target_room);
        let upgrade_task = Upgrade.init(1, room_id, job_id);
        let maintain_task = Maintain.init(1, room_id, job_id, target_room);
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
        let upgrade_task = Memory.tasks[job.job_tasks[1]];
        let build_task = Memory.tasks[job.job_tasks[0]];
        let maintain_task = Memory.tasks[job.job_tasks[2]];
        
        if(Game.rooms[build_task.target_room].find(FIND_CONSTRUCTION_SITES).length < 1){
            build_task.drones.forEach(drone =>{
                Task.outsourceWork(drone, maintain_task, maintain_task.target_room);
            })
        }
        
        Task.preform(upgrade_task, upgrade_task.origin_room);
        Task.preform(build_task, build_task.origin_room, build_task.target_room);
        Task.preform(maintain_task, maintain_task.origin_room, maintain_task.target_room);
        return job;
    }
};

module.exports = ward;