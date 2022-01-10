let abathur = {
    init: function(){
        const roles = ['mine', 'deposit', 'build', 'maintain', 'upgrade','prospect','mule','sweep','refill','rearm'];
        let new_species_list = {};

        roles.forEach(role => {
            new_species_list[role] = {}
        });

        let new_abathur = {
            species:new_species_list,
            gene_table:{MOVE:MOVE,WORK:WORK,CARRY:CARRY,ATTACK:ATTACK,RANGED_ATTACK:RANGED_ATTACK,HEAL:HEAL,CLAIM:CLAIM,TOUGH:TOUGH},
            gene_cost_table:{MOVE:50,WORK:100,CARRY:50,ATTACK:80,RANGED_ATTACK:150,HEAL:250,CLAIM:600,TOUGH:10},
            fitness_scaler:1
        }; 
        return new_abathur;
    },

    speciesCreate: function(name, role, generation, allowed_parts, genome){
        let new_genome = {};
        if(genome)
            new_genome = genome;
        else {
            allowed_parts.forEach(gene =>{
                new_genome[gene] = 1;
            });
        }
        let new_species = {
            name:name,
            role:role,
            generation:generation,
            genome:new_genome,
            fitness:{score:0, entries:0}
        }
        return new_species;
    },
    
    extinctionEvent: function(){
        let extinction_survivors = {};
        let inital_species = 0 ;
        let species_count = 0;
        let activeSpecies = this.getActiveSpecies();
        Object.keys(Memory.abathur.species).forEach(role => {
            extinction_survivors[role] =  this.speciesCull(role, activeSpecies);
            inital_species += Object.keys(Memory.abathur.species[role]).length;
            species_count += Object.keys(extinction_survivors[role]).length;
            console.log(`${role}, ${inital_species}, ${species_count}`);
        });
        
        console.log(`pre event ${inital_species} post event ${species_count}`);

        return extinction_survivors;
    },

    getActiveSpecies: function(){
        let activeSpecies = [];

        Object.keys(Memory.creeps).forEach(creep => {
            if(!activeSpecies.includes(Memory.creeps[creep].species))
                activeSpecies.push(Memory.creeps[creep].species);
        });

        return activeSpecies;
    },
    
    fitnessCalc: function(species){
        return (species.fitness.score / species.fitness.entries) / this.genomeLength(species.genome);
    },

    speciesCull: function(role, activeSpecies){
        let extinction_pool = [];
        let exempt = [];
        let result = {};

        Object.keys(Memory.abathur.species[role]).forEach(species => {
            if(activeSpecies.includes(species) || Memory.abathur.species[role][species].fitness.entries < 1)
                exempt.push(Memory.abathur.species[role][species]);
            else
                extinction_pool.push(Memory.abathur.species[role][species]);
        })

        extinction_pool.sort(
            (a, b) => {
                if(this.fitnessCalc(a) > this.fitnessCalc(b)){
                    return -1;
                }
                
                if(this.fitnessCalc(a) < this.fitnessCalc(b)){  
                    return 1;
                }

                return 0;
            }
        );
        
        while(extinction_pool.length > 5){
            extinction_pool.pop();
        }

        let fitness
        console.log(`survivors ${extinction_pool.length}`);
        extinction_pool.forEach( species =>{
            fitness = this.fitnessCalc(species);
            console.log(`${species.name}:(${species.fitness.score}/${species.fitness.entries})/${this.genomeCompose(species.genome).length}=${fitness}, cost:${this.genomeCost(species.genome)}`);
            result[species.name] = species;
        });

        console.log(`Escapees ${exempt.length}`);
        exempt.forEach( species =>{
            fitness = this.fitnessCalc(species);
            console.log(`${species.name}:(${species.fitness.score}/${species.fitness.entries})/${this.genomeCompose(species.genome).length}=${fitness}, cost:${this.genomeCost(species.genome)}`);
            result[species.name] = species;
        });

        return result;
    },

    speciesMutate: function(species_role, species_name, optional_scaler){
        let scale = optional_scaler || 0;
        let species = Memory.abathur.species[species_role][species_name];
        let allowed_parts = Object.keys(species.genome);
        let new_name = `${species.role}er:${Game.time%1000}:${species.generation+1}`;
        let new_genome;
        let new_species;
        let generation = species.generation;

        //console.log(`Mutating species ${species_name}(${this.genomeToString(species.genome)})`);

        let limit = 1 + Game.time%5;
        for(i = 0; i < limit; i++){
            scale = (Game.time*(i + 1))%11 - 2;
            if(scale != 0){
                if( scale < 0)
                    scale = -1;
                else
                    scale = 1;
                new_genome = this.genomeMutate(species.genome, scale);
            }
        }
        generation += 1;
        
        new_species = this.speciesCreate(new_name, species.role, generation, allowed_parts, new_genome);
        return new_species;
    },

    speciesList: function(roles_in){
        let roles = roles_in || Object.keys(Memory.abathur.species);
        roles.forEach(role =>{
            if(Object.keys(Memory.abathur.species).includes(role)){
                for(let species_id in Memory.abathur.species[role]){
                    let species = Memory.abathur.species[role][species_id];
                    let genome_string = this.genomeToString(species.genome);
                    let fintess = Math.round(this.fitnessCalc(species));
                    console.log(`species:${species.name}\n\trole:${species.role}\n\tgenome:[${genome_string}]\n\tfitness:${fintess}`);
                }
            }
        })
        /*for(let role in roles){
            for(let species_id in Memory.abathur.species[role]){
                let species = Memory.abathur.species[role][species_id];
                let genome_string = this.genomeToString(species.genome);
                let fintess = (species.fitness.score/species.fitness.entries)/this.genomeCost(species.genome);
                console.log(`species:${species.name}\n\trole:${species.role}\n\tgenome:[${genome_string}]\n\tfitness:${fintess}`);
            }
        }*/
    },
    
    speciesSpawn: function(path, allowed_parts){
        let usable_species = this.filterSpecies(allowed_parts, path.task);
        let spawner_name;
        let result;

        //console.log(`task ${path.task} is requesing ${usable_species}`);

        if(usable_species){
            spawner_name = Memory.hives[path.hive].Spawners;
            //console.log(Memory.hives[path.hive].Spawners);
            result = require('structure.spawner').queueDrone(spawner_name, usable_species, path);
            if(result < 0){
                let new_species;
                let new_genome;
                let new_name;
                while(result < 0){
                    new_name = `${usable_species.role}er:${Game.time%1000}:${usable_species.generation+1}`;
                    new_genome = this.genomeMutate(usable_species.genome, -1);
                    new_species = this.speciesCreate(new_name, usable_species.role, usable_species.generation+1, allowed_parts, new_genome);
                    result = require('structure.spawner').queueDrone(spawner_name, new_species, path);
                }
                Memory.abathur.species[new_species.role][new_species.name] = new_species;
                return result;
            }
            else
                return result;
        } else
            return 0;
    },

    spawnProbability: function(role){
        let species_list = [];
        
        let pool = [];
        let pool_size = 10;
        let pool_total = 0;
        let iteration = 0;

        Object.keys(Memory.abathur.species[role]).forEach(species => {
            species_list.push(Memory.abathur.species[role][species]);
        });
        
        species_list.forEach(species => {
            if(species.fitness.entries == 0)
                pool_total += 5;
            else
                pool_total += Math.round(this.fitnessCalc(species));
        });

        species_list.forEach(species => {
            if(species.fitness.entries == 0){
                for(iteration=0 ; iteration < (5/pool_total)*pool_size ; iteration++){
                    pool.push(species);
                }
            }
            else{
                let fitness_average = Math.round(this.fitnessCalc(species));
                for(iteration=0 ; iteration < (fitness_average/pool_total)*pool_size ; iteration++){
                    pool.push(species);
                }
            }
        })

        console.log(`species in the pool are are: `);
        pool.forEach(species => {
            let fintess = Math.round(this.fitnessCalc(species));
            let genome_string = this.genomeToString(species.genome);
            console.log(`${species.name}\n\trole:${species.role}\n\tgenome:[${genome_string}]\n\tfitness:${fintess}`);
        })

    },

    filterSpecies: function(allowed_parts, task_id){
        let type = Memory.tasks[task_id].task_type;
        let usable_species = [];
        for(let species in Memory.abathur.species[type]){
            usable_species.push(Memory.abathur.species[type][species]);
        }
        
        if(usable_species.length == 0) {
            let new_name = `${type}er:${Game.time%1000}:0`;
            usable_species.push(this.speciesCreate(new_name, type, 0, allowed_parts));
            Memory.abathur.species[type][usable_species[0].name] = usable_species[0];
        }

        //console.log(`species that are usable are: `);
        //usable_species.forEach(species => {
            //console.log(`\t${species.name}`);
        //})

        return this.chooseSpecies(usable_species);
    },

    chooseSpecies: function(possible_species){
        let chozen;
        let pool = [];
        let pool_size = 10;
        let pool_total = 0;
        let choice;            

        possible_species.forEach(species => {
            if(species.fitness.entries == 0)
                pool_total += 5;
            else
                pool_total += Math.round(this.fitnessCalc(species));
        });

        possible_species.forEach(species => {
            let fitness_score;

            if(species.fitness.entries == 0){
                fitness_score = 5;
            } else {
                fitness_score = Math.round(this.fitnessCalc(species));
            }

            for(let iteration=0 ; iteration < (fitness_score/pool_total)*pool_size; iteration++){
                new_pool.push(species);
            }
        });

        //console.log(`species in the pool are are: `);
        //pool.forEach(species => {
            //console.log(`\t${species.name}`);
        //})

        choice = Math.round(Game.time%(pool.length*1.5));

        //console.log(choice,pool.length);
        if(choice >= pool.length){
            choice = Game.time%pool.length;
            //console.log(choice,pool.length);
            chozen = pool[choice];
            //console.log(chozen.name)
            chozen = this.speciesMutate(chozen.role, chozen.name, 0);
            Memory.abathur.species[chozen.role][chozen.name] = chozen;
            //console.log(`species ${chozen.name} has been mutated ${this.genomeToString(chozen.genome)}`);
        }
        else{
            chozen = pool[choice];
        }

        //console.log(`the chozen species is ${chozen.name} as ${this.genomeToString(chozen.genome)}`);

        return chozen;
    },

    genomeMutate: function (genome, scale){
        let selection;
        let gene;
        let new_genome = {};

        for(let key in genome){
            console.log(key);
            if(key != null || key != undefined){
                new_genome[key] = genome[key];
            }
        }

        selection = Math.floor(Game.time*Math.random())%Object.keys(genome).length;
        gene = Object.keys(genome)[selection];
        new_genome[gene] += scale;

        if(new_genome[gene] < 1 && gene != TOUGH){
            new_genome[gene] = 1;
        }

        return new_genome;

    },

    genomeCost: function(genome){
        let cost = 0;

        for(let gene in genome){
            cost += (Memory.abathur.gene_cost_table[gene]*genome[gene]);
        }

        return cost;
    },

    genomeToString: function(genome){
        let genome_string = '';
            let count = 0;
            for(let gene in genome){
                if(count < 1)
                    genome_string +=  `${gene}:${genome[gene]}`;
                else
                    genome_string += `,${gene}:${genome[gene]}`;
                count += 1;
            };
        return genome_string;
    },
    
    genomeLength: function(genome){
        let genome_length = 0;
        for(let gene in genome){
            genome_length += genome[gene];
        }
        return genome_length;
    },

    genomeCompose: function(genome){
        let dna = [];
        for(let gene in genome){
            for(var gene_occurance = 0; gene_occurance < genome[gene]; gene_occurance++){
                dna.push(Memory.abathur.gene_table[gene]);
            }
        }
        
        return dna;
    },
};

module.exports = abathur;