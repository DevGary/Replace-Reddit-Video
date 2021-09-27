export interface Level {
    url: string;
    bitrate: number;
    name: string;
    codecs: string;
    width: number;
    height: number;
}

export interface MANIFEST_PARSED_Data {
    levels: Level[];
    firstLevel: number;
}

export interface LEVEL_SWITCHED_Data {
    url: string;
    level: number;
}