const ytdl = require('@distube/ytdl-core');
const cors = require('cors');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url || req.body?.url;
  if (!url) return res.status(400).json({ error: 'URL එක දාන්න' });

  try {
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'YouTube ලින්ක් එක වැරදියි' });
    }

    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');

    // හොඳම Quality 3ක් ගන්නවා
    const best = formats
     .filter(f => f.container === 'mp4')
     .sort((a,b) => b.height - a.height)
     .slice(0, 3)
     .map(f => ({
        quality: f.qualityLabel,
        url: f.url,
        size: f.contentLength? (f.contentLength / 1024 / 1024).toFixed(1) + ' MB' : 'Unknown'
      }));

    return res.json({
      title: info.videoDetails.title,
      thumbnail: info.videoDetails.thumbnails[0].url,
      formats: best
    });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message, hint: 'YouTube එක Block කරලා - විනාඩි 2කින් ආයේ Try කරන්න' });
  }
};
