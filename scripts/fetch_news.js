const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const CHANNEL_URL = 'https://t.me/s/mshmaktab1';
const OUTPUT_FILE = path.join(__dirname, '../news.json');
const IMAGES_BASE_DIR = path.join(__dirname, '../images');
const VIDEOS_BASE_DIR = path.join(__dirname, '../videos');

// Ensure base directories exist
if (!fs.existsSync(IMAGES_BASE_DIR)) fs.mkdirSync(IMAGES_BASE_DIR, { recursive: true });
if (!fs.existsSync(VIDEOS_BASE_DIR)) fs.mkdirSync(VIDEOS_BASE_DIR, { recursive: true });

/**
 * Downloads a media file (image or video) from a URL and saves it locally.
 */
async function downloadMedia(url, filename, monthName) {
    if (!url) return null;
    try {
        // Determine month folder path
        const mediaBaseDir = filename.startsWith('video') ? VIDEOS_BASE_DIR : IMAGES_BASE_DIR;
        const monthDir = path.join(mediaBaseDir, monthName);
        if (!fs.existsSync(monthDir)) {
            fs.mkdirSync(monthDir, { recursive: true });
        }
        const localPath = path.join(monthDir, filename);
        const relativePath = `${mediaBaseDir.split(path.sep).pop()}/${monthName}/${filename}`;
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
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    const dateStr = `${day}${month}${year}`;
    const timeStr = `${hours}${minutes}`;

    // Extract numeric ID from "mshmaktab1/563" -> "563"
    const numericId = id && id.includes('/') ? id.split('/').pop() : '0';

    const ext = type === 'video' ? 'mp4' : 'jpg';
    return `${type}_${dateStr}_${timeStr}_${numericId}.${ext}`;
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
        const $textContainer = $msg.find('.tgme_widget_message_text');

        // 1. Preserve line breaks before getting text
        $textContainer.find('br').replaceWith('\n');

        // 2. Ensure spaces between tags (like hashtags in <a> tags)
        $textContainer.find('*').each((i, tag) => {
            const nextNode = tag.nextSibling;
            if (nextNode && nextNode.nodeType === 3 && nextNode.nodeValue && !nextNode.nodeValue.startsWith(' ')) {
                // If next sibling is text but starting without space, add a space if tag is a link/hashtag
                if (tag.tagName === 'A') {
                    // We don't want to break the structure, but we need a space for extraction
                    // Actually, a simpler way: just append a space temporarily
                }
            }
        });

        let text = $textContainer.text();

        // 3. Fix "stuck" words: lowercase/uzbek-char then uppercase (sentence start)
        // e.g., "tabrigiAssalomu" -> "tabrigi\nAssalomu"
        text = text.replace(/([a-z'‘])([A-ZА-ЯЁ])/g, '$1\n$2');

        // 4. Force NEW LINE after hashtags ONLY if followed by a CAPITAL letter
        // BUT ignore it if there's an underscore before the capital letter (part of hashtag)
        // e.g. #maktab_hayotiAssalomu -> split
        // e.g. #You_Tube -> DON'T split
        text = text.replace(/(#[^\s#.,!?;:()\[\]{}'"]+[^_])([A-ZА-ЯЁ])/g, '$1\n$2');

        // 5. Clean up multiple newlines
        text = text.replace(/\n{3,}/g, '\n\n').trim();

        const textHtml = $textContainer.html();
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
                    isVideoPlaceholder
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
            if (!batch || batch.length === 0) break;
        } catch (error) {
            console.error(`CRITICAL error: ${error.message}`);
            break;
        }

        allNews.push(...batch);
        const oldestInBatch = batch[0];
        const oldestDate = new Date(oldestInBatch.date);
        oldestId = oldestInBatch.id && oldestInBatch.id.includes('/') ? oldestInBatch.id.split('/')[1] : oldestInBatch.id;

        console.log(`Batch processed. Current total: ${allNews.length}. Oldest date: ${oldestDate.toISOString().split('T')[0]}`);

        if (oldestDate <= STOP_DATE || allNews.length > 2000) keepCrawling = false;
        await new Promise(r => setTimeout(r, 1000));
    }

    // Deduplicate and localize
    const uniqueNews = Array.from(new Map(allNews.map(item => [item.id, item])).values());
    console.log(`Total unique posts found: ${uniqueNews.length}`);

    // Manual Overrides Folders
    const manualImagesDir = path.join(IMAGES_BASE_DIR, 'manual');
    const manualVideosDir = path.join(VIDEOS_BASE_DIR, 'manual');
    if (!fs.existsSync(manualImagesDir)) fs.mkdirSync(manualImagesDir, { recursive: true });
    if (!fs.existsSync(manualVideosDir)) fs.mkdirSync(manualVideosDir, { recursive: true });

    console.log("Downloading/Verifying media assets...");

    for (const item of uniqueNews) {
        try {
            const dateObj = new Date(item.date);
            const monthName = dateObj.toLocaleString('en-US', { month: 'long' }).toLowerCase();
            const numericId = item.id.split('/').pop();

            // Check Manual Override
            let manualFound = false;
            const exts = ['.jpg', '.png', '.jpeg', '.webp'];
            for (const ext of exts) {
                if (fs.existsSync(path.join(manualImagesDir, numericId + ext))) {
                    item.image = `images/manual/${numericId}${ext}`;
                    console.log(`  [OVERRIDE] Manual image for ${numericId}`);
                    manualFound = true; break;
                }
            }
            if (fs.existsSync(path.join(manualVideosDir, numericId + '.mp4'))) {
                item.video = `videos/manual/${numericId}.mp4`;
                console.log(`  [OVERRIDE] Manual video for ${numericId}`);
                manualFound = true;
            }

            if (manualFound) continue;

            // Telegram Downloads
            if (item.externalImage && item.externalImage.startsWith('http')) {
                const monthDir = path.join(IMAGES_BASE_DIR, monthName);
                if (!fs.existsSync(monthDir)) fs.mkdirSync(monthDir, { recursive: true });
                const filename = generateMediaFilename('img', item.date, item.text, item.id);
                const localPath = path.join(monthDir, filename);

                if (!fs.existsSync(localPath)) {
                    try {
                        const res = await axios({ url: item.externalImage, responseType: 'stream', timeout: 10000 });
                        const writer = fs.createWriteStream(localPath);
                        res.data.pipe(writer);
                        await new Promise((r, j) => { writer.on('finish', r); writer.on('error', j); });
                        item.image = `images/${monthName}/${filename}`;
                    } catch (e) { console.error(`Failed ID ${item.id} image: ${e.message}`); }
                } else {
                    item.image = `images/${monthName}/${filename}`;
                }
            }

            if (item.externalVideo && item.externalVideo.startsWith('http')) {
                const monthDir = path.join(VIDEOS_BASE_DIR, monthName);
                if (!fs.existsSync(monthDir)) fs.mkdirSync(monthDir, { recursive: true });
                const filename = generateMediaFilename('video', item.date, item.text, item.id);
                const localPath = path.join(monthDir, filename);

                if (!fs.existsSync(localPath)) {
                    try {
                        const res = await axios({ url: item.externalVideo, responseType: 'stream', timeout: 30000 });
                        const writer = fs.createWriteStream(localPath);
                        res.data.pipe(writer);
                        await new Promise((r, j) => { writer.on('finish', r); writer.on('error', j); });
                        item.video = `videos/${monthName}/${filename}`;
                    } catch (e) { console.error(`Failed ID ${item.id} video: ${e.message}`); }
                } else {
                    item.video = `videos/${monthName}/${filename}`;
                }
            }
        } catch (e) { console.error(`Error processing ID ${item.id}:`, e.message); }
    }

    // Sort chronologically: Latest first
    uniqueNews.sort((a, b) => new Date(b.date) - new Date(a.date));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(uniqueNews, null, 4));
    console.log(`\nSuccessfully saved ${uniqueNews.length} items to news.json`);
}

fetchNews().catch(err => {
    console.error("\nFATAL SCRIPT ERROR:", err);
    process.exit(1);
});
