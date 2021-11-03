var hive = require('hive');

module.exports.loop = function () {
    if(Memory.init == null || Memory.init == undefined)
        Memory.init = false;
    if(!Memory.init){
        console.log('Initalizing script');
        Memory.abathur = require('abathur').init();
        Memory.hives = {};
        Memory.jobs = {};
        Memory.tasks = {};
        let inital_room = Game.spawns[Object.keys(Game.spawns)].room.name; 
        Memory.hives[inital_room] = require('hive').init(inital_room);
        let source = Game.spawns[Memory.hives[inital_room].Spawners[0]].pos.findClosestByRange(FIND_SOURCES);
        require('hive').createJob(inital_room, 'harvest', source.pos);
        Memory.pause = false;
        Memory.init = true;
    }
    if(!Memory.pause){
        for(let hive_id in Memory.hives) {
            hive.tick(hive_id);
        };
    }
}