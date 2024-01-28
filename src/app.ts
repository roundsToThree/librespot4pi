// This server acts as a translation layer between librespot and the frontend
// While not strictly necessary, it serves useful for system interactons (like being able to adjust network settings on a system level, fetch cors resources, restart services etc)
import express, { Express, Request, Response } from 'express';
import child_process, { exec } from 'child_process';
import WebSocket from 'ws';
import kill from 'tree-kill';
import path from 'path';
import { spawnLibrespotInstance } from './librespotHandler';
import { PlayerConfig } from './librespotConfigBuilder';
import { config as conf } from './config.json';
import { initialise, moveRoomToInstance } from './soundController';

const app = express();
const port: number = 5000;
// Jank af to allow config to be modifyable
let config = JSON.parse(JSON.stringify(conf));
// Variables for spawned processes

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use('/', express.static('src/public'));

app.get('/', (req: Request, res: Response) => {
  res.render('pages/main');
});

app.get('/player', (req: Request, res: Response) => {
  res.render('pages/player');
});

app.get('/api/instanceFromRoom', (req: Request, res: Response) => {
  let instanceNum = null;
  let room = config.rooms.find(room => room.name == req.query.room);
  if (room != null)
    instanceNum = config.instances.findIndex(instance => instance.name == room.instance);
  res.send({ instanceNumber: instanceNum });
});

app.get('/api/moveRoom', async (req: Request, res: Response) => {
  const room = req.query.roomName;
  const instance = req.query.instanceName;
  if (room == null || instance == null) {
    res.send({ status: 'bad arguments' });
    return;
  }
  await moveRoomToInstance(room, instance);

  // Move on server side too
  const roomNum = config.rooms.findIndex(r => r.name == room);
  config.rooms[roomNum].instance = instance;

  res.send({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Starting Web Server ${port}`)

  // Start the service
  start();
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Stopping librespot4Pi ...');
  console.log('Stopping librespot service');
  await exec('killall java');
  // await kill(librespotService.pid, 'SIGKILL');
  process.exit(0);
});


// Create instances
async function start() {
  // End any java instances
  await exec('killall java');

  // Start the sound service
  await initialise();
  for (let i = 0; i < config.instances.length; ++i) {
    const instance = config.instances[i];
    const conf: PlayerConfig = {
      instanceName: instance.name,
      apiPort: 24879 + i,
      mixer: instance.mixer,
    };
    spawnLibrespotInstance(conf, i);
  }
}


/*
How to do pulseaudio routing
(Figure out how to get this at 44.1k 24bit)

-> On startup make null sinks
pactl load-module module-null-sink sink_name="Instance1"

-> Bind sink to a source  [Not sure how to get the ID yet, mostly guess and check]
pactl load-module module-remap-source master=<ID of Instance1 as a SINK> source_name=Instance_1_Source
{This is so the librespot service can have a dedicated sink (become source) that wont vary }

-> Make a combined sink (With only one sink)
pactl load-module module-combine-sink sink_name=CombinedInstance1 sink_properties=device.description=CombinedInstance1 slaves=<Room's Sink> channels=2

-> Bind source to a sink
pactl load-module module-loopback source=Instance1Source sink=CombinedInstance1

-> Start application with
PULSE_SINK=Instance1 java -jar librespot....


When adding another room, 
-> create another combined sink
-> bind the new sink to the actual sink
-> unload the original sink

*/
