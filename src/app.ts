// This server acts as a translation layer between librespot and the frontend
// While not strictly necessary, it serves useful for system interactons (like being able to adjust network settings on a system level, fetch cors resources, restart services etc)
import express, { Express, Request, Response } from 'express';
import child_process from 'child_process';
import WebSocket from 'ws';
import kill from 'tree-kill';
import path from 'path';
import { handleLibrespotEvent } from './librespotHandler';
import { config } from './config.json';

const app = express();
const port: number = 5000;

// Variables for spawned processes
let librespotService;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use('/', express.static('src/public'));

app.get('/', (req: Request, res: Response) => {
  res.render('pages/main');
});

app.get('/player', (req: Request, res: Response) => {
  res.render('pages/player');
});

app.listen(port, () => {
  console.log(`Starting Web Server ${port}`)
});

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('Stopping librespot4Pi ...');
  console.log('Stopping librespot service');
  librespotService.stdin.pause();
  await kill(librespotService.pid, 'SIGKILL');
  process.exit(0);
});

startLibrespot();

function startLibrespot() {
  librespotService = child_process.spawn('java', ['-jar', 'src/librespot-api-1.6.2.jar']);

  librespotService.on('close', (code) => {
    console.error(`Librespot failed to start! ${code}`);
    throw Error('Failed to start Librespot, check to see if it is not already running!');
  });
  librespotService.stdout.setEncoding('utf-8');
  librespotService.stdout.on('data', (code: string) => {
    if (code.includes('Server started on port ')) {
      startLibrespotHandler();
      librespotService.stdout.removeAllListeners('data');
    }
  });

}

function startLibrespotHandler() {
  const ws = new WebSocket(config.Librespot.event_url);

  ws.on('open', function open() {
    ws.send('something');
  });

  ws.on('message', (message: string) => {
    const data: any = JSON.parse(message);
    console.dir(data);
    handleLibrespotEvent(data, Date.now());
  });

}
