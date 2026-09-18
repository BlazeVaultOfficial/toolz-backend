module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL එක දාන්න' });

  try {
    // Cobalt API එක - YouTube Block එක bypass කරනවා
    const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        vCodec: 'h264',
        vQuality: '720',
        aFormat: 'mp3',
        isAudioOnly: false
      })
    });
    
    const data = await cobaltRes.json();
    
    if (data.status === 'error' || data.status === 'rate-limit') {
        throw new Error(data.text || 'Cobalt error');
    }

    // y2mate style response එකක් හදනවා
    return res.json({
      title: 'YouTube Video - Ready to Download',
      thumbnail: `https://img.youtube.com/vi/${url.split('v=')[1]?.split('&')[0] || url.split('/').pop().split('?')[0]}/hqdefault.jpg`,
      formats: [
        { quality: '720p', url: data.url },
        { quality: '720p - Backup', url: data.url }
      ]
    });

  } catch (e) {
    // Fallback - Piped API
    try {
        const videoId = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/)?.[1] || url.split('/').pop();
        const pipedRes = await fetch(`https://pipedapi.kavin.rocks/streams/${videoId}`);
        const pipedData = await pipedRes.json();
        
        return res.json({
          title: pipedData.title,
          thumbnail: pipedData.thumbnailUrl,
          formats: pipedData.videoStreams.filter(s=>s.mimeType.includes('mp4')).slice(0,3).map(s=>({quality: s.quality, url: s.url}))
        });
    } catch (e2) {
        return res.status(500).json({ error: 'YouTube Block කරලා - විනාඩි 2කින් Try කරන්න', hint: e.message });
    }
  }
};
