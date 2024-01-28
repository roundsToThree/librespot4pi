import toml from 'toml';
import json2toml from 'json2toml';
import fs from 'fs';
import crypto from 'crypto';

export interface PlayerConfig {
    instanceName: string,
    apiPort: number, 
    mixer: string, // Keywords to look for in mixer
}

export function createConfig(config: PlayerConfig): string {
    
    // Open the default config
    let data = toml.parse(fs.readFileSync('src/default.toml').toString());

    // Set the config
    data.deviceName = config.instanceName;
    data.api.port = config.apiPort;
    data.player.mixerSearchKeywords = config.mixer;

    // Save to a .toml file with id
    data = json2toml(data);
    const id = crypto.randomBytes(8).toString("hex");
    fs.mkdirSync('tmp', { recursive: true });
    fs.writeFileSync('tmp/' + id + '.toml', data);

    return id;
}



