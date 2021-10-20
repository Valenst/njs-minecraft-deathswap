console.log("Successfully entered main.js");

// Initialise and start the server

const ScriptServer = require('scriptserver');
const server = new ScriptServer({
  core: {
    jar: 'minecraft_server.1.16.1.jar',
    args: ['-d64 -Xmx4G -Xms1G -jar minecraft_server.1.16.1.jar'],
    rcon: {
      port: '25575',
      password: 'password'
    }
  },
})

server.use(require('scriptserver-event'));
server.start();

let NUMBER_OF_PLAYER;
let PLAYERS_NAME;
let gameIsRunning = false;

// testset();
function testset(){

    NUMBER_OF_PLAYER = 5;
    PLAYERS_NAME = ["adi", "bima", "cinta", "dika", "eren"];
    let coordinate = ["0 0 0", "1 1 1", "2 2 2", "3 3 3", "4 4 4"];

    let seed = generateRandomTeleport();
    for(i = 0; i < NUMBER_OF_PLAYER; i++){
        console.log(`tp ${PLAYERS_NAME[i]} ${coordinate[seed[i]]}`)
    }

}

// Body

function generateRandomTeleport(){
    let array = [];
    let j = 0;
    for(j = 0; j < NUMBER_OF_PLAYER; j++){
        array[j] = j;
    }

    let m = array.length, t, i;
    while(m){
        i = Math.floor(Math.random() * --m);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    console.log(array);

    return array;
}

async function initialise(command){
    NUMBER_OF_PLAYER = 0;
    PLAYERS_NAME = [""];
    gameIsRunning = true;

    let array = command.split(" ");
    NUMBER_OF_PLAYER = array[1];

    server.send(`scoreboard objectives add game dummy "Deathswap"`);
    // server.send(`scoreboard objectives add death deathCount "Death Counter"`);

    let i = 0;
    for(i = 0; i < NUMBER_OF_PLAYER; i++){
        PLAYERS_NAME[i] = array[i + 2];
        
        server.send(`scoreboard players set ${PLAYERS_NAME[i]} game 1`);
        server.send(`gamemode survival ${PLAYERS_NAME[i]}`);
        server.send(`clear ${PLAYERS_NAME[i]}`);
        server.send(`spawn ${PLAYERS_NAME[i]}`);
    }

    server.send(`scoreboard objectives setdisplay sidebar game`);
}

async function sendStartingMessage(){
    let toSend = "say ";
    toSend += `Starting Deathswap with ${NUMBER_OF_PLAYER} players, as following:\n`
    let i = 0;
    for(i = 0; i < NUMBER_OF_PLAYER; i++){
        toSend += `${i + 1}) ${PLAYERS_NAME[i]}\n`;
    }

    server.send(toSend);
    await sleep(5000);
    server.send(`say Starting in`);
    await sleep(1000);
    server.send(`say 3...`);
    await sleep(1000);
    server.send(`say 2...`);
    await sleep(1000);
    server.send(`say 1...`);
    await sleep(1000);
    server.send(`say Go!`);
}

async function getCoordinate(n){
    // Receives string from the command "data get entity xxx Pos"
    let toReturn = "Default";
    let input = await server.send(`data get entity ${PLAYERS_NAME[n]} Pos`)

    input = input.toString();
    input = input.split("[")[1].split("]")[0].replace(/,/g ,'').replace(/d/g ,'');

    toReturn = input;

    return toReturn;
}

async function getAllCoordinate(){
    let coordinate = [""];

    let i = 0;
    for(i = 0; i < NUMBER_OF_PLAYER; i++){
        coordinate[i] = await getCoordinate(i);
    }

    return coordinate;
}

async function deathswap(command){
    await initialise(command);
    await sendStartingMessage();

    let round = 0;

    while(true){
        if(!gameIsRunning) return;

        round++;
        server.send(`say Round ${round} start!`);
        server.send(`scoreboard objectives modify game displayname "Round ${round}"`);

        // await sleep(290000);

        if(!gameIsRunning) return;

        server.send(`say Swapping players in 10 seconds...`);
        await sleep(5000);
        server.send(`say 5...`);
        await sleep(1000);
        server.send(`say 4...`);
        await sleep(1000);
        server.send(`say 3...`);
        await sleep(1000);
        server.send(`say 2...`);
        await sleep(1000);
        server.send(`say 1...`);
        await sleep(500);

        getAllCoordinate().then(async coordinate => {
            server.send(`say Swapping...`);

            // Swaps player location randomly
            let seed = generateRandomTeleport();
            for(i = 0; i < NUMBER_OF_PLAYER; i++){
                server.send(`tp ${PLAYERS_NAME[i]} ${coordinate[seed[i]]}`);
            }

            // Swaps player location circly
            // for(i = 0; i < NUMBER_OF_PLAYER; i++){
            //     if(i == NUMBER_OF_PLAYER - 1){
            //         server.send(`tp ${PLAYERS_NAME[i]} ${coordinate[0]}`);
            //         console.log(`tp ${PLAYERS_NAME[i]} ${coordinate[0]}`)
            //     }
            //     else{
            //         server.send(`tp ${PLAYERS_NAME[i]} ${coordinate[i + 1]}`);
            //         console.log(`tp ${PLAYERS_NAME[i]} ${coordinate[i + 1]}`)
            //     }
            // }
        });
        sleep(5000);

    }
}

async function removePlayer(command){
    let name = command.split(" ")[1];
    let index = PLAYERS_NAME.indexOf(name)

    if(index == -1) return;
    
    PLAYERS_NAME.splice(index, 1);
    NUMBER_OF_PLAYER--;
    
    server.send(`scoreboard players reset ${name} game`);
    server.send(`gamemode spectator ${name}`);
    server.send(`say ${name} has died... (${NUMBER_OF_PLAYER} players left)`);
    
    if(NUMBER_OF_PLAYER <= 1){
        server.send(`say ${PLAYERS_NAME[0]} wins!`);
        server.send(`gamemode creative @a`);

        server.send(`scoreboard objectives remove game`);

        gameIsRunning = false;
    }

    return name;
}

server.on('chat', event => {
    let command = event.message.toString();
    console.log("Received text: " + command);

    if(command.startsWith("start")){
        deathswap(command);
    }

    if(command.startsWith("remove")){
        removePlayer(command);
    }

})

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}