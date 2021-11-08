const hive = require('hive');
const abathur = require('abathur');

const main = {
    init: function(){
        console.log('Initalizing script');
        this.resetMemory();
        this.assignAbathur();
        this.assignHives();
    },
    
    assignAbathur:function(){
        Memory.abathur = abathur.init();
        let new_species = abathur.speciesCreate(`${'mine'}er:${Game.time%1000}:${0}`, 'mine', 0, [WORK,MOVE,CARRY], {WORK:2,MOVE:1,CARRY:1});
        Memory.abathur.species[new_species.name] = new_species;
    },
    
    assignHives: function(){
        let inital_room = Game.spawns[Object.keys(Game.spawns)[0]].room.name; 
        Memory.hives[inital_room] = hive.init(inital_room);
        console.log(`initalizing hive:${Memory.hives.name}`)
        let sources = Game.spawns[Memory.hives[inital_room].Spawners[0]].room.find(FIND_SOURCES);
        sources.forEach(source => {
            console.log(`creating job for source ${source.id}`);
            hive.createJob(inital_room, 'harvest', source.pos);
        });
        console.log(`creating job for source ${inital_room}`);
        hive.createJob(inital_room, 'ward', inital_room);
    },
    
    resetMemory: function(){
        console.log('resetting memory');
        Memory.creeps = {};
        Memory.spawns = {}
        Memory.abathur = {};
        Memory.hives = {};
        Memory.jobs = {};
        Memory.tasks = {};
        Memory.pause = false;
        Memory.init = true;
    }
};

module.exports.loop = function () {
    if(Memory.init == null || Memory.init == undefined)
        Memory.init = false;
    if(!Memory.init){
        main.init();
    }
    
    if(!Memory.pause){
        for(let hive_id in Memory.hives) {
            hive.tick(hive_id);
        };
    }
    
    if(Game.cpu.bucket >= 5000)
        Game.cpu.generatePixel();
}