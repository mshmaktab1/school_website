const axios = require('axios');
const cheerio = require('cheerio');

const url = 'https://t.me/s/mshmaktab1';

axios.get(url).then(response => {
    const $ = cheerio.load(response.data);
    $('.tgme_widget_message').each((i, el) => {
        const id = $(el).attr('data-post');
        const text = $(el).find('.tgme_widget_message_text').text().substring(0, 50);
        const hasVideoTag = $(el).find('video').length;
        const hasVideoWrap = $(el).find('.tgme_widget_message_video_wrap').length;
        const hasVideoPlayer = $(el).find('.tgme_widget_message_video_player').length;

        if (id === 'mshmaktab1/456' || id === 'mshmaktab1/494') {
            console.log(`ID: ${id}`);
            console.log(`HTML: ${$(el).find('.tgme_widget_message_video_player').html()}`);
            console.log('---');
        }
    });

}).catch(err => console.error(err));
