const fs = require('fs');
const axios = require('axios');
const path = require('path');

const newsFile = path.resolve(__dirname, '../news.json');
let newsData = JSON.parse(fs.readFileSync(newsFile, 'utf8'));

async function recoverVideos() {
    console.log("Starting video recovery process...");
    let changed = false;

    for (let item of newsData) {
        // If it's marked as placeholder or has keywords but no video
        const text = (item.text || '').toLowerCase();
        const needsRecovery = item.isVideoPlaceholder ||
            (!item.video && (text.includes('video') || text.includes('videolavha') || text.includes('chellenj')));

        if (needsRecovery && !item.video) {
            const postUrl = `https://t.me/${item.id}`;
            console.log(`Analyzing suspected video post: ${postUrl}`);

            try {
                // We fetch the direct post page which might have OG tags
                const response = await axios.get(postUrl);
                const html = response.data;

                // Try to find og:video or direct video tags in the full page
                const videoMatch = html.match(/<meta property="og:video" content="(.*?)"/i) ||
                    html.match(/<video src="(.*?)"/i);

                if (videoMatch && videoMatch[1]) {
                    const videoUrl = videoMatch[1].startsWith('//') ? 'https:' + videoMatch[1] : videoMatch[1];
                    console.log(`✅ Found video source: ${videoUrl}`);
                    item.video = videoUrl;
                    item.externalVideo = videoUrl;
                    changed = true;
                } else {
                    console.log(`❌ Could not find video source for ${item.id} via standard scrape.`);
                    // We keep isVideoPlaceholder to potentially try another method later
                }
            } catch (error) {
                console.error(`Error fetching ${postUrl}: ${error.message}`);
            }

            // Wait a bit to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    if (changed) {
        fs.writeFileSync(newsFile, JSON.stringify(newsData, null, 2));
        console.log("news.json updated with recovered videos.");
    } else {
        console.log("No new videos recovered.");
    }
}

recoverVideos();
