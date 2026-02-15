const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
require('dotenv').config();

const CHANNEL_URL = 'https://t.me/s/mshmaktab1';
const OUTPUT_FILE = path.join(__dirname, '../news.json');

async function fetchNews() {
    try {
        console.log(`Scraping news from ${CHANNEL_URL}...`);

        const response = await axios.get(CHANNEL_URL);
        const html = response.data;
        const $ = cheerio.load(html);
        const news = [];

        // Select all message wraps
        $('.tgme_widget_message_wrap').each((index, element) => {
            const $element = $(element);

            // Extract message ID from the data-post attribute of the inner message div
            const messageId = $element.find('.tgme_widget_message').attr('data-post');

            // Extract text content
            const textHtml = $element.find('.tgme_widget_message_text').html();
            const text = $element.find('.tgme_widget_message_text').text();

            // Extract date
            const dateStr = $element.find('.tgme_widget_message_date time').attr('datetime');

            // Extract image (if any) - getting the background image from the style attribute
            let image = null;
            let style = $element.find('.tgme_widget_message_photo_wrap').attr('style');

            // If no photo, check for video thumbnail
            if (!style) {
                style = $element.find('.tgme_widget_message_video_thumb').attr('style');
            }

            if (style) {
                const match = style.match(/background-image:url\('?(.*?)'?\)/);
                if (match && match[1]) {
                    image = match[1];
                }
            }

            if (text || image) {
                news.push({
                    id: messageId,
                    date: dateStr,
                    text: text ? text.trim() : '',
                    html: textHtml ? textHtml.trim() : '', // Keep HTML for formatting if needed
                    image: image
                });
            }
        });

        // Reverse to have newest first if they are not already
        // Telegram usually shows oldest to newest on the page, so we reverse
        // Reverse to have newest first if they are not already
        const sortedNews = news.reverse();
        console.log(`Found ${sortedNews.length} news items.`);

        // Read existing news if file exists
        let existingNews = [];
        if (fs.existsSync(OUTPUT_FILE)) {
            try {
                const fileContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
                existingNews = JSON.parse(fileContent);
            } catch (e) {
                console.warn('Could not parse existing news file, starting fresh.');
            }
        }

        // Filter out duplicates
        const newItems = sortedNews.filter(n => !existingNews.some(e => e.id === n.id));

        console.log(`New items found: ${newItems.length}`);

        // Merge: New items at top, then existing
        const finalNews = [...newItems, ...existingNews];

        // Optional: Sort again by date desc if needed, but append structure usually maintains order if grabbed sequentially.
        // Let's ensure sort by date desc
        finalNews.sort((a, b) => new Date(b.date) - new Date(a.date));

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalNews, null, 2));
        console.log(`Saved news to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Failed to scrape news:', error);
    }
}

fetchNews();
