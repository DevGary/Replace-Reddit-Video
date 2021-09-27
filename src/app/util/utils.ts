export class Utils {

    static parseRedditVideoIdFromRedditVideoUrl(redditVideoUrl: string) : string {
        return redditVideoUrl.split("https://v.redd.it/")[1].split("/")[0];
    }
    
    static isHLSPlaylist(redditVideoUrl: string) : boolean {
        return redditVideoUrl.includes("HLSPlaylist.m3u8");
    }

    /**
     * Creates potential fallback urls. Since we are creating them manually, many will be invalid as
     * Reddit has changed the format of the fallback urls many times. The <video> element should
     * go through each source until it finds one that is playable.
     *
     * @param redditVideoId
     * @param quality
     * @returns HTMLAllCollection of video source elements
     */
    static buildPotentialFallbackUrlVideoSources(redditVideoId: string) : HTMLSourceElement[] {

        let sources = [];

        sources.push(...Utils.buildPotentialFallbackSourceAllTypes(redditVideoId, "1080"));
        sources.push(...Utils.buildPotentialFallbackSourceAllTypes(redditVideoId, "720"));
        sources.push(...Utils.buildPotentialFallbackSourceAllTypes(redditVideoId, "480"));
        sources.push(...Utils.buildPotentialFallbackSourceAllTypes(redditVideoId, "360"));
        sources.push(...Utils.buildPotentialFallbackSourceAllTypes(redditVideoId, "240"));

        return sources;
    }

    private static buildPotentialFallbackSourceAllTypes(redditVideoId: string, quality: string): HTMLSourceElement[] {

        let sources = [];

        sources.push(Utils.buildPotentialFallbackSourceTypeVersion1(redditVideoId, quality));
        sources.push(Utils.buildPotentialFallbackSourceTypeVersion2(redditVideoId, quality));
        sources.push(Utils.buildPotentialFallbackSourceTypeVersion3(redditVideoId, quality));

        return sources;
    }

    private static buildPotentialFallbackSourceTypeVersion1(redditVideoId: string, quality: string) : HTMLSourceElement {
        let source = document.createElement("source");
        source.type = "video/mp4";
        source.src = `https://v.redd.it/${redditVideoId}/DASH_${quality}.mp4?source=fallback`;

        return source;
    }

    private static buildPotentialFallbackSourceTypeVersion2(redditVideoId: string, quality: string) : HTMLSourceElement {
        let source = document.createElement("source");
        source.type = "video/mp4";
        source.src = `https://v.redd.it/${redditVideoId}/DASH_${quality}?source=fallback`;

        return source;
    }

    private static buildPotentialFallbackSourceTypeVersion3(redditVideoId: string, quality: string) : HTMLSourceElement {
        let source = document.createElement("source");
        source.type = "video/mp4";
        source.src = `https://v.redd.it/${redditVideoId}/DASH_9_6_M?source=fallback`;

        return source;
    }

    static buildVideoSource(videoUrl: string) : HTMLSourceElement {
        let source = document.createElement("source");
        source.type = "video/mp4";
        source.src = videoUrl;

        return source;
    }
}