let abathur = {
    init: function(){
        let new_abathur = {
            species:{},
            gene_table:{MOVE:MOVE,WORK:WORK,CARRY:CARRY,ATTACK:ATTACK,RANGED_ATTACK:RANGED_ATTACK,HEAL:HEAL,CLAIM:CLAIM,TOUGH:TOUGH},
            gene_cost_table:{MOVE:50,WORK:100,CARRY:50,ATTACK:80,RANGED_ATTACK:150,HEAL:250,CLAIM:600,TOUGH:10}
        }; 
        return new_abathur;
    },

    speciesCreate: function(name, role, allowed_parts){
        let new_genome = {};
        allowed_parts.forEach(gene =>{
            new_genome[gene] = 1;
        });
        let new_species = {
            name:name,
            role:role,
            genome:new_genome
        }
        return new_species;
    },
    
    speciesMutate: function(species_name, optional_scaler){
        let scale = optional_scaler || 0;
        let species = Memory.abathur.species[species_name];

        switch(scale){
            case -1:
                species.genome = this.mutate(species.genome, scale);
                break;
            case 0:
                scale = Game.time%3-2;
                if(scale != 0)
                    species.genome = this.mutate(species.genome, scale);
                break;
            case 1:
                species.genome = this.mutate(species.genome, scale);
                break;
        };

        Object.keys(species.genome).forEach(gene =>{ 
            if(species.genome[gene] < 1)
                species.genome[gene] = 1;
        });

        return species;
    },

    mutate: function (genome, scale){
        let selection = Game.time%Object.keys(genome).length;
        selection = Object.keys(genome)[selection];
        console.log(genome[selection]);
        genome[selection] += scale;
        console.log(genome[selection]);
        return genome;

    },

    speciesList: function(){
        for(let species_id in Memory.abathur.species){
            let species = Memory.abathur.species[species_id];
            let genome_string = this.genomeToString(species.genome)
            console.log(`species:${species.name}\n\trole:${species.role}\n\tgenome:[${genome_string}]`);
        }
    },
    
    speciesSpawn: function(path, allowed_parts){
        let usable_species = this.filterSpecies(allowed_parts, path.task);

        if(usable_species){
            let spawner_name = Memory.hives[path.hive].Spawners;
            console.log(Memory.hives[path.hive].Spawners);
            let result = require('structure.spawner').queueDrone(spawner_name, usable_species, path);
            if(result < 0){
                Memory.abathur.species[usable_species.name] = this.speciesMutate(usable_species.genome,-1);
                return 0;
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
                usable_species.push(eval);
        }
        
        if(usable_species.length == 0) {
            let new_name = `${type}er:${Game.time%1000}`;
            usable_species.push(this.speciesCreate(new_name, type, allowed_parts));
        }
        return usable_species[0];
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