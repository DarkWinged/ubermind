var spawner = {
    init: function(spawner_name){
        let new_spawner = {
            name: spawner_name,
            queue: [],
            priority_queue: []
        };
        return new_spawner;
    },

    operate: function(spawner_name){
        //console.log(`spawner ${spawner_name} is operating`);
        let spawner_inWorld = Game.spawns[spawner_name];
        let result;
        let render_position = {x:spawner_inWorld.pos.x,y:spawner_inWorld.pos.y,roomName:spawner_inWorld.pos.roomName};

        spawner_inWorld.room.visual.text(`${Memory.spawns[spawner_name].queue.length},${Memory.spawns[spawner_name].priority_queue.length}`, render_position, {color: '#FF0000', fontSize: 1}); 

        if(spawner_inWorld.spawning == null){
            if(Memory.spawns[spawner_name].priority_queue.length > 0){
                result = this.queue(Memory.spawns[spawner_name].priority_queue, spawner_name);
                Memory.spawns[spawner_name].priority_queue = result[0];
                return result[1];
            }
            else if(Memory.spawns[spawner_name].queue.length > 0){
                result = this.queue(Memory.spawns[spawner_name].queue, spawner_name);
                Memory.spawns[spawner_name].queue = result[0];
                return result[1];
            }
            else
                return 0;
        } else
            return 0;
    },

    queue: function(queue, spawner_name){
        let process_queue_result = this.processQueue(queue, spawner_name);
        let spawner_inWorld = Game.spawns[spawner_name];
        let render_position = {x:spawner_inWorld.pos.x,y:spawner_inWorld.pos.y,roomName:spawner_inWorld.pos.roomName};
        if(process_queue_result[0] == 0)    
            queue = process_queue_result[1];
        else{
            render_position.x -= 2;
            render_position.y -= 2;

            spawner_inWorld.room.visual.rect(
                render_position,
                4*(spawner_inWorld.room.energyAvailable/process_queue_result[1]),
                1,
                {fill: 'transparent', fill: '#ffff00'}
            );
            spawner_inWorld.room.visual.rect(
                render_position, 
                4,
                1,
                {fill: 'transparent', stroke: '#0000ff'}
            );
        }
        return [queue, process_queue_result[0]];
    },

    processQueue: function(queue, spawner_name){
        let spawner_inWorld = Game.spawns[spawner_name];
        let drone_details = queue.shift();
        
        let cost = this.calculateCost(spawner_inWorld, drone_details.genome);
        if(cost <= spawner_inWorld.room.energyAvailable){
            return [this.buildDrone(spawner_name, drone_details), queue];
        }
        else{
            queue.unshift(drone_details);
            return [1,cost];
        }
    },

    buildDrone: function(spawner_name, drone_details){
        let spawner_inWorld = Game.spawns[spawner_name];
        let dna = require('abathur').composeDna(drone_details.genome);
        let drone_id = `${drone_details.species}:${Game.time}x${Math.round(Math.random()*1000)}X`;
        let path = drone_details.path;
        
        console.log(`Spawning new ${drone_details.species}: ${drone_id},${dna.toString()}`);
        
        spawner_inWorld.spawnCreep(dna, drone_id);
        let new_drone = {
            name:drone_id,
            role:drone_details.role,
            species:drone_details.species,
            genome:drone_details.genome,
            job_path:path,
            fitness_score:1

        };
        Memory.hives[spawner_inWorld.room.name].Drones.push(drone_id);
        Memory.creeps[drone_id] = new_drone;
        Memory.tasks[path['task']].drones.push(drone_id);
        Memory.tasks[path['task']].drones_queued -=1;
        return 0;
    },

    queueDrone: function(spawner_name, species, path) {
        console.log(`queuing new drone of ${species.name} at ${spawner_name}`);
        let cost = this.calculateCost(Game.spawns[spawner_name], species.genome);
        const priority_roles = ['mine','deposit'];
        if(cost < 0)
            return cost;

        let drone_details = {
            species: species.name,
            role: species.role,
            genome: species.genome,
            path: path
        }
        console.log(`drone details:`,drone_details.role,drone_details.species,drone_details.genome,drone_details.path);
        if(priority_roles.includes(species.role))
            Memory.spawns[spawner_name].priority_queue.push(drone_details);
        else
            Memory.spawns[spawner_name].queue.push(drone_details);

        return 1;
    },

    calculateCost: function(spawner_inWorld, genome){
        let total_cost = 0;
        //In game part costs
        
        total_cost = require('abathur').genomeCost(genome);

        let energy_capacity = spawner_inWorld.room.energyCapacityAvailable;

        try {
            if(total_cost <= energy_capacity)    
                return total_cost;
            else {
                throw new RangeError(
                    `Genome{${require('abathur').genomeToString(genome)}} cost(${total_cost})
                    exceeds the maximum capacity(${energy_capacity}) of spawner(${spawner_inWorld.name})`
                );
            }
        } catch (error) {
            if(error instanceof RangeError){
                console.log(error);
                return energy_capacity-total_cost;
            }
            else{
                throw error;
            }
        }
    },

};

module.exports = spawner;