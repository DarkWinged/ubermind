var spawner = {
    init: function(spawner_name){
        let new_spawner = {
            name: spawner_name,
            queue: []
        };
        return new_spawner;
    },

    operate: function(spawner_name){
        console.log(`spawner ${spawner_name} is operating`);
        let queue = Memory.spawns[spawner_name].queue;
        let spawner_inWorld = Game.spawns[spawner_name];
        let render_position = new RoomPosition(
            spawner_inWorld.pos.x,
            spawner_inWorld.pos.y,
            spawner_inWorld.pos.roomName
        );

        Game.map.visual.text(`${queue.length}`, render_position, {color: '#FF0000', fontSize: 1}); 

        if(queue.length > 0 && spawner_inWorld.spawning == null){
            let process_queue_result = this.processQueue(queue, spawner_name);
            if(process_queue_result[0] == 0)    
                Memory.spawns[spawner_name].queue = process_queue_result[1];
            else{
                render_position = new RoomPosition(
                    spawner_inWorld.pos.x - 2,
                    spawner_inWorld.pos.y - 2,
                    spawner_inWorld.pos.roomName
                );
                Game.map.visual.rect(
                    render_position,
                    4*(spawner_inWorld.room.energyAvailable/process_queue_result[1]),
                    1,
                    {fill: 'transparent', fill: '#ffff00'}
                );
                render_position = new RoomPosition(
                    spawner_inWorld.pos.x - 2,
                    spawner_inWorld.pos.y - 2,
                    spawner_inWorld.pos.roomName
                );
                Game.map.visual.rect(
                    render_position, 
                    4,
                    1,
                    {fill: 'transparent', stroke: '#0000ff'}
                );
            }
            return process_queue_result[0];
        } else
            return 0;
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
        
        console.log(spawner_inWorld.spawnCreep(dna, drone_id));
        let new_drone = {
            name:drone_id,
            role:drone_details.role,
            species:drone_details.species,
            genome:drone_details.genome,
            job_path:path

        };
        Memory.hives[spawner_inWorld.room.name].Drones.push(drone_id);
        Memory.creeps[drone_id] = new_drone;
        let drones = Memory.tasks[path['task']].drones;
        let skip = false;
        drones.forEach(drone => {
            if(!drones[drones.indexOf(drone)] && !skip){
                skip = true;
                drones[drones.indexOf(drone)]= drone_id;
            }
        });
        Memory.tasks[path['task']].drones = drones;
        Memory.tasks[path['task']].queued_drones -=1;
        /*switch(drone_details.role){
        case 'harvest':
            //require('drone_harvester').init(drone_id, Spawn_ID); 
            //require('job_route').init(drone_id, Spawn_ID);
            break;
        case 'transport':
            //require('drone_transporter').init(drone_id, Spawn_ID);
            break;
        case 'build':
            //require('drone_builder').init(drone_id, Spawn_ID);
            break;
        case 'scout':
            //require('drone_scout').init(drone_id, Spawn_ID);
            break;
        case 'heal':
            //require('drone_healer').init(drone_id, Spawn_ID);
            break;
        case 'claim':
            //require('drone_claimer').init(drone_id, Spawn_ID);
            break;
        }*/
        return 0;
    },

    queueDrone: function(spawner_name, species, path) {
        console.log(`queuing new drone of ${species.name} at ${spawner_name}`);
        let cost = this.calculateCost(Game.spawns[spawner_name], species.genome);
        if(cost < 0)
            return cost;

        let drone_details = {
            species: species.name,
            role: species.role,
            genome: species.genome,
            path: path
        }
        //console.log(drone_details.role,drone_details.species,drone_details.genome,drone_details.path);
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
                    exceeds the maximum capacity(${energy_capacity}) of spawner(${spawner_name})`
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