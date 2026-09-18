module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = req.query.url;
  if (!url) return res.status(400).json({ error: 'URL එක දාන්න' });

  const getId = (u) => {
    const m = u.match(/(?:v=|youtu\.be\/|shorts\/)([0-9A-Za-z_-]{11})/);
    return m? m[1] : null;
  };
  const videoId = getId(url);
  if (!videoId) return res.status(400).json({ error: 'Valid YouTube URL එකක් දාන්න' });

  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.private.coffee',
    'https://pipedapi.adminforge.de'
  ];

  for (let base of instances) {
    try {
      const r = await fetch(`${base}/streams/${videoId}`);
      if (!r.ok) continue;
      const data = await r.json();
      if (!data.videoStreams) continue;

      const mp4 = data.videoStreams
       .filter(s => s.mimeType && s.mimeType.includes('mp4') && s.url)
       .sort((a,b) => (b.height || 0) - (a.height || 0))
       .slice(0, 4)
       .map(s => ({ quality: s.qualityLabel || `${s.height}p`, url: s.url }));

      if (mp4.length === 0) continue;

      return res.json({
        title: data.title,
        thumbnail: data.thumbnailUrl,
        formats: mp4
      });
    } catch (e) { continue; }
  }

  return res.status(500).json({ error: 'YouTube තාම Block - වෙන Instance එකක් Try වෙනවා. තත්පර 10කින් Refresh කරන්න' });
};
