/**
 * YouTube Video Processing Utilities for Glim
 *
 * This module handles the extraction of video information
 * and transcripts from YouTube videos.
 *
 * @module youtubeProcessor
 * @author Bagi
 */
import { JSDOM } from "jsdom";
import TranscriptAPI from "youtube-transcript-api";
import { config } from "../config.js";
import logger from "./logger.js";

/**
 * Extract YouTube video ID from URL
 * Supports various YouTube URL formats
 *
 * @param {string} url - The YouTube video URL
 * @returns {string|null} The extracted video ID or null if invalid
 */
export function extractVideoId(url) {
    if (!url) return null;

    try {
        // Try various YouTube URL patterns
        const patterns = [
            /(?:v=|\/)([0-9A-Za-z_-]{11})/, // Standard and share URLs
            /youtu\.be\/([0-9A-Za-z_-]{11})/, // Short youtu.be URLs
            /embed\/([0-9A-Za-z_-]{11})/, // Embed URLs
            /youtube:\/\/watch\?v=([0-9A-Za-z_-]{11})/, // YouTube app URLs
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) return match[1];
        }

        return null;
    } catch (err) {
        logger.error(`Error extracting video ID: ${err.message}`);
        return null;
    }
}

/**
 * Get comprehensive information about a YouTube video
 * including title, transcript, and thumbnail URL
 *
 * @param {string} url - The YouTube video URL
 * @returns {Object} Object containing video info or error
 */
export async function getVideoInfo(url, _lang) {
    const videoId = extractVideoId(url);
    if (!videoId) {
        logger.error(`Invalid YouTube URL: ${url}`);
        return { error: "Invalid YouTube URL" };
    }

    logger.info(`Processing video ID: ${videoId}`);

    try {
        // Fetch page content and extract title
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
        }

        const html = await res.text();
        const dom = new JSDOM(html);
        const title =
            dom.window.document
                .querySelector("title")
                ?.textContent.replace(" - YouTube", "") ||
            `YouTube Video (${videoId})`;

        // Get high-resolution thumbnail
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        // Extract transcript using specified language
        const lang = _lang || config.content?.codeLang || "en";
        logger.info(`Fetching transcript in language: ${lang}`);

        let transcriptData;

        try {
            logger.info(`Attempting transcript fetch in language: ${lang}`);
            transcriptData = await TranscriptAPI.getTranscript(videoId, lang);
        } catch (err) {
            logger.warn(
                `Failed to fetch transcript in ${lang}, trying English fallback...`,
            );
            transcriptData = await TranscriptAPI.getTranscript(videoId);
        }
        if (!transcriptData || transcriptData.length === 0) {
            throw new Error(
                "Could not extract video transcript. Video might not have captions.",
            );
        }

        const transcript = transcriptData.map((entry) => entry.text).join(" ");

        logger.info(`Successfully processed video: ${title}`);
        return {
            title,
            transcript,
            thumbnail_url: thumbnailUrl,
            video_id: videoId,
            duration:
                transcriptData.length > 0
                    ? transcriptData[transcriptData.length - 1].offset +
                      transcriptData[transcriptData.length - 1].duration
                    : 0,
        };
    } catch (err) {
        logger.error(`Error processing video: ${err.message}`);
        return { error: err.message };
    }
}

/**
 * Direct module execution for testing
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const testUrl = "https://www.youtube.com/watch?v=_1f-o0nqpEI";
    logger.info(`Testing with URL: ${testUrl}`);

    try {
        const result = await getVideoInfo(testUrl);
        console.log(JSON.stringify(result, null, 2));

        if (result.error) {
            console.error(`Test failed: ${result.error}`);
            process.exit(1);
        } else {
            console.log("Test successful!");
        }
    } catch (err) {
        console.error(`Uncaught error during test: ${err.message}`);
        process.exit(1);
    }
}
