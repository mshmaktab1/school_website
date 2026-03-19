const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const CHANNEL_URL = 'https://t.me/s/mshmaktab1';
const OUTPUT_FILE = path.join(__dirname, '../news.json');
const IMAGES_BASE_DIR = path.join(__dirname, '../images');

// Ensure base images directory exists
if (!fs.existsSync(IMAGES_BASE_DIR)) {
    fs.mkdirSync(IMAGES_BASE_DIR, { recursive: true });
}

/**
 * Downloads a media file (image or video) from a URL and saves it locally.
 */
async function downloadMedia(url, filename, monthName) {
    if (!url) return null;
    try {
        // Determine month folder path
        const monthDir = path.join(IMAGES_BASE_DIR, monthName);
        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir, { recursive: true });
        }
        const localPath = path.join(monthDir, filename);
        const relativePath = `images/${monthName}/${filename}`;
        if (fs.existsSync(localPath)) return relativePath;

        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 60000 // Longer timeout for videos
        });

        return new Promise((resolve, reject) => {
            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);
            writer.on('finish', () => resolve(relativePath));
            writer.on('error', (err) => reject(err));
        });
    } catch (error) {
        console.error(`Failed to download media ${filename}:`, error.message);
        return null;
    }
}

function generateMediaFilename(type, date, text, id) {
    const datePart = date.split('T')[0];
    const sanitizedText = text ? text.substring(0, 20).toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '') : '';
    const namePart = sanitizedText || id.replace(/\//g, '_');
    const ext = type === 'video' ? 'mp4' : 'jpg';
    // Filename without month; month folder will be handled separately
    return `${type}_${datePart}_${namePart}.${ext}`;
}

async function fetchSinglePost(id) {
    try {
        const url = `https://t.me/s/${id}`;
        const response = await axios.get(url, { timeout: 10000 });
        const $ = cheerio.load(response.data);
        const $element = $(`.tgme_widget_message[data-post="${id}"]`);
        if (!$element.length) return null;

        const dateStr = $element.find('.tgme_widget_message_date time').attr('datetime');
        const text = $element.find('.tgme_widget_message_text').text();
        const textHtml = $element.find('.tgme_widget_message_text').html();

        let image = null;
        let video = null;
        let style = $element.find('.tgme_widget_message_photo_wrap').attr('style');
        if (style) {
            const match = style.match(/background-image:url\('?(.*?)'?\)/);
            if (match && match[1]) image = match[1];
        }

        const $video = $element.find('video');
        if ($video.length) video = $video.attr('src');

        return {
            id,
            date: dateStr,
            text: text ? text.trim() : '',
            html: textHtml ? textHtml.replace(/background-image:url\('\/\//g, "background-image:url('https://").trim() : '',
            image,
            video,
            externalImage: image,
            externalVideo: video
        };
    } catch (error) {
        return null;
    }
}

async function fetchBatch(beforeId = null) {
    const url = beforeId ? `${CHANNEL_URL}?before=${beforeId}` : CHANNEL_URL;
    console.log(`Fetching batch from ${url}...`);
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const batch = [];

    $('.tgme_widget_message').each((i, el) => {
        const $msg = $(el);
        const id = $msg.attr('data-post');
        const text = $msg.find('.tgme_widget_message_text').text();
        const textHtml = $msg.find('.tgme_widget_message_text').html();
        const date = $msg.find('.tgme_widget_message_date time').attr('datetime');

        let image = null;
        let video = null;
        let isVideoPlaceholder = false;

        const photoStyle = $msg.find('.tgme_widget_message_photo_wrap').attr('style');
        if (photoStyle) {
            const match = photoStyle.match(/background-image:url\('?(.*?)'?\)/);
            if (match && match[1]) image = match[1];
        }

        const videoTag = $msg.find('video');
        if (videoTag.length) {
            video = videoTag.attr('src');
        } else {
            // Check for video placeholders (large videos)
            const hasVideoPlayer = $msg.find('.tgme_widget_message_video_player').length;
            const hasVideoWrap = $msg.find('.tgme_widget_message_video_wrap').length;
            if (hasVideoPlayer || hasVideoWrap) {
                isVideoPlaceholder = true;
                // Try to get thumb as temporary image if not already set
                if (!image) {
                    const thumbStyle = $msg.find('.tgme_widget_message_video_thumb').attr('style');
                    if (thumbStyle) {
                        const match = thumbStyle.match(/background-image:url\('?(.*?)'?\)/);
                        if (match && match[1]) image = match[1];
                    }
                }
            }
        }

        if (date) {
            // Junk Filtering: Exclude "Channel created" and initial test items
            const isJunk = text.toLowerCase() === 'channel created' ||
                id === 'mshmaktab1/1' ||
                id === 'mshmaktab1/2';

            if (!isJunk) {
                batch.push({
                    id, date, text,
                    html: textHtml ? textHtml.replace(/background-image:url\('\/\//g, "background-image:url('https://").trim() : '',
                    image, video,
                    externalImage: image,
                    externalVideo: video,
                    isVideoPlaceholder // Flag for recovery script
                });
            }
        }


    });

    return batch;
}

async function fetchNews() {
    const STOP_DATE = new Date('2024-10-01');
    const allNews = [];
    let oldestId = null;
    let keepCrawling = true;

    console.log("Starting deep recovery process...");

    while (keepCrawling) {
        let batch;
        try {
            batch = await fetchBatch(oldestId);
        } catch (error) {
            console.error(`Failed to fetch batch: ${error.message}`);
            break;
        }

        if (batch.length === 0) break;

        allNews.push(...batch);
        const oldestInBatch = batch[0]; // Telegram displays oldest first in batch
        const oldestDate = new Date(oldestInBatch.date);
        oldestId = oldestInBatch.id.split('/')[1];

        console.log(`Reached date: ${oldestDate.toISOString().split('T')[0]}`);

        if (oldestDate <= STOP_DATE) {
            console.log("Reached date threshold (Oct 2024). Stopping crawl.");
            keepCrawling = false;
        }

        // Safety break if it's getting too huge for memory, though 500-1000 posts is fine
        if (allNews.length > 1000) keepCrawling = false;
    }

    // Deduplicate and localize
    const uniqueNews = Array.from(new Map(allNews.map(item => [item.id, item])).values());
    console.log(`Total unique posts found: ${uniqueNews.length}`);

    for (const item of uniqueNews) {
        // Determine month name from the item's date (e.g., "march", "april")
        const dateObj = new Date(item.date);
        const monthName = dateObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();

        // Handle Image
        if (item.externalImage && item.externalImage.startsWith('http')) {
            const filename = generateMediaFilename('rasm', item.date, item.text, item.id);
            const localPath = await downloadMedia(item.externalImage, filename, monthName);
            if (localPath) item.image = localPath;
        }

        // Handle Video
        if (item.externalVideo && item.externalVideo.startsWith('http')) {
            const filename = generateMediaFilename('video', item.date, item.text, item.id);
            const localPath = await downloadMedia(item.externalVideo, filename, monthName);
            if (localPath) item.video = localPath;
        }
    }

    uniqueNews.sort((a, b) => new Date(b.date) - new Date(a.date));
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueNews, null, 2));
    console.log(`Successfully saved ${uniqueNews.length} items to ${OUTPUT_FILE}`);
}

fetchNews();
