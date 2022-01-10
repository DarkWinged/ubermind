const task = {
    
    preform: function(task, room_id, target){
        //console.log(`task ${task.task_id} is being preformed`);
        let missing_drones = task.drones_desired - task.drones.length;
        let creep;

        task.drones.forEach(drone => {
            if(drone){
                creep = Game.creeps[drone];
                if(creep){
                    //console.log(`drone ${creep.name} is working on ${task.task_id} which is a ${task.task_type}`)
                    require(`task.${task.task_type}`).work(creep, room_id, target, task.task_id);
                }
            }
        });

        //console.log(`task ${task.task_id} is missing ${missing_drones}`);
        if(missing_drones > 0)
            task.drones_queued += this.requestDrones(task, missing_drones-task.drones_queued);
    },

    outsourceWork: function(drone, task, target){
        if(drone){
            let creep = Game.creeps[drone];
            if(creep){
                //console.log(`drone ${creep.name} is working on ${task.task_id} which is a ${task.task_type}`)
                require(`task.${task.task_type}`).work(creep, task.origin_room, target);
            }
        }
    },

    requestDrones: function(task, count){
        let path = {hive:task.origin_room, job:task.job_id, task:task.task_id};
        let queued = 0;
        while(count > 0){
            queued += require('abathur').speciesSpawn(path, task.allowed_parts);
            count -= 1;
        }
        return queued;
    },

    
    pythagDistance: function(posA, posB){
        let X = Math.abs(posA.x - posB.x);
        let Y = Math.abs(posA.y - posB.y);
        return Math.sqrt(X*X + Y*Y);
    },

    findStorage: function(position){ 
        ///console.log(`looking for storage near ${position}`);
        const valid_structures = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION];           
        let found;
        
        found = this.findStructures(position,[STRUCTURE_STORAGE])[0];
        
        if(!found){
            found = this.findStructures(position, valid_structures, true);
            found = found.sort((a,b) => (this.pythagDistance(a.pos, position) < this.pythagDistance(b.pos, position))? -1: 1)[0];
        }

        return found;
    },

    findStructures: function(position, looking_for_structures, full){
        const valid_structures = looking_for_structures || [STRUCTURE_SPAWN, STRUCTURE_EXTENSION];           
        let found;
        if(full){
            found = Game.rooms[position.roomName].find(FIND_MY_STRUCTURES, {
                filter: function(structure) {
                    return (valid_structures.includes(structure.structureType) && structure.store.getUsedCapacity(RESOURCE_ENERGY) != 0);
                }
            });
        }
        else {
            found = Game.rooms[position.roomName].find(FIND_MY_STRUCTURES, {
                filter: function(structure) {
                    return (valid_structures.includes(structure.structureType) && structure.store.getFreeCapacity(RESOURCE_ENERGY) != 0);
                }
            });
        }

        return found;
    },

    findDepot: function(position){ 
        const valid_structures = [STRUCTURE_SPAWN,STRUCTURE_EXTENSION,STRUCTURE_TOWER];           
        let found;
        
        found = this.findStructures(position,[STRUCTURE_STORAGE])[0];
        
        if(!found){
            found = this.findStructures(position, valid_structures, false);
            found = found.sort((a,b) => (this.pythagDistance(a.pos, position) < this.pythagDistance(b.pos, position))? -1: 1)[0];
        }
        
        return found;
    },
    
};

module.exports = task;