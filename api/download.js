module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;
  const id = url?.match(/(?:v=|be\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1];
  if (!id) return res.status(400).json({ error: 'Invalid YouTube URL' });

  // 2026 working instances
  const apis = [
    `https://pipedapi.adminforge.de/streams/${id}`,
    `https://api.piped.private.coffee/streams/${id}`,
    `https://pipedapi.mha.fi/streams/${id}`,
    `https://inv.nadeko.net/api/v1/videos/${id}`
  ];

  for (let api of apis) {
    try {
      const r = await fetch(api, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const d = await r.json();

      // Invidious format
      if (d.formatStreams) {
        return res.json({
          title: d.title,
          thumbnail: d.videoThumbnails?.pop()?.url,
          formats: d.formatStreams.filter(f=>f.container==='mp4').slice(0,3).map(f=>({quality:f.qualityLabel, url:f.url}))
        });
      }
      // Piped format
      if (d.videoStreams) {
        return res.json({
          title: d.title,
          thumbnail: d.thumbnailUrl,
          formats: d.videoStreams.filter(s=>s.mimeType?.includes('mp4')).slice(0,3).map(s=>({quality:s.qualityLabel, url:s.url}))
        });
      }
    } catch(e){ continue; }
  }
  return res.status(500).json({ error: 'All APIs down, try again in 30 sec' });
};
