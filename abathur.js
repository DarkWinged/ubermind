let abathur = {
    init: function(){
        let new_abathur = {
            species:{},
            gene_table:{MOVE:MOVE,WORK:WORK,CARRY:CARRY,ATTACK:ATTACK,RANGED_ATTACK:RANGED_ATTACK,HEAL:HEAL,CLAIM:CLAIM,TOUGH:TOUGH},
            gene_cost_table:{MOVE:50,WORK:100,CARRY:50,ATTACK:80,RANGED_ATTACK:150,HEAL:250,CLAIM:600,TOUGH:10}
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
    
    speciesMutate: function(species_name, optional_scaler){
        let scale = optional_scaler || 0;
        let species = Memory.abathur.species[species_name];
        let allowed_parts = Object.keys(species.genome);
        let new_name = `${species.role}er:${Game.time%1000}:${species.generation+1}`;
        let new_genome;
        let new_species;
        let generation = species.generation;

        console.log(`Mutating species ${species_name}(${this.genomeToString(species.genome)})`);

        switch(scale){
            case -1:
                new_genome = this.mutate(species.genome, scale);
                generation += 1;
                break;
            case 0:
                scale = Game.time%11-3;
                if(scale != 0){
                    if( scale < 0)
                        scale = -1;
                    else
                        scale = 1;
                    new_genome = this.mutate(species.genome, scale);
                    generation += 1;
                }
                else
                    generation = 0;
                break;
            case 1:
                new_genome = this.mutate(species.genome, scale);
                generation += 1;
                break;
        };
        
        new_species = this.speciesCreate(new_name, species.role, generation, allowed_parts, new_genome);
        return new_species;
    },

    mutate: function (genome, scale){
        let selection;
        let gene;
        let new_genome = {};

        for(let key in genome){
            console.log(key);
            new_genome[key] = genome[key];
        }

        while(new_genome[gene] == undefined && new_genome[gene] == null){
            selection = Math.floor(Game.time*Math.random())%Object.keys(genome).length;
            gene = Object.keys(genome)[selection];
        }
        /*while(scale < 0 && genome[gene] == 1 && selection < genome.length-1){
            selection += 1;
            gene = Object.keys(genome)[selection];
        }*/
        console.log(this.genomeToString(new_genome), new_genome[gene],gene,selection,Object.keys(new_genome).length);
        new_genome[gene] += scale;
        console.log(new_genome[gene]);

        Object.keys(new_genome).forEach(gene =>{ 
            if(new_genome[gene] < 1)
            new_genome[gene] = 1;
        });

        return new_genome;

    },

    speciesList: function(){
        for(let species_id in Memory.abathur.species){
            let species = Memory.abathur.species[species_id];
            let genome_string = this.genomeToString(species.genome);
            let fintess = (species.fitness.score/species.fitness.entries)/this.genomeCost(species.genome);
            console.log(`species:${species.name}\n\trole:${species.role}\n\tgenome:[${genome_string}]\n\tfitness:${fintess}`);
        }
    },
    
    speciesSpawn: function(path, allowed_parts){
        let usable_species = this.filterSpecies(allowed_parts, path.task);
        let spawner_name;
        let result;

        console.log(`task ${path.task} is requesing ${usable_species}`);

        if(usable_species){
            spawner_name = Memory.hives[path.hive].Spawners;
            //console.log(Memory.hives[path.hive].Spawners);
            result = require('structure.spawner').queueDrone(spawner_name, usable_species, path);
            if(result < 0){
                while(result < 0){
                    let new_name = `${usable_species.role}er:${Game.time%1000}:${usable_species.generation+1}`;
                    let new_genome = this.mutate(usable_species.genome, -1);
                    let new_species = this.speciesCreate(new_name, usable_species.role, usable_species.generation+1, allowed_parts, new_genome);
                    result = require('structure.spawner').queueDrone(spawner_name, new_species, path);
                }
                Memory.abathur.species[new_species.name] = new_species;
                return result;
            }
            else
                return result;
        } else
            return 0;
    },

    filterSpecies: function(allowed_parts, task_id){
        let type = Memory.tasks[task_id].task_type;
        let usable_species = [];
        for(let species in Memory.abathur.species){
            let evaluating = Memory.abathur.species[species];
            if(evaluating.role == type)
                usable_species.push(evaluating);
        }
        
        if(usable_species.length == 0) {
            let new_name = `${type}er:${Game.time%1000}:0`;
            usable_species.push(this.speciesCreate(new_name, type, 0, allowed_parts));
            Memory.abathur.species[usable_species[0].name] = usable_species[0];
        }

        console.log(`species that are usable are: `);
        usable_species.forEach(species => {
            console.log(`\t${species.name}`);
        })

        return this.chooseSpecies(usable_species);
    },

    chooseSpecies: function(possible_species){
        let chozen;
        let pool = [];
        let pool_size = 10;
        let pool_total = 0;
        let choice;
        let iteration = 0;
        
        possible_species.forEach(species => {
            if(species.fitness.entries == 0)
                pool_total += 5;
            else
                pool_total += (species.fitness.score/species.fitness.entries)/this.genomeCost(species.genome);
        });

        possible_species.forEach(species => {
            if(species.fitness.entries == 0){
                for(iteration=0 ; iteration < (5/pool_total)*pool_size ; iteration++){
                    pool.push(species);
                }
            }
            else{
                let fitness_average = (species.fitness.score/species.fitness.entries)/this.genomeCost(species.genome);
                for(iteration=0 ; iteration < (fitness_average/pool_total)*pool_size ; iteration++){
                    pool.push(species);
                }
            }
        })

        console.log(`species in the pool are are: `);
        pool.forEach(species => {
            console.log(`\t${species.name}`);
        })

        choice = Game.time%(pool.length*1.5);

        console.log(choice,pool.length);
        if(choice >= pool.length){
            choice = Game.time%pool.length;
            console.log(choice,pool.length);
            chozen = pool[choice];
            console.log(chozen.name)
            chozen = this.speciesMutate(chozen.name, 0);

            console.log(`species ${chozen.name} has been mutated ${this.genomeToString(chozen.genome)}`);
        }
        else;
            chozen = pool[choice];

        console.log(`the chozen species is ${chozen.name, this.genomeToString(chozen.genome)}`);

        return chozen;
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

    composeDna: function(genome){
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