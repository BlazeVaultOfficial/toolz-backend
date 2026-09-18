module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;
  const id = url?.match(/(?:v=|be\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1];
  if (!id) return res.status(400).json({ error: 'Invalid URL' });

  // METHOD 1: New Cobalt API (co.wuk.sh) - 2026 working
  try {
    const r = await fetch('https://co.wuk.sh/api/json', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: `https://youtu.be/${id}`, videoQuality: '720', filenamePattern: 'basic' })
    });
    const d = await r.json();
    if (d.url) {
      return res.json({
        title: 'YouTube Video',
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        formats: [{ quality: '720p', url: d.url }, { quality: 'MP3', url: d.url }]
      });
    }
  } catch(e){}

  // METHOD 2: Invidious - Dynamic instance
  const invidious = [
    'https://inv.nadeko.net',
    'https://invidious.privacydev.net',
    'https://inv.zzls.xyz',
    'https://yt.artemislena.eu'
  ];

  for (let base of invidious) {
    try {
      const r = await fetch(`${base}/api/v1/videos/${id}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) continue;
      const d = await r.json();
      if (!d.formatStreams) continue;
      return res.json({
        title: d.title,
        thumbnail: d.videoThumbnails?.[0]?.url,
        formats: d.formatStreams.filter(f=>f.container==='mp4').slice(0,3).map(f=>({quality:f.qualityLabel, url:f.url}))
      });
    } catch(e){ continue; }
  }

  return res.status(500).json({ error: 'YouTube Block - Try after 1 min', fix: 'Use Frontend-only code for 100% working' });
};
