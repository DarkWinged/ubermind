let Spawner = require("structure.spawner");
let Tower = require('structure.tower');

const hive = {
    init: function(room_id){
        let new_hive = {
            name: room_id,
            Spawners: [],
            Towers: [],
            Drones: [],
            Jobs: []
        };
        
        let room_spawners = Game.rooms[room_id].find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });
        
        room_spawners.forEach(spawn_local => {
            new_hive = this.createSpawner(new_hive, spawn_local);
        });

        return new_hive;
    },
    
    cleanupDrones: function (room_id) {
        let path;
        Memory.hives[room_id].Drones.forEach(drone_id => {
            //console.log(`Checking if ${drone_id} exits ${Game.creeps[drone_id]}`)
            if(Game.creeps[drone_id] == null || Game.creeps[drone_id] == undefined) {
                if(Memory.creeps[drone_id])
                    path = Memory.creeps[drone_id].job_path;
                else{
                    let task = _.filter(Memory.tasks, task => task.drones.includes(drone_id));
                    if(task.length > 0)
                        Memory.tasks[task[0].task_id].drones = this.removeDroneInArray(drone_id, task[0].drones);
                    Memory.hives[room_id].Drones = this.removeDroneInArray(drone_id, Memory.hives[room_id].Drones);
                }
                if(path){
                    this.inturDrone(Memory.creeps[drone_id], drone_id, path, room_id);
                }
            }
        });
    },
    
    getGenerationFromString: function(speciesName){
        let map = {"48": 0, "49": 1, "50": 2, "51": 3, "52": 4, "53": 5, "54": 6, '55': 7, "56": 8, "57": 9, "58": ":"};
        let index = speciesName.length - 1;
        let result = 0; 
        let testing;
        //while(index >= 0){
            testing = map[speciesName.charCodeAt(index)]
            if(testing != ":")
                result = (result * 10) + speciesName.charCodeAt(index);
            else
                return result;
        //}; 
        return result;
    },

    inturDrone: function(drone, drone_id, path, room_id){
        if(Memory.abathur.species[drone.role][drone.species]){
            Memory.abathur.species[drone.role][drone.species].fitness.score += drone.fitness_score;
            Memory.abathur.species[drone.role][drone.species].fitness.entries += 1;
        }
        else{
            let new_name = Memory.creeps[drone.name].species;
            let new_species = require('abathur').speciesCreate(new_name, Memory.creeps[drone.name].role, this.getGenerationFromString(new_name), [], Memory.creeps[drone.name].genome);
            Memory.abathur.species[drone.role][new_name] = new_species;
            Memory.abathur.species[drone.role][new_name].fitness.score += drone.fitness_score;
            Memory.abathur.species[drone.role][new_name].fitness.entries += 1;
        }
        
        if(Memory.tasks[path.task])
            Memory.tasks[path.task].drones = this.removeDroneInArray(drone_id, Memory.tasks[path.task].drones);
        Memory.hives[room_id].Drones = this.removeDroneInArray(drone_id, Memory.hives[room_id].Drones);
        delete(Memory.creeps[drone_id]);
    },

    removeDroneInArray: function(drone_id, array) {
        let drones = array.sort(function(a,b) {
            if(a == drone_id)
                return 1;
            if(b == drone_id)
                return -1;
        });
        array.toString(),drones.pop();
        return drones;
    },

    tick: function(room_id) {
        //console.log(`Hive ${room_id} is operating`);
        this.cleanupDrones(room_id);
        this.operateJobs(room_id);
        this.operateSpawners(room_id);
        this.operateTowers(room_id);
    },

    createSpawner: function(new_hive, spawn_local) {
        let new_spawner = Spawner.init(spawn_local.name);
        Memory.spawns[new_spawner.name] = new_spawner;
        new_hive.Spawners.push(new_spawner.name);
        return new_hive;
    },

    operateSpawners: function (room_id) {
        Memory.hives[room_id].Spawners.forEach(local_spawn => {
            //console.log(`Hive ${room_id} is activating ${local_spawn}`);
            Spawner.operate(local_spawn);
        });
    },
    
    createTower: function (room_id, tower_id) {
        let new_tower = Tower.init(tower_id);
        Memory.hives[room_id].Towers.push(new_tower.name);
        Memory.towers[new_tower.name] = new_tower;
        return new_tower;
    },

    operateTowers: function (room_id) {
        Memory.hives[room_id].Towers.forEach(local_tower => {
            //console.log(`Hive ${room_id} is activating ${local_spawn}`);
            Tower.operate(local_tower);
        });
    },

    createJob: function (room_id, job_type, target) {
        console.log(room_id, job_type, target)
        let new_job = require(`job.${job_type}`).init(room_id, target);
        Memory.hives[room_id].Jobs.push(new_job.job_id);
        Memory.jobs[new_job.job_id] = new_job;
        return new_job;
    },

    operateJobs:function(room_id){
        Memory.hives[room_id].Jobs.forEach(job => {
            //console.log(job,Memory.jobs[job].job_id);
            Memory.jobs[job] = require(`job.${Memory.jobs[job].job_type}`).operate(Memory.jobs[job]);
        });
    },

};

module.exports = hive;