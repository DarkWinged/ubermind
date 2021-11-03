const spawner = require("structure.spawner");

var hive = {
    init: function(room_id){
        let new_hive = {
            name: room_id,
            Spawners: [],
            Drones: [],
            Jobs: []
        };
        
        let room_spawners = Game.rooms[room_id].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });
        
        room_spawners.forEach(spawn_local => {
            let new_spawner = spawner.init(spawn_local.name);
            Memory.spawns[new_spawner.name] = new_spawner;
            new_hive.Spawners.push(new_spawner.name);
        });

        return new_hive;
    },
    
    cleanupDrones: function (room_id) {
        let path;
        let index;
        let drone;
        let drones;
        Memory.hives[room_id].Drones.forEach(drone_id => {
            if(!Game.creeps[drone_id]){
                //console.log(`initating cleanup for ${drone_id}`);
                path = Memory.creeps[drone_id].job_path;
                index = Memory.tasks[path.task].drones.indexOf(drone_id);
                //console.log(index, ' of ', drone_id, ' in ', Memory.tasks[path.task]);
                Memory.tasks[path.task].drones[index] = null;
                
                drones = Memory.tasks[path.task].drones.sort(function(a,b) {
                    if(a == drone_id)
                        return 1;
                    if(b == drone_id)
                        return -1;
                });
                drones.pop();
                Memory.tasks[path.task].drones = drones;

                drone = Memory.creeps[drone_id];
                Memory.abathur.species[drone.species].fitness.score += drone.fitness_score;
                Memory.abathur.species[drone.species].fitness.entries += 1;
                delete(Memory.creeps[drone_id]);

                drones = Memory.hives[room_id].Drones.sort(function(a,b) {
                    if(a == drone_id)
                        return 1;
                    if(b == drone_id)
                        return -1;
                });
                drones.pop();
                Memory.hives[room_id].Drones = drones;

            }
        });
        /*for(let drone_id in Memory.hives[room_id].Drones) {
            if(!Game.creeps[drone_id]){
                console.log(`initating cleanup for ${drone_id}`);
                let path = Memory.creeps[drone_id].job_path;
                let index = Memory.tasks[path.task].drones.indexOf(drone_id);
                console.log(index, ' of ', drone_id, ' in ', Memory.tasks[path.task]);
                Memory.tasks[path.task].drones[index] = null;
                delete(Memory.creeps[drone_id]);
                delete(Memory.hives[room_id].Drones[drone_id]);
            }   
        };*/
    },

    tick: function(room_id) {
        //console.log(`Hive ${room_id} is operating`);
        this.operateSpawners(room_id);
        this.operateJobs(room_id);
        this.cleanupDrones(room_id);
    },

    operateSpawners: function (room_id) {
        Memory.hives[room_id].Spawners.forEach(local_spawn => {
            //console.log(`Hive ${room_id} is activating ${local_spawn}`);
            spawner.operate(local_spawn);
        });
    },

    createJob: function (room_id, job_type, target) {
        let new_job = require(`job.${job_type}`).init(room_id, target);
        Memory.hives[room_id].Jobs.push(new_job.job_id);
        Memory.jobs[new_job.job_id] = new_job;
        return new_job;
    },

    operateJobs:function(room_id){
        Memory.hives[room_id].Jobs.forEach(job => {
            //console.log(job,Memory.jobs[job].job_id);
            Memory.jobs[job] = this.jobSwitcher(Memory.jobs[job]);
        });
    },

    jobSwitcher: function (job) {
        //console.log(`switching job ${job.job_id}`);
        switch(job.job_type){
            case 'harvest':
                job = require('job.harvest').operate(job);    
            break;
        };
        return job;
    }

};

module.exports = hive;