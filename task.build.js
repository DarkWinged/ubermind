let Task = require('task');
const build = {
    init: function(drones_desired, room_id, job_id, target_room){
        let task_id = `build:${Game.time%1000}x${Math.round(Math.random()*1000)}`;
        let new_build_task = {
            task_id: task_id,
            job_id: job_id,
            task_type: 'build',
            origin_room:room_id,
            target_room:target_room,
            allowed_parts:['MOVE','WORK','CARRY'],
            drones:[],
            drones_desired:drones_desired,
            drones_queued:0
        };
        return new_build_task;
    },

    work: function(drone, room_id, target){
        if(Memory.creeps[drone.name].loaded){
            //console.log(`builder(${drone.name}) is working on ${target}`);
            this.buildStructures(drone, target);
            if(drone.store.getUsedCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = false;
        }
        else{
            this.pickupResources(drone, room_id);
            if(drone.store.getFreeCapacity(RESOURCE_ENERGY) < 1)
                Memory.creeps[drone.name].loaded = true;
        }
    },

    pickupResources: function(drone, room_id){
        if (drone.pos.roomName != room_id) {
            drone.moveTo({x:25,y:25,roomName:room_id});
        }
        else {
            let target = Task.findStorage(drone.pos);
            //console.log(`builder(${drone.name}) is resuplying from ${target}`);
            switch(drone.withdraw(target, RESOURCE_ENERGY)) {
                case ERR_NOT_IN_RANGE: 
                    drone.moveTo(target);
                    break;
            }
        }
    },

    buildStructures: function(drone, room_id){
        if (drone.pos.roomName != room_id) {
            drone.moveTo({x:20,y:20,roomName:room_id});
        } else {
            let targets = Memory.creeps[drone.name].targets_build_list;

            if(!targets || targets.length == 0){
                targets = drone.room.find(FIND_CONSTRUCTION_SITES);
                targets = targets.map((t) => t.id);
            }
            //console.log(`number of constructon sites: ${targets.length}`);
            if(targets.length > 0){
                let target = Game.getObjectById(Memory.creeps[drone.name].targets_build);
                if(!target){
                    targets = targets.filter(t => Game.getObjectById(t) != null);
                    let search_targets = targets.map((t) => Game.getObjectById(t));
                    target = drone.pos.findClosestByRange(search_targets);
                }
                if(target){
                    //console.log(`construction sites ${targets.toString()}`);
                    Memory.creeps[drone.name].targets_build = target.id;
                    this.build(drone, target)
                }

                Memory.creeps[drone.name].targets_build_list = targets;
            }
        }
    },

    build: function(drone, target){
        let parts = drone.getActiveBodyparts(WORK);
        switch(drone.build(target)) {
            case ERR_NOT_IN_RANGE:
                drone.moveTo(target, {visualizePathStyle: {stroke: '#33f6ff'}});
                return true;
            case ERR_INVALID_TARGET:
                return false
            case 0:
                Memory.creeps[drone.name].fitness_score += (parts * 5)*Memory.abathur.fitness_scaler;
                return true;
        }
    }
};

module.exports = build;