export interface Metadata {
    trackName: string,
    albumName: string,
    artists: string[],
    duration: number,
    // This url must be accessible through CORS
    coverUrl: string,
}
// UNKN is if the song was changed and not next/prev
// export type TrackDirection = 'PREV' | 'NEXT' | 'UNKN';

// export interface TrackUpdate {
//     direction: TrackDirection,
//     time: number,
// }

export interface Axios {
    data: any,
    status: number,
}