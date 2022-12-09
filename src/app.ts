// This server acts as a translation layer between librespot and the frontend
// While not strictly necessary, it serves useful for system interactons (like being able to adjust network settings on a system level, fetch cors resources, restart services etc)
import express, { Express, Request, Response } from 'express';
import child_process from 'child_process';
import WebSocket from 'ws';


const app = express();
const port: number = 5000;

// Variables for spawned processes
let librespotService;

app.set('view engine', 'ejs');
app.use('/', express.static('public'));

app.get('/', (req: Request, res: Response) => {
  res.render('pages/main');
});

app.listen(port, () => {
  console.log(`Starting Pispot Server ${port}`)
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('Stopping rpispot ...');
  console.log('Stopping librespot service');
  librespotService.stdin.pause();
  librespotService.kill('SIGTERM');
  process.exit(0);
});

startLibrespot();

function startLibrespot() {
  librespotService = child_process.spawn('java', ['-jar', 'src/librespot-api-1.6.2.jar']);

  librespotService.on('close', (code) => {
    console.error(`Librespot failed to start! ${code}`);
    throw Error('Failed to start Librespot, check to see if it is not already running!');
  });


  const ws = new WebSocket('ws://0.0.0.0:24879/events');

  ws.on('open', function open() {
    ws.send('something');
  });
  
  ws.on('message', function message(data) {
    handleLibrespotEvent(data, Date.now());
  });

}

// // loadTrackData();
// async function loadTrackData() {
//   const opt = {
//     method: 'GET',
//     headers: {
//       Accept: 'application/json',
//       'Content-Type': 'application/json',
//       Authorization: 'Bearer BQA0Qs2C_2xmhOUWfzWOBw_Luc4uxl1nhwxlBBql5FNA63MgNaqbvHmJ0CBTkzdQi5MOmnoLam50mdmu7UCe4S8Njgu_W9QyolABTsqRO1t6YJi_x6iaaz3W48U0CFGrZwTcqhPwgLcogzXZ_evuqux3Jd33VbgrqoCBhNKMW1kzEZSC5w',
//     }
//   };

//   const response = await fetch('https://api.spotify.com/v1/tracks/73QSYYgsMuF6I7aiLFDuvG?market=AU', opt);
//   const data = await response.json();

//   console.dir(data);
// }