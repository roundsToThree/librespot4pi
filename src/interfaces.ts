export interface Track {
    trackName: string,
    albumName: string,
    artists: string[],
    duration: number,
    // This url must be accessible through CORS
    coverURL: string,
}
// UNKN is if the song was changed and not next/prev
export type TrackDirection = 'PREV' | 'NEXT' | 'UNKN';

export interface TrackUpdate {
    direction: TrackDirection,
    time: number,
}